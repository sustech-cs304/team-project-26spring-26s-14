import { supabase } from '../supabase'

export async function uploadItemImages(files: File[]): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const urls: string[] = []
  for (const file of files) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(fileName, file)
    
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(fileName)
    
    urls.push(publicUrl)
  }
  return urls
}
