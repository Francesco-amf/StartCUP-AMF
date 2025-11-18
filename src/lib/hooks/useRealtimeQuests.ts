'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEBUG } from '@/lib/debug'

interface Quest {
  id: string
  order_index: number
  name: string
  description: string
  max_points: number
  deliverable_type: string
  status: string
  duration_minutes: number
  started_at: string | null
  planned_deadline_minutes: number | null
  late_submission_window_minutes: number | null
  phase_id: string
}

/**
 * Hook especializado para Realtime de Quests
 *
 * Usa Supabase Realtime Subscriptions em vez de polling
 * - Muito mais eficiente (0 requisições quando nada muda)
 * - Tempo real genuíno (atualiza instantaneamente)
 * - Menos carga no servidor
 *
 * Requisitos:
 * 1. Supabase Realtime deve estar ativo no projeto
 * 2. RLS Policy deve permitir SELECT em quests table
 */
export function useRealtimeQuests(phaseId: string | null) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabaseRef = useRef(createClient())
  const subscriptionRef = useRef<any>(null)
  const initialLoadRef = useRef(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionHealthRef = useRef<boolean>(false)
  const supabase = supabaseRef.current
  const POLLING_DEBOUNCE_MS = 5000 // Aguarda 5s de Realtime inativo antes de ativar polling

  useEffect(() => {
    if (!phaseId) {
      setQuests([])
      setLoading(false)
      return
    }

    let mounted = true

    // 🔄 POLLING FALLBACK: Fetch quests via HTTP polling when WebSocket fails
    const fetchQuestsFallback = async () => {
      if (!mounted) return

      try {
        DEBUG.log('useRealtimeQuests-Polling', `⏳ Buscando quests via HTTP fallback...`)
        const { data, error: fetchError } = await supabase
          .from('quests')
          .select('*')
          .eq('phase_id', phaseId)
          .order('order_index', { ascending: true })

        if (!fetchError && data && mounted) {
          setQuests(data)
          setError(null)
          DEBUG.log('useRealtimeQuests-Polling', `✅ Quests atualizadas via polling: ${data.length} items`)
        }
      } catch (err) {
        DEBUG.error('useRealtimeQuests-Polling', `❌ Error:`, err)
      }
    }

    const setupRealtimeQuests = async () => {
      try {
        DEBUG.log('useRealtimeQuests', `📡 Iniciando Realtime para phase_id: ${phaseId}`)

        // 1️⃣ INITIAL LOAD: Carregar dados existentes
        DEBUG.log('useRealtimeQuests', `⏳ Fazendo initial load...`)
        const { data: initialData, error: initialError } = await supabase
          .from('quests')
          .select('*')
          .eq('phase_id', phaseId)
          .order('order_index', { ascending: true })

        if (initialError) {
          DEBUG.error('useRealtimeQuests', `❌ Initial load error:`, initialError)
          setError(initialError.message)
          setLoading(false)
          // ✅ FALLBACK: Ativar polling se initial load falha
          if (mounted) {
            DEBUG.log('useRealtimeQuests', `🔄 Ativando polling fallback após initial load failure...`)
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
            }
            // Start polling every 5 seconds (fallback polling is less urgent)
            pollingIntervalRef.current = setInterval(fetchQuestsFallback, 5000)
          }
          return
        }

        if (mounted) {
          DEBUG.log('useRealtimeQuests', `✅ Initial load completo: ${initialData?.length || 0} quests`)
          setQuests(initialData || [])
          initialLoadRef.current = true
        }

        // 2️⃣ SUBSCRIBE: Configurar listener para mudanças em tempo real
        DEBUG.log('useRealtimeQuests', `🔔 Configurando Realtime subscription...`)

        const channel = supabase
          .channel(`quests:${phaseId}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Todas as operações: INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'quests',
              filter: `phase_id=eq.${phaseId}`
            },
            (payload: any) => {
              DEBUG.log('useRealtimeQuests', `📡 Mudança detectada:`, {
                event: payload.eventType,
                id: payload.new?.id || payload.old?.id,
                name: payload.new?.name || payload.old?.name
              })

              if (!mounted) return

              // Processar atualização baseado no tipo de evento
              setQuests((prevQuests) => {
                let updatedQuests = [...prevQuests]

                if (payload.eventType === 'INSERT') {
                  // ➕ Nova quest foi adicionada
                  const newQuest = payload.new as Quest
                  updatedQuests.push(newQuest)
                  DEBUG.log('useRealtimeQuests', `✅ Quest adicionada: [${newQuest.order_index}] ${newQuest.name}`)
                } else if (payload.eventType === 'UPDATE') {
                  // 🔄 Quest foi atualizada
                  const updatedQuest = payload.new as Quest
                  const index = updatedQuests.findIndex((q) => q.id === updatedQuest.id)
                  if (index !== -1) {
                    DEBUG.log('useRealtimeQuests', `🔄 Quest atualizada: [${updatedQuest.order_index}] ${updatedQuest.name}`)
                    DEBUG.log('useRealtimeQuests', `   - started_at: ${updatedQuest.started_at ? '✅ SIM' : '❌ NÃO'}`)
                    updatedQuests[index] = updatedQuest
                  }
                } else if (payload.eventType === 'DELETE') {
                  // ❌ Quest foi deletada (raro)
                  const deletedId = payload.old?.id
                  updatedQuests = updatedQuests.filter((q) => q.id !== deletedId)
                  DEBUG.log('useRealtimeQuests', `❌ Quest deletada: ${deletedId}`)
                }

                // Ordenar sempre por order_index
                return updatedQuests.sort((a, b) => a.order_index - b.order_index)
              })

              setError(null) // Limpar erros anteriores
            }
          )
          .subscribe((status: any) => {
            DEBUG.log('useRealtimeQuests', `🔔 Subscription status: ${status}`)

            subscriptionHealthRef.current = status === 'SUBSCRIBED'

            if (status === 'SUBSCRIBED') {
              DEBUG.log('useRealtimeQuests', `✅ Realtime subscription ativa!`)

              // ✅ WebSocket está funcionando, parar polling e debounce
              if (pollingDebounceRef.current) {
                DEBUG.log('useRealtimeQuests', `🛑 Cancelando debounce de polling (WebSocket ativo)`)
                clearTimeout(pollingDebounceRef.current)
                pollingDebounceRef.current = null
              }

              if (pollingIntervalRef.current) {
                DEBUG.log('useRealtimeQuests', `🛑 Parando polling fallback (WebSocket ativo)`)
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
            } else {
              DEBUG.warn('useRealtimeQuests', `⚠️ Subscription status: ${status} (aguardando debounce antes de polling)`)
              // ❌ WebSocket não está funcionando, iniciar debounce para ativar polling
              // Isso evita ativar polling em flutuações temporárias de conexão
              if (!pollingDebounceRef.current && mounted) {
                DEBUG.log('useRealtimeQuests', `⏳ Debounce iniciado (${POLLING_DEBOUNCE_MS}ms antes de ativar polling)`)
                pollingDebounceRef.current = setTimeout(() => {
                  // Confirmar que Realtime AINDA está inativo antes de ativar polling
                  if (!mounted) return

                  if (subscriptionHealthRef.current === false && !pollingIntervalRef.current) {
                    DEBUG.log('useRealtimeQuests', `🔄 Debounce expirado - ativando polling fallback...`)
                    pollingIntervalRef.current = setInterval(fetchQuestsFallback, 5000)
                  } else {
                    DEBUG.log('useRealtimeQuests', `✅ Debounce expirado mas Realtime voltou - polling não ativado`)
                  }
                  pollingDebounceRef.current = null
                }, POLLING_DEBOUNCE_MS)
              }
            }
          })

        subscriptionRef.current = channel

        setLoading(false)
      } catch (err) {
        DEBUG.error('useRealtimeQuests', `❌ Setup error:`, err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
        // ✅ FALLBACK: Ativar polling em caso de erro
        if (mounted && !pollingIntervalRef.current) {
          DEBUG.log('useRealtimeQuests', `🔄 Ativando polling fallback após setup error...`)
          pollingIntervalRef.current = setInterval(fetchQuestsFallback, 2000)
        }
      }
    }

    setupRealtimeQuests()

    // 🧹 CLEANUP: Unsubscribe quando fase muda ou componente unmount
    return () => {
      mounted = false
      if (subscriptionRef.current) {
        DEBUG.log('useRealtimeQuests', `🧹 Limpando subscription para phase_id: ${phaseId}`)
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
        initialLoadRef.current = false
      }
      // 🧹 Limpar polling fallback
      if (pollingIntervalRef.current) {
        DEBUG.log('useRealtimeQuests', `🧹 Limpando polling fallback para phase_id: ${phaseId}`)
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      // 🧹 Limpar debounce de polling
      if (pollingDebounceRef.current) {
        DEBUG.log('useRealtimeQuests', `🧹 Limpando debounce de polling para phase_id: ${phaseId}`)
        clearTimeout(pollingDebounceRef.current)
        pollingDebounceRef.current = null
      }
    }
  }, [phaseId, supabase])

  return { quests, loading, error }
}
