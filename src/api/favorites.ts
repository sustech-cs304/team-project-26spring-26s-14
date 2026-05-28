import { supabase } from '../supabase'

export async function toggleFavorite(itemId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .limit(1)

  const alreadyFav = !!existing && existing.length > 0

  if (alreadyFav) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', itemId)
    if (error) throw error
    return false
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, item_id: itemId })
    if (error) {
      if (error.code === '23505') return true
      throw error
    }
    return true
  }
}

export async function isFavorited(itemId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .limit(1)

  if (error) return false
  return !!data && data.length > 0
}

export async function getMyFavorites() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  // 1. 查收藏列表
  const { data: favs, error: favError } = await supabase
    .from('favorites')
    .select('id, item_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (favError) throw favError
  if (!favs || favs.length === 0) return []

  const itemIds = favs.map(f => f.item_id)

  // 2. 批量查商品（不用关联语法，避免 Supabase 解析问题）
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .in('id', itemIds)

  if (itemsError) {
    console.error('Items query error:', itemsError)
    throw itemsError
  }
  if (!items || items.length === 0) return []

  // 3. 批量查卖家信息
  const sellerIds = [...new Set(items.map(i => i.seller_id).filter(Boolean))]
  let sellerMap: Record<string, any> = {}
  if (sellerIds.length > 0) {
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, nickname, student_id, reputation_score')
      .in('id', sellerIds)
    if (profError) console.error('Profiles query error:', profError)
    profiles?.forEach((p: any) => { sellerMap[p.id] = p })
  }

  // 4. 组装成 { ...fav, item: { ...item, seller } }
  const itemMap: Record<string, any> = {}
  items.forEach(i => {
    itemMap[i.id] = { ...i, seller: sellerMap[i.seller_id] || null }
  })

  return favs
    .map(f => ({
      id: f.id,
      item_id: f.item_id,
      created_at: f.created_at,
      item: itemMap[f.item_id] || null
    }))
    .filter(f => f.item !== null) // 过滤已删除的商品
}
