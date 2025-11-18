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
  const [isInitialized, setIsInitialized] = useState(false)
  const supabase = createClient()

  // Buscar dados do período de avaliação
  useEffect(() => {
    let isFetching = false

    const fetchEvaluationStatus = async () => {
      // ✅ FIX: Evitar fetch simultâneos
      if (isFetching) return
      isFetching = true

      try {
        // Buscar evaluation_period_end_time e flag all_submissions_evaluated
        const { data: config } = await supabase
          .from('event_config')
          .select('evaluation_period_end_time, all_submissions_evaluated')
          .single()

        console.log('📋 [EvaluationPeriodCountdown] Config carregado:', {
          evaluation_period_end_time: config?.evaluation_period_end_time,
          all_submissions_evaluated: config?.all_submissions_evaluated
        })

        if (config?.evaluation_period_end_time) {
          setEvaluationPeriodEndTime(config.evaluation_period_end_time)
        }

        if (config?.all_submissions_evaluated) {
          console.log('⏭️ [EvaluationPeriodCountdown] Flag all_submissions_evaluated é TRUE, pulando para final')
          setAllEvaluated(true)
        }

        // Buscar status detalhado das submissões
        const { data: result } = await supabase
          .rpc('check_all_submissions_evaluated')
          .single()

        console.log('📊 [EvaluationPeriodCountdown] RPC result:', result)

        if (result) {
          setStatus(result as EvaluationStatus)

          // ✅ FIX: Marcar como inicializado após primeiro fetch bem-sucedido
          if (!isInitialized) {
            setIsInitialized(true)
          }

          // Se todas foram avaliadas, chamar callback
          if (result.all_evaluated && !allEvaluated) {
            console.log('✅ [EvaluationPeriodCountdown] RPC retornou all_evaluated = true')
            setAllEvaluated(true)
            setTimeout(() => {
              onEvaluationsComplete()
            }, 3000) // Aguardar 3 segundos antes de prosseguir
          } else {
            console.log('⏳ [EvaluationPeriodCountdown] Aguardando avaliações:', {
              total: result.total_submissions,
              evaluated: result.evaluated_submissions,
              pending: result.pending_submissions,
              all_evaluated: result.all_evaluated
            })
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar status de avaliação:', error)
      } finally {
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchEvaluationStatus()

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchEvaluationStatus, 10000)

    // ✅ FIX: Remover realtime listener que pode causar flashing
    // O polling a cada 10 segundos é suficiente para detectar mudanças
    // Realtime estava causando renderizações prematuras quando dados chegavam em paralelo

    return () => {
      clearInterval(interval)
    }
  }, [supabase, allEvaluated, onEvaluationsComplete, isInitialized])

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
      const secondsLeft = Math.floor(remaining / 1000)

      // ✅ Debug: Mostrar valores apenas cada 10 segundos para não poluir logs
      if (secondsLeft % 10 === 0 || secondsLeft <= 5) {
        console.log(`⏳ [EvaluationPeriodCountdown] Timer: ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')} (${secondsLeft} seg total)`)
      }

      setTimeLeft(secondsLeft)

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

  // ✅ FIX: Não renderizar NADA até estar inicializado
  // Isso previne que dados stale apareçam brevemente
  // Se não temos evaluationPeriodEndTime ainda, não renderizar nada
  if (!isInitialized || !evaluationPeriodEndTime) {
    return null
  }

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

  // ✅ FIX: Validar que evaluationPeriodEndTime é um timestamp futuro válido
  const isValidFutureTime = evaluationPeriodEndTime && new Date(evaluationPeriodEndTime).getTime() > Date.now()

  // Se período de avaliação está ativo (e há pendências)
  if (evaluationPeriodEndTime && status && !status.all_evaluated && isValidFutureTime) {
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

          {/* Timer gigante com validação de formato */}
          <div className="text-7xl md:text-9xl font-black text-white font-mono leading-none">
            {minutes >= 0 && seconds >= 0
              ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
              : '00:00'
            }
          </div>

          {/* Label do timer */}
          <div className="text-xl md:text-2xl text-blue-100 font-semibold">
            {minutes > 0 ? `${minutes} minuto${minutes !== 1 ? 's' : ''} e ${seconds} segundo${seconds !== 1 ? 's' : ''}` : `${seconds} segundo${seconds !== 1 ? 's' : ''}`}
          </div>

          {/* Card de status */}
          <div className="bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl p-6 md:p-8">
            {/* Porcentagem gigante e destacada */}
            <div className="mb-8 text-center">
              <p className="text-sm md:text-base text-gray-300 mb-2">PROGRESSO DE AVALIAÇÕES</p>
              <p className="text-6xl md:text-7xl font-black text-green-400 drop-shadow-lg">
                {progressPercentage}%
              </p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mb-6">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-xs md:text-sm text-gray-300 mb-1">Total</p>
                <p className="text-2xl md:text-3xl font-bold text-white">{status.total_submissions}</p>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="text-xs md:text-sm text-green-300 mb-1">✅ Avaliadas</p>
                <p className="text-2xl md:text-3xl font-bold text-green-400">{status.evaluated_submissions}</p>
              </div>
              <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <p className="text-xs md:text-sm text-yellow-300 mb-1">⏳ Pendentes</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-400">{status.pending_submissions}</p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div>
              <div className="w-full bg-gray-700 rounded-full h-5 md:h-7 overflow-hidden mb-3 shadow-lg">
                <div
                  className="bg-gradient-to-r from-green-500 via-green-400 to-green-300 h-full transition-all duration-500 ease-out flex items-center justify-center"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {progressPercentage > 10 && (
                    <span className="text-xs font-bold text-green-950">{progressPercentage}%</span>
                  )}
                </div>
              </div>
              {status.pending_submissions > 0 && (
                <p className="text-sm md:text-base text-yellow-300 font-semibold text-center">
                  ⏳ {status.pending_submissions} {status.pending_submissions === 1 ? 'submissão' : 'submissões'} ainda sendo avaliada{status.pending_submissions === 1 ? '' : 's'}...
                </p>
              )}
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
