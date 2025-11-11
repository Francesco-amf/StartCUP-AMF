'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import EventEndCountdown from './EventEndCountdown'
import EvaluationPeriodCountdown from './EvaluationPeriodCountdown'

export default function EventEndCountdownWrapper() {
  const [eventEndTime, setEventEndTime] = useState<string | null>(null)
  const [eventEnded, setEventEnded] = useState(false)
  const [evaluationPeriodEndTime, setEvaluationPeriodEndTime] = useState<string | null>(null)
  const [allSubmissionsEvaluated, setAllSubmissionsEvaluated] = useState(false)
  const [showFinalCountdown, setShowFinalCountdown] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchEventConfig = async () => {
      const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
      
      const { data: eventConfig } = await supabase
        .from('event_config')
        .select('event_ended, event_end_time, evaluation_period_end_time, all_submissions_evaluated')
        .eq('id', eventConfigId)
        .single()

      if (eventConfig) {
        setEventEnded(eventConfig.event_ended)
        setEventEndTime(eventConfig.event_end_time)
        setEvaluationPeriodEndTime(eventConfig.evaluation_period_end_time)
        setAllSubmissionsEvaluated(eventConfig.all_submissions_evaluated || false)
      }
    }

    fetchEventConfig()

    // Realtime: detectar quando evento termina
    const channel = supabase
      .channel('event_config_countdown')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_config'
        },
        (payload: any) => {
          setEventEnded(payload.new.event_ended)
          setEventEndTime(payload.new.event_end_time)
          setEvaluationPeriodEndTime(payload.new.evaluation_period_end_time)
          setAllSubmissionsEvaluated(payload.new.all_submissions_evaluated || false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Handler para quando avaliações terminarem
  const handleEvaluationsComplete = () => {
    setShowFinalCountdown(true)
  }

  // FASE 1: Período de Avaliação
  // Mostra se evaluation_period_end_time está definido E ainda não completou
  if (evaluationPeriodEndTime && !allSubmissionsEvaluated && !showFinalCountdown) {
    return (
      <EvaluationPeriodCountdown 
        onEvaluationsComplete={handleEvaluationsComplete}
      />
    )
  }

  // FASE 2: Countdown Final (após avaliações)
  // Mostra se avaliações completaram OU tempo expirou
  if (showFinalCountdown || allSubmissionsEvaluated) {
    return (
      <EventEndCountdown 
        eventEndTime={eventEndTime}
        onEventEnd={() => setEventEnded(true)}
      />
    )
  }

  // FASE 3: GAME OVER (evento oficialmente terminado)
  if (eventEnded) {
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
