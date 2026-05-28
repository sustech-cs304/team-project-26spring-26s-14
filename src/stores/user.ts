import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase'

export const useUserStore = defineStore('user', () => {
  const user = ref<any>(null)
  const profile = ref<any>(null)
  const loading = ref(false)
  const unreadMsgCount = ref(0)
  const unreadNotifCount = ref(0)

  const init = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      user.value = currentUser
      await fetchUser()
      startPollingUnread()
    }
  }

  const fetchUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    user.value = currentUser
    if (currentUser) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      profile.value = data
    }
  }

  const startPollingUnread = () => {
    const check = async () => {
      if (!user.value) return
      const me = user.value.id

      // 未读消息
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', me)
        .eq('is_read', false)

      // 未读通知
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', me)
        .eq('is_read', false)

      unreadMsgCount.value = msgCount || 0
      unreadNotifCount.value = notifCount || 0
    }
    check()
    setInterval(check, 10000)
  }

  const signUp = async (email: string, password: string, studentId: string, nickname: string) => {
    const allowedDomains = ['sustech.edu.cn', 'mail.sustech.edu.cn']
    const isValidEmail = allowedDomains.some(domain => email.endsWith(`@${domain}`))
    if (!isValidEmail) {
      throw new Error('请使用深圳科技大学校园邮箱注册')
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { student_id: studentId, nickname } }
    })
    if (error) throw error
    return data
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    await fetchUser()
    startPollingUnread()
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
    unreadMsgCount.value = 0
    unreadNotifCount.value = 0
  }

  return { user, profile, loading, unreadMsgCount, unreadNotifCount, init, fetchUser, signUp, signIn, signOut }
})
