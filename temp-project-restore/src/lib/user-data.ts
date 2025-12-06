import { supabase } from './supabase'

export type UserHairProfile = {
  id?: string
  user_id: string
  curl_pattern: string
  texture: string
  density: string
  porosity: string
  health_score: number
  photo_url?: string
  questionnaire_data: any
  analysis_data: any
  last_analysis_date: string
}

export type UserTask = {
  id?: string
  user_id: string
  task_id: string
  task_type: 'daily' | 'weekly'
  completed: boolean
  completed_at?: string
}

export type UserLoyalty = {
  id?: string
  user_id: string
  points: number
}

// Salvar perfil capilar do usuário
export async function saveHairProfile(profile: UserHairProfile) {
  const { data, error } = await supabase
    .from('hair_profiles')
    .upsert({
      user_id: profile.user_id,
      curl_pattern: profile.curl_pattern,
      texture: profile.texture,
      density: profile.density,
      porosity: profile.porosity,
      health_score: profile.health_score,
      photo_url: profile.photo_url,
      questionnaire_data: profile.questionnaire_data,
      analysis_data: profile.analysis_data,
      last_analysis_date: profile.last_analysis_date,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Buscar perfil capilar do usuário
export async function getHairProfile(userId: string) {
  const { data, error } = await supabase
    .from('hair_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Salvar tasks do usuário (usando UPSERT para evitar DELETE)
export async function saveUserTasks(userId: string, tasks: UserTask[]) {
  // Usar upsert com constraint único (user_id, task_id)
  const { data, error } = await supabase
    .from('user_tasks')
    .upsert(
      tasks.map(task => ({
        user_id: userId,
        task_id: task.task_id,
        task_type: task.task_type,
        completed: task.completed,
        completed_at: task.completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })),
      { 
        onConflict: 'user_id,task_id',
        ignoreDuplicates: false 
      }
    )
    .select()

  if (error) throw error
  return data
}

// Buscar tasks do usuário
export async function getUserTasks(userId: string) {
  const { data, error } = await supabase
    .from('user_tasks')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data || []
}

// Salvar pontos de fidelidade
export async function saveLoyaltyPoints(userId: string, points: number) {
  const { data, error } = await supabase
    .from('user_loyalty')
    .upsert({
      user_id: userId,
      points: points,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Buscar pontos de fidelidade
export async function getLoyaltyPoints(userId: string) {
  const { data, error } = await supabase
    .from('user_loyalty')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data?.points || 0
}

// Função auxiliar para obter usuário atual
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
