import { supabase } from '../supabase'

// 检查30天内是否评价过该用户
export async function hasReviewedRecently(revieweeId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', user.id)
    .eq('reviewee_id', revieweeId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .limit(1)

  if (error) return false
  return !!data && data.length > 0
}

// 检查是否和该用户聊过天（有来往消息）
export async function hasChattedWith(otherUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('messages')
    .select('id')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .limit(1)

  if (error) return false
  return !!data && data.length > 0
}

export async function submitReview(revieweeId: string, itemId: string, rating: number, comment?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const [hasReviewed, hasChatted] = await Promise.all([
    hasReviewedRecently(revieweeId),
    hasChattedWith(revieweeId)
  ])

  if (hasReviewed) throw new Error('30天内已评价过该用户')
  if (!hasChatted) throw new Error('您需要和对方聊过天才能评价')

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      item_id: itemId,
      rating,
      comment: comment || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getReviewsForUser(userId: string) {
  // 第一步：查评价列表
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!reviews || reviews.length === 0) return []

  // 第二步：批量查评价人的昵称
  const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, student_id')
    .in('id', reviewerIds)

  const profileMap: Record<string, any> = {}
  profiles?.forEach((p: any) => { profileMap[p.id] = p })

  return reviews.map(r => ({
    ...r,
    reviewer: profileMap[r.reviewer_id] || null
  }))
}
