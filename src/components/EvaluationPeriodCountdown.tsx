'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface EvaluationStatus {
  total_submissions: number
  evaluated_submissions: number
  pending_submissions: number
  all_evaluated: boolean
}

interface EvaluationPeriodCountdownProps {
  onEvaluationsComplete: () => void
}

export default function EvaluationPeriodCountdown({ onEvaluationsComplete }: EvaluationPeriodCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [status, setStatus] = useState<EvaluationStatus | null>(null)
  const [evaluationPeriodEndTime, setEvaluationPeriodEndTime] = useState<string | null>(null)
  const [allEvaluated, setAllEvaluated] = useState(false)
  const supabase = createClient()

  // Buscar dados do período de avaliação
  useEffect(() => {
    const fetchEvaluationStatus = async () => {
      try {
        // Buscar evaluation_period_end_time e flag all_submissions_evaluated
        const { data: config } = await supabase
          .from('event_config')
          .select('evaluation_period_end_time, all_submissions_evaluated')
          .single()

        if (config?.evaluation_period_end_time) {
          setEvaluationPeriodEndTime(config.evaluation_period_end_time)
        }

        if (config?.all_submissions_evaluated) {
          setAllEvaluated(true)
        }

        // Buscar status detalhado das submissões
        const { data: result } = await supabase
          .rpc('check_all_submissions_evaluated')
          .single()

        if (result) {
          setStatus(result as EvaluationStatus)
          
          // Se todas foram avaliadas, chamar callback
          if (result.all_evaluated && !allEvaluated) {
            setAllEvaluated(true)
            setTimeout(() => {
              onEvaluationsComplete()
            }, 3000) // Aguardar 3 segundos antes de prosseguir
          }
        }
      } catch (error) {
        console.error('Erro ao buscar status de avaliação:', error)
      }
    }

    // Buscar imediatamente
    fetchEvaluationStatus()

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchEvaluationStatus, 10000)

    // Realtime: Escutar mudanças no event_config
    const channel = supabase
      .channel('evaluation_period_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_config'
        },
        (payload: any) => {
          console.log('⏳ [EvaluationPeriod] Event config atualizado:', payload.new)
          
          if (payload.new.evaluation_period_end_time) {
            setEvaluationPeriodEndTime(payload.new.evaluation_period_end_time)
          }
          
          if (payload.new.all_submissions_evaluated && !allEvaluated) {
            setAllEvaluated(true)
            setTimeout(() => {
              onEvaluationsComplete()
            }, 3000)
          }
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [supabase, allEvaluated, onEvaluationsComplete])

  // Atualizar timer a cada segundo
  useEffect(() => {
    if (!evaluationPeriodEndTime) return

    const updateTimer = () => {
      const cleanTimestamp = evaluationPeriodEndTime.includes('+00:00')
        ? evaluationPeriodEndTime.replace('+00:00', 'Z')
        : evaluationPeriodEndTime.endsWith('Z')
        ? evaluationPeriodEndTime
        : `${evaluationPeriodEndTime}Z`

      const endTime = new Date(cleanTimestamp).getTime()
      const remaining = Math.max(0, endTime - Date.now())
      setTimeLeft(Math.floor(remaining / 1000))

      // Se tempo expirou mas ainda há pendentes, permitir prosseguir
      if (remaining === 0 && !allEvaluated) {
        setTimeout(() => {
          onEvaluationsComplete() // Forçar prosseguimento mesmo com pendências
        }, 2000)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [evaluationPeriodEndTime, allEvaluated, onEvaluationsComplete])

  // Se todas as submissões foram avaliadas
  if (allEvaluated) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-900 via-green-800 to-green-950 flex items-center justify-center">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Ícone de sucesso */}
          <div className="text-9xl md:text-[200px] animate-bounce">
            ✅
          </div>

          {/* Mensagem principal */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-green-400">
              AVALIAÇÕES CONCLUÍDAS!
            </h2>
            <p className="text-2xl md:text-3xl text-green-200">
              Todas as submissões foram avaliadas
            </p>
          </div>

          {/* Estatísticas */}
          {status && (
            <div className="bg-white/10 backdrop-blur-sm border-2 border-green-400/50 rounded-xl p-6 max-w-md mx-4 md:mx-auto">
              <div className="text-center">
                <p className="text-lg text-green-300 mb-2">Total de Submissões Avaliadas</p>
                <p className="text-6xl font-black text-green-400">{status.evaluated_submissions}</p>
              </div>
            </div>
          )}

          {/* Próximo passo */}
          <p className="text-xl md:text-2xl text-green-300 animate-pulse">
            🏆 Preparando resultado final...
          </p>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
        `}</style>
      </div>
    )
  }

  // Se período de avaliação está ativo (e há pendências)
  if (evaluationPeriodEndTime && status && !status.all_evaluated) {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const progressPercentage = status.total_submissions > 0
      ? Math.round((status.evaluated_submissions / status.total_submissions) * 100)
      : 0

    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-950 flex items-center justify-center overflow-hidden">
        {/* Efeito de fundo animado */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
        </div>

        <div className="relative text-center space-y-8 p-8 max-w-4xl mx-4">
          {/* Ícone principal */}
          <div className="text-8xl md:text-9xl animate-spin-slow">
            ⏳
          </div>

          {/* Título */}
          <div className="space-y-3">
            <h2 className="text-3xl md:text-5xl font-black text-yellow-400">
              AVALIAÇÕES FINAIS EM ANDAMENTO
            </h2>
            <p className="text-xl md:text-2xl text-blue-200">
              Aguarde enquanto finalizamos as últimas avaliações
            </p>
          </div>

          {/* Timer gigante */}
          <div className="text-7xl md:text-9xl font-black text-white font-mono leading-none">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {/* Card de status */}
          <div className="bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl p-6 md:p-8">
            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mb-6">
              <div className="text-center">
                <p className="text-sm md:text-base text-gray-300 mb-1">Total</p>
                <p className="text-3xl md:text-4xl font-bold text-white">{status.total_submissions}</p>
              </div>
              <div className="text-center">
                <p className="text-sm md:text-base text-gray-300 mb-1">Avaliadas</p>
                <p className="text-3xl md:text-4xl font-bold text-green-400">{status.evaluated_submissions}</p>
              </div>
              <div className="text-center">
                <p className="text-sm md:text-base text-gray-300 mb-1">Pendentes</p>
                <p className="text-3xl md:text-4xl font-bold text-yellow-400">{status.pending_submissions}</p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div>
              <div className="w-full bg-gray-700 rounded-full h-4 md:h-6 overflow-hidden mb-3">
                <div
                  className="bg-gradient-to-r from-green-500 via-green-400 to-green-300 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-base md:text-lg text-gray-300 font-semibold">
                  {progressPercentage}% Concluído
                </p>
                {status.pending_submissions > 0 && (
                  <p className="text-sm md:text-base text-yellow-400">
                    {status.pending_submissions} {status.pending_submissions === 1 ? 'submissão' : 'submissões'} restante{status.pending_submissions === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mensagem informativa */}
          <div className="bg-blue-500/20 border-2 border-blue-400/50 rounded-xl p-4 md:p-6">
            <p className="text-lg md:text-xl text-blue-200">
              🔄 Os avaliadores estão finalizando as últimas submissões.
              <br className="hidden md:block" />
              O vencedor será revelado em breve!
            </p>
          </div>

          {/* Aviso se tempo acabando */}
          {timeLeft < 60 && status.pending_submissions > 0 && (
            <div className="bg-red-500/30 border-2 border-red-500 rounded-xl p-4 animate-pulse-slow">
              <p className="text-base md:text-lg text-red-200 font-semibold">
                ⚠️ Menos de 1 minuto restante!
                <br />
                {status.pending_submissions} {status.pending_submissions === 1 ? 'submissão ainda pendente' : 'submissões ainda pendentes'}.
              </p>
            </div>
          )}

          {/* Aviso se tempo expirou com pendências */}
          {timeLeft === 0 && status.pending_submissions > 0 && (
            <div className="bg-orange-500/30 border-2 border-orange-500 rounded-xl p-4">
              <p className="text-base md:text-lg text-orange-200 font-semibold">
                ⚠️ Tempo de avaliação expirado
                <br />
                Prosseguindo com {status.pending_submissions} {status.pending_submissions === 1 ? 'submissão pendente' : 'submissões pendentes'}...
              </p>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }

          .animate-shimmer {
            animation: shimmer 3s infinite;
          }

          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }

          .animate-pulse-slow {
            animation: pulse-slow 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  // Não renderizar nada se período não está ativo
  return null
}
