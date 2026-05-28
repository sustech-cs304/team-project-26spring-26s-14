import { supabase } from '../supabase'

export async function getMyWishes() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  const { data, error } = await supabase.from('wishlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addWish(keyword: string, type: string, maxPrice?: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  const { data, error } = await supabase.from('wishlist').insert({
    user_id: user.id,
    keyword,
    type: type === 'all' ? 'all' : type,
    max_price: maxPrice || null,
    is_active: true
  }).select().single()
  if (error) throw error
  return data
}

export async function deleteWish(id: string) {
  const { error } = await supabase.from('wishlist').delete().eq('id', id)
  if (error) throw error
}

export async function toggleWish(id: string, isActive: boolean) {
  const { error } = await supabase.from('wishlist').update({ is_active: isActive }).eq('id', id)
  if (error) throw error
}
