'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEBUG } from '@/lib/debug'
import EventEndCountdown from './EventEndCountdown'
import EvaluationPeriodCountdown from './EvaluationPeriodCountdown'

export default function EventEndCountdownWrapper() {
  const pathname = usePathname()
  const isLiveDashboard = pathname === '/live-dashboard'

  // IMPORTANTE: Game Over só aparece em /live-dashboard
  // Em outras páginas (dashboard, submit, etc), wrapper retorna null
  // Isso evita que o countdown apareça em todas as páginas
  if (!isLiveDashboard) {
    return null
  }

  const [eventEndTime, setEventEndTime] = useState<string | null>(null)
  const [eventEnded, setEventEnded] = useState(false)
  const [evaluationPeriodEndTime, setEvaluationPeriodEndTime] = useState<string | null>(null)
  const [allSubmissionsEvaluated, setAllSubmissionsEvaluated] = useState(false)
  const [showFinalCountdown, setShowFinalCountdown] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [canRenderChild, setCanRenderChild] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
    let isFetching = false
    const isPageVisibleRef = { current: true }

    // ✅ FIX: Detectar visibilidade da página
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
      DEBUG.log('EventEndCountdownWrapper', '👁️ Page visibility:', isPageVisibleRef.current ? 'visible' : 'hidden')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const fetchEventConfig = async () => {
      // ✅ FIX: Evitar fetch simultâneos
      if (isFetching) return
      // ✅ REMOVED: if (!isPageVisibleRef.current) return
      // Reason: Event config MUST be fetched even when tab is hidden
      // Otherwise, event end condition is ignored and countdown doesn't update
      isFetching = true

      try {
        const { data: eventConfig } = await supabase
          .from('event_config')
          .select('event_ended, event_end_time, evaluation_period_end_time, all_submissions_evaluated')
          .eq('id', eventConfigId)
          .single()

        if (eventConfig) {
          DEBUG.log('EventEndCountdownWrapper', '📊 Carregado estado do evento:', {
            event_ended: eventConfig.event_ended,
            event_end_time: eventConfig.event_end_time,
            evaluation_period_end_time: eventConfig.evaluation_period_end_time,
            all_submissions_evaluated: eventConfig.all_submissions_evaluated
          })
          setEventEnded(eventConfig.event_ended)
          setEventEndTime(eventConfig.event_end_time)
          setEvaluationPeriodEndTime(eventConfig.evaluation_period_end_time)
          setAllSubmissionsEvaluated(eventConfig.all_submissions_evaluated || false)

          // ✅ FIX: Marcar como inicializado após primeiro fetch
          if (!isInitialized) {
            setIsInitialized(true)
            // ✅ FIX: Delay antes de permitir renderização do child
            // Isso garante que o child também tenha tempo de fazer seu próprio fetch
            setTimeout(() => {
              setCanRenderChild(true)
            }, 500)
          }
        }
      } finally {
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchEventConfig()

    // ✅ FIX: Usar APENAS polling (desabilitar realtime listener)
    // Razão: O realtime listener estava causando flashing/refresh quando /submit recarregava
    // Aumentado de 1000ms para 2000ms (game-over raramente muda)
    // Reduz queries de 60/min → 30/min (50% menos)
    const pollingInterval = setInterval(fetchEventConfig, 2000)

    return () => {
      clearInterval(pollingInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [supabase, isInitialized])

  // Handler para quando avaliações terminarem
  const handleEvaluationsComplete = () => {
    console.log('🎯 [EventEndCountdownWrapper] Avaliações completadas, iniciando countdown final')
    setShowFinalCountdown(true)
  }

  // Debug: Log de estado
  console.log('📊 [EventEndCountdownWrapper] Estado atual:', {
    isInitialized,
    canRenderChild,
    evaluationPeriodEndTime,
    allSubmissionsEvaluated,
    showFinalCountdown,
    eventEnded,
    eventEndTime
  })

  // ✅ FIX: Não renderizar NADA enquanto estiver inicializando
  // Isso previne que dados stale apareçam brevemente
  if (!isInitialized) {
    return null
  }

  // ✅ FIX: Validar que evaluation_period_end_time é um timestamp futuro válido
  const isValidFutureEvaluationTime = evaluationPeriodEndTime && new Date(evaluationPeriodEndTime).getTime() > Date.now()

  // FASE 1: Período de Avaliação
  // Mostra se evaluation_period_end_time está definido E ainda não completou
  // ✅ FIX: Só renderizar após delay de sincronização (canRenderChild) E se tempo for válido
  if (evaluationPeriodEndTime && !allSubmissionsEvaluated && !showFinalCountdown && canRenderChild && isValidFutureEvaluationTime) {
    console.log('🔵 [EventEndCountdownWrapper] Renderizando FASE 1: Evaluation Period')
    return (
      <EvaluationPeriodCountdown
        onEvaluationsComplete={handleEvaluationsComplete}
      />
    )
  }

  // FASE 2: Countdown Final (após avaliações)
  // Mostra se avaliações completaram OU tempo expirou
  // ✅ FIX: Usar event_end_time para o countdown final de 60 segundos
  // event_end_time é setado quando evaluation_period_end_time expira
  if (showFinalCountdown || allSubmissionsEvaluated) {
    console.log('🟠 [EventEndCountdownWrapper] Renderizando FASE 2: Final Countdown')
    return (
      <EventEndCountdown
        eventEndTime={eventEndTime || evaluationPeriodEndTime}
        onEventEnd={() => {
          console.log('⏹️ [EventEndCountdownWrapper] Countdown terminou, setando eventEnded = true')
          setEventEnded(true)
        }}
      />
    )
  }

  // FASE 3: GAME OVER (evento oficialmente terminado)
  if (eventEnded) {
    console.log('🏁 [EventEndCountdownWrapper] Renderizando FASE 3: GAME OVER')
    
    // ✅ Parar TODOS os áudios quando evento termina
    useEffect(() => {
      // Parar todos os áudios globais que possam estar tocando
      const allAudios = document.querySelectorAll('audio')
      allAudios.forEach(audio => {
        audio.pause()
        audio.currentTime = 0
      })
      console.log('🔇 [EventEndCountdownWrapper] Todos os áudios parados (GAME OVER)')
    }, [])
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black via-red-950 to-black">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            <h1 className="text-6xl md:text-9xl font-black text-red-600 tracking-wider animate-glitch">
              GAME OVER
            </h1>
            <div className="absolute inset-0 text-6xl md:text-9xl font-black text-white opacity-20 blur-lg animate-pulse">
              GAME OVER
            </div>
          </div>

          <div className="text-8xl md:text-[150px] animate-bounce">
            🏁
          </div>

          <div className="space-y-4">
            <p className="text-3xl md:text-5xl font-bold text-white">
              O EVENTO TERMINOU!
            </p>
            <p className="text-xl md:text-2xl text-gray-400">
              Todas as submissões foram encerradas
            </p>
          </div>

          <div className="mt-12 p-8 bg-white/5 border-2 border-red-500/30 rounded-xl backdrop-blur-sm max-w-2xl mx-auto">
            <p className="text-lg md:text-xl text-yellow-400 mb-4">
              🏆 Parabéns a todas as equipes!
            </p>
            <p className="text-base md:text-lg text-gray-300">
              Aguarde o resultado final do ranking
            </p>
          </div>

          <div className="fixed inset-0 pointer-events-none opacity-10">
            <div className="h-full w-full bg-gradient-to-b from-transparent via-white to-transparent animate-scan"></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes glitch {
            0%, 100% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
          }

          @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }

          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }

          .animate-glitch { animation: glitch 0.5s infinite; }
          .animate-scan { animation: scan 8s linear infinite; }
          .animate-fade-in { animation: fade-in 1s ease-out; }
        `}</style>
      </div>
    )
  }

  // Se nada das condições acima, não mostrar nada (evento em andamento normalmente)
  return null
}
