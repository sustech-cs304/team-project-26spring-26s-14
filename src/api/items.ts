import { supabase } from '../supabase'

export async function getItems(filters?: { 
  type?: string; 
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
}) {
  let query = supabase
    .from('items')
    .select('*')
    .eq('status', 'available')

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }
  if (filters?.keyword) {
    query = query.ilike('title', `%${filters.keyword}%`)
  }
  if (filters?.minPrice !== undefined && filters.minPrice !== null) {
    query = query.gte('price', filters.minPrice)
  }
  if (filters?.maxPrice !== undefined && filters.maxPrice !== null) {
    query = query.lte('price', filters.maxPrice)
  }

  const sort = filters?.sortBy || 'newest'
  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else if (sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  }

  const { data: items, error } = await query
  if (error) throw error

  const sellerIds = [...new Set((items || []).map((item: any) => item.seller_id))]
  let profilesMap: Record<string, any> = {}

  if (sellerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, student_id, nickname, reputation_score, avatar_url')
      .in('id', sellerIds)
    profiles?.forEach((p: any) => { profilesMap[p.id] = p })
  }

  return (items || []).map((item: any) => ({ ...item, seller: profilesMap[item.seller_id] || null }))
}

export async function getItemById(id: string) {
  const { data, error } = await supabase.from('items').select('*').eq('id', id).single()
  if (error) throw error
  let seller = null
  if (data?.seller_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, student_id, nickname, reputation_score, avatar_url')
      .eq('id', data.seller_id)
      .single()
    seller = profile
  }
  return { ...data, seller }
}

export async function publishItem(item: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('请先登录')
  const { data, error } = await supabase
    .from('items')
    .insert({ ...item, seller_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateItem(id: string, updates: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .eq('seller_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteItem(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { error } = await supabase
    .from('items')
    .update({ status: 'unavailable' })
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) throw error
}

export async function getItemsByUser(userId: string, status?: string) {
  let query = supabase
    .from('items')
    .select('*')
    .eq('seller_id', userId)
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
