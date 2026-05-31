// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)


import { createClient } from '@supabase/supabase-js'

// Fallback 默认值，确保生产构建时不会拿到 undefined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bmrouxhhqkcpecntdfrh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcm91eGhocWtjcGVjbnRkZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODMwNzAsImV4cCI6MjA5NDk1OTA3MH0.Pt4Bv7u5ZDNGElfxJB3pOeeJLg17F19OA2DqkeY9zoo'

// 防御性检查：如果还是空，在控制台给出明确提示
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 环境变量缺失：', { url: supabaseUrl, key: supabaseAnonKey ? '已设置' : '未设置' })
  throw new Error('Supabase URL 或 Anon Key 未配置，请检查 Vercel 环境变量或本地 .env 文件')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

