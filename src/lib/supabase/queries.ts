import { createClient } from './client'

// Buscar ranking completo
export async function getRanking() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('live_ranking')
    .select('*')
    .order('total_points', { ascending: false })
  
  if (error) throw error
  return data
}

// Buscar fase atual do evento
export async function getCurrentPhase() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('event_config')
    .select(`
      *,
      phases (
        id,
        name,
        duration_minutes,
        max_points
      )
    `)
    .single()
  
  if (error) throw error
  return data
}

// Buscar quests de uma fase específica
export async function getQuestsForPhase(phaseId: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('phase_id', phaseId)
    .order('order_index')
  
  if (error) throw error
  return data
}

// Buscar submissions pendentes (para avaliadores)
export async function getPendingSubmissions() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      teams (
        name,
        course
      ),
      quests (
        name,
        max_points,
        phase_id
      )
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
  
  if (error) throw error
  return data
}

// Buscar submissions de uma equipe
export async function getTeamSubmissions(teamId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      quests (
        name,
        phase_id,
        max_points
      )
    `)
    .eq('team_id', teamId)
    .order('submitted_at', { ascending: false })
  
  if (error) throw error
  return data
}