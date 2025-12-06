import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ SUPABASE NÃO CONFIGURADO: Variáveis de ambiente ausentes')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  created_at: string
  points: number
}

export type HairProfile = {
  id: string
  user_id: string
  curl_pattern: string
  texture: string
  density: string
  porosity: string
  health_score: number
  photo_url?: string
  analysis_data: any
  created_at: string
  updated_at: string
}
