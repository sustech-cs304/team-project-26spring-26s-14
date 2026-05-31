import { supabase } from '../supabase'

// 获取与某用户的历史消息
export async function getMessages(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  
  const me = user.id
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${me},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${me})`)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
}

// 发送消息
export async function sendMessage(receiverId: string, content: string, itemId?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content,
      item_id: itemId || null
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// 获取当前用户的所有对话列表（带未读数 + 头像）
export async function getConversations() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  
  const me = user.id
  
  // 获取所有涉及当前用户的消息
  const { data: allMessages, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // 按对话分组
  const conversations = new Map()
  allMessages?.forEach((msg: any) => {
    const otherId = msg.sender_id === me ? msg.receiver_id : msg.sender_id
    if (!conversations.has(otherId)) {
      conversations.set(otherId, {
        otherUserId: otherId,
        lastMessage: msg.content,
        lastTime: msg.created_at,
        unreadCount: 0
      })
    }
    // 统计对方发给我的未读消息
    if (msg.sender_id === otherId && msg.receiver_id === me && !msg.is_read) {
      conversations.get(otherId).unreadCount++
    }
  })
  
  // 获取对方资料（昵称 + 头像）
  const userIds = Array.from(conversations.keys())
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')  // ← 加了 avatar_url
      .in('id', userIds)
    
    profiles?.forEach((p: any) => {
      if (conversations.has(p.id)) {
        const conv = conversations.get(p.id)
        conv.nickname = p.nickname
        conv.avatar_url = p.avatar_url || ''  // ← 加上头像
      }
    })
  }
  
  return Array.from(conversations.values())
}

// 标记与某用户的所有消息为已读
export async function markMessagesAsRead(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', otherUserId)
    .eq('receiver_id', user.id)
    .eq('is_read', false)
}

// 标记所有未读消息为已读（进入消息中心时用）
export async function markAllMessagesAsRead() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false)
}

// 订阅实时消息（备用）
export function subscribeToMessages(callback: (payload: any) => void) {
  return supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, callback)
    .subscribe()
}
