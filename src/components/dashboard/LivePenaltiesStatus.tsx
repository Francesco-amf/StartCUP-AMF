'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

interface Penalty {
  id: string
  team_id: string
  team_name: string
  penalty_type: string
  points_deduction: number
  reason: string | null
  assigned_by_admin: boolean
  evaluator_name: string | null
  created_at: string
}

const PENALTY_ICONS: Record<string, string> = {
  plagio: '⚠️',
  desorganizacao: '📌',
  desrespeito: '🚫',
  ausencia: '❌',
  atraso: '⏰'
}

const PENALTY_NAMES: Record<string, string> = {
  plagio: 'Plágio',
  desorganizacao: 'Desorganização',
  desrespeito: 'Desrespeito às Regras',
  ausencia: 'Ausência',
  atraso: 'Atraso'
}

export default function LivePenaltiesStatus() {
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [loading, setLoading] = useState(true)
  const { play } = useSoundSystem()
  const previousPenaltyIdsRef = useRef<Set<string>>(new Set())
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchPenalties = async () => {
      try {
        console.log('📡 [LivePenaltiesStatus] Buscando penalidades do banco...')
        // Obter todas as penalidades
        const { data: penaltiesData, error: penaltiesError } = await supabase
          .from('penalties')
          .select('*')
          .order('created_at', { ascending: false })

        if (penaltiesError) {
          console.error('❌ Erro ao buscar penalidades:', penaltiesError)
          setPenalties([])
          setLoading(false)
          return
        }

        if (!penaltiesData || penaltiesData.length === 0) {
          console.log('ℹ️ Nenhuma penalidade encontrada')
          setPenalties([])
          setLoading(false)
          return
        }

        console.log(`✅ ${penaltiesData.length} penalidades encontradas`)
        // Obter nomes das equipes (excluindo equipes fantasma)
        const teamIds = [...new Set(penaltiesData.map((p: any) => p.team_id))]
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds)
          .not('email', 'in', '("admin@test.com","avaliador1@test.com","avaliador2@test.com","avaliador3@test.com")')

        if (teamsError) {
          console.error('Erro ao buscar equipes:', teamsError)
          setPenalties([])
          setLoading(false)
          return
        }

        const teamMap = new Map(teamsData?.map((t: any) => [t.id, t.name]) || [])

        // Obter nomes dos avaliadores (apenas se houver IDs para buscar)
        let evaluatorMap = new Map()
        const evaluatorIds = penaltiesData
          .filter((p: any) => p.assigned_by_evaluator_id)
          .map((p: any) => p.assigned_by_evaluator_id)
          .filter((id: any, index: number, self: any[]) => id && self.indexOf(id) === index) // Remove duplicatas e null/undefined

        if (evaluatorIds.length > 0) {
          const { data: evaluatorsData, error: evaluatorsError } = await supabase
            .from('evaluators')
            .select('id, name')
            .in('id', evaluatorIds)

          if (evaluatorsError) {
            console.error('Erro ao buscar avaliadores:', evaluatorsError)
          } else {
            evaluatorMap = new Map(evaluatorsData?.map((e: any) => [e.id, e.name]) || [])
          }
        }

        // Formatar penalidades
        const formatted = penaltiesData.map((p: any) => {
          return {
            id: p.id,
            team_id: p.team_id,
            team_name: teamMap.get(p.team_id) || 'Equipe Desconhecida',
            penalty_type: p.penalty_type,
            points_deduction: p.points_deduction !== null && p.points_deduction !== undefined ? p.points_deduction : 0,
            reason: p.reason || null,
            assigned_by_admin: p.assigned_by_admin || false,
            evaluator_name: p.assigned_by_evaluator_id ? evaluatorMap.get(p.assigned_by_evaluator_id) : null,
            created_at: p.created_at
          }
        })

        // IMEDIATAMENTE: Tocar som se houver nova penalidade (antes de atualizar estado)
        // Isso garante que o som toca na ORDEM CORRETA
        console.log('🔍 [LivePenaltiesStatus] isFirstRenderRef.current:', isFirstRenderRef.current)
        console.log('🔍 [LivePenaltiesStatus] previousPenaltyIdsRef.current:', previousPenaltyIdsRef.current)
        console.log('🔍 [LivePenaltiesStatus] formatted.length:', formatted.length)

        if (!isFirstRenderRef.current) {
          // Detectar TODAS as penalidades novas
          const newPenalties: Penalty[] = []
          formatted.forEach((penalty: Penalty) => {
            console.log('🔍 [LivePenaltiesStatus] Verificando penalty ID:', penalty.id, 'já conhecida?', previousPenaltyIdsRef.current.has(penalty.id))
            if (!previousPenaltyIdsRef.current.has(penalty.id)) {
              newPenalties.push(penalty)
              console.log('✨ [LivePenaltiesStatus] PENALIDADE NOVA ENCONTRADA:', penalty.team_name, 'ID:', penalty.id)
            }
          })

          console.log('📊 [LivePenaltiesStatus] Total de penalidades novas:', newPenalties.length)

          // Tocar som para CADA penalidade nova (em ordem)
          newPenalties.forEach((penalty: Penalty, index: number) => {
            console.log(`🔊🔊🔊 [${index + 1}/${newPenalties.length}] PENALIDADE NOVA DETECTADA: ${penalty.team_name} → TOCANDO play('penalty') AGORA!`)
            console.log('⚠️ ANTES DE CHAMAR play() - tipo:', typeof play, 'isClient:', typeof window !== 'undefined')
            play('penalty')
            console.log('✅ DEPOIS DE CHAMAR play()')
          })
        } else {
          console.log('⏭️ [LivePenaltiesStatus] Primeira renderização de penalidades, não tocar som')
        }

        // Atualizar conjunto de IDs de penalidades
        previousPenaltyIdsRef.current = new Set(formatted.map((p: Penalty) => p.id))

        // Marcar que a primeira renderização foi feita
        if (isFirstRenderRef.current) {
          isFirstRenderRef.current = false
        }

        // AGORA atualizar estado da UI
        setPenalties(formatted)
      } catch (err) {
        console.error('Erro ao buscar penalidades:', err)
        setPenalties([])
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchPenalties()

    // 🔄 Polling cada 1 segundo (muito mais responsivo para detectar penalidades)
    const interval = setInterval(fetchPenalties, 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4">⚖️ Penalidades Aplicadas</h3>
        <p className="text-sm text-purple-200">Carregando...</p>
      </div>
    )
  }

  return (
    <div
      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-white"
      role="region"
      aria-live="polite"
      aria-label="Active penalties in event"
    >
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-1">⚖️ Penalidades Aplicadas</h3>
        <p className="text-xs text-purple-200">Últimas penalidades do evento</p>
      </div>

      {penalties.length === 0 ? (
        <div className="text-sm text-purple-200">
          Nenhuma penalidade aplicada até o momento
        </div>
      ) : (
        <div className="space-y-3">
          {penalties.map((penalty) => (
            <div
              key={penalty.id}
              className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
            >
              <span className="text-2xl flex-shrink-0">
                {PENALTY_ICONS[penalty.penalty_type] || '⚖️'}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm truncate">{penalty.team_name}</p>
                  <span className="text-xs font-bold text-[#FF3D00] bg-[#FF3D00]/20 px-2 py-1 rounded whitespace-nowrap">
                    -{penalty.points_deduction} AMF Coins
                  </span>
                </div>

                <p className="text-xs text-purple-200">
                  {PENALTY_NAMES[penalty.penalty_type] || penalty.penalty_type}
                </p>

                {penalty.reason && (
                  <p className="text-xs text-white/60 mt-1 line-clamp-2">
                    {penalty.reason}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2 text-xs text-purple-300">
                  {penalty.assigned_by_admin ? (
                    <span>👤 Admin</span>
                  ) : penalty.evaluator_name ? (
                    <span>👨‍🏫 {penalty.evaluator_name}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-purple-300">
          Total: <span className="font-bold">{penalties.length}</span> penalidades aplicadas
        </p>
      </div>
    </div>
  )
}
