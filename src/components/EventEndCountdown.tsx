'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WinnerTeam {
  team_id: string
  team_name: string
  total_points: number
}

interface EventEndCountdownProps {
  eventEndTime: string | null
  onEventEnd?: () => void
}

export default function EventEndCountdown({ eventEndTime, onEventEnd }: EventEndCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<WinnerTeam | null>(null)
  const [loadingWinner, setLoadingWinner] = useState(false)
  const supabase = createClient()

  // Buscar equipe vencedora
  const fetchWinner = async () => {
    setLoadingWinner(true)
    try {
      const { data, error } = await supabase
        .from('live_ranking')
        .select('team_id, team_name, total_points')
        .order('total_points', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Erro ao buscar vencedor:', error)
      } else {
        setWinner(data)
      }
    } catch (error) {
      console.error('Erro ao buscar vencedor:', error)
    } finally {
      setLoadingWinner(false)
    }
  }

  useEffect(() => {
    if (!eventEndTime) return

    const calculateTimeLeft = () => {
      const now = Date.now()
      const endTime = new Date(eventEndTime.endsWith('Z') ? eventEndTime : eventEndTime + 'Z').getTime()
      const remaining = Math.max(0, endTime - now)
      return Math.floor(remaining / 1000) // Segundos
    }

    const updateTimer = () => {
      const seconds = calculateTimeLeft()
      setTimeLeft(seconds)

      // Mostrar contagem regressiva nos últimos 10 segundos
      if (seconds <= 10 && seconds > 0) {
        setShowCountdown(true)
      } else if (seconds === 0) {
        setShowCountdown(false)
        setGameOver(true)
        
        // Buscar o vencedor
        fetchWinner()
        
        // Tocar som de game over (se disponível)
        try {
          const audio = new Audio('/sounds/game-over.mp3')
          audio.volume = 0.7
          audio.play().catch(err => console.log('Som não disponível:', err))
        } catch (error) {
          console.log('Som de game over não disponível')
        }

        // Callback quando evento terminar
        if (onEventEnd) {
          onEventEnd()
        }
      }
    }

    // Atualização inicial
    updateTimer()

    // Atualizar a cada segundo
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [eventEndTime, onEventEnd])

  // Contagem regressiva final (10 segundos)
  if (showCountdown && timeLeft !== null && timeLeft > 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-pulse">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-red-500 animate-pulse">
            ⏰ EVENTO TERMINANDO
          </h1>
          <div className="relative">
            <div className="text-[120px] md:text-[200px] font-black text-white animate-bounce leading-none">
              {timeLeft}
            </div>
            <div className="absolute inset-0 text-[120px] md:text-[200px] font-black text-red-500 blur-xl animate-pulse leading-none">
              {timeLeft}
            </div>
          </div>
          <p className="text-2xl md:text-4xl text-yellow-400 font-bold animate-pulse">
            ÚLTIMOS SEGUNDOS! 🚨
          </p>
        </div>
      </div>
    )
  }

  // GAME OVER - Tela final
  if (gameOver) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-black via-red-950 to-black overflow-y-auto">
        {/* Confetes caindo */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              {['🎉', '🎊', '✨', '⭐', '🌟', '💫'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>

        {/* Container centralizado com padding */}
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
          <div className="text-center space-y-8 animate-fade-in relative z-10 w-full max-w-5xl">
            {/* Título GAME OVER */}
            <div className="relative mb-4">
              <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-red-600 tracking-wider animate-glitch">
                GAME OVER
              </h1>
              <div className="absolute inset-0 text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-white opacity-20 blur-lg animate-pulse">
                GAME OVER
              </div>
            </div>

            {/* Emoji dramático */}
            <div className="text-7xl sm:text-8xl md:text-9xl lg:text-[150px] animate-bounce my-6">
              🏁
            </div>

            {/* Mensagem final */}
            <div className="space-y-3 mb-8">
              <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                O EVENTO TERMINOU!
              </p>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-400">
                Todas as submissões foram encerradas
              </p>
            </div>

            {/* VENCEDOR - Destaque especial */}
            {winner && (
              <div className="mt-8 space-y-6 animate-fade-in-up">
                {/* Troféu gigante */}
                <div className="text-8xl sm:text-9xl md:text-[150px] lg:text-[180px] animate-bounce-slow my-6">
                  🏆
                </div>

                {/* Título "VENCEDOR" */}
                <div className="relative my-4">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-yellow-400 tracking-wider animate-pulse-gold">
                    🌟 VENCEDOR 🌟
                  </h2>
                </div>

                {/* Card do vencedor */}
                <div className="relative p-6 sm:p-8 md:p-10 lg:p-12 bg-gradient-to-br from-yellow-500/20 via-yellow-600/10 to-orange-500/20 border-4 border-yellow-400 rounded-2xl backdrop-blur-sm mx-auto shadow-2xl shadow-yellow-500/50 animate-glow max-w-3xl">
                  {/* Confetes animados */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-5xl sm:text-6xl animate-bounce">
                    🎉
                  </div>
                  <div className="absolute -top-6 left-1/4 text-4xl sm:text-5xl animate-bounce delay-100">
                    ✨
                  </div>
                  <div className="absolute -top-6 right-1/4 text-4xl sm:text-5xl animate-bounce delay-200">
                    🎊
                  </div>

                  {/* Nome da equipe */}
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 text-center break-words">
                    {winner.team_name}
                  </h3>

                  {/* Pontuação final */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 flex-wrap">
                    <span className="text-xl sm:text-2xl md:text-3xl">🪙</span>
                    <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-yellow-300">
                      {winner.total_points}
                    </span>
                    <span className="text-lg sm:text-xl md:text-2xl text-yellow-400 font-bold">
                      AMF Coins
                    </span>
                  </div>

                  {/* Mensagem de parabéns */}
                  <p className="text-xl sm:text-2xl md:text-3xl text-yellow-200 font-bold text-center">
                    🎯 PRIMEIRO LUGAR! 🎯
                  </p>
                </div>

                {/* Mensagem para todas as equipes */}
                <div className="mt-6 p-4 sm:p-6 bg-white/5 border-2 border-gray-500/30 rounded-xl backdrop-blur-sm max-w-2xl mx-auto">
                  <p className="text-base sm:text-lg md:text-xl text-gray-300 text-center">
                    🏅 Parabéns a todas as equipes pela participação!
                  </p>
                </div>
              </div>
            )}

            {/* Loading ou sem vencedor */}
            {!winner && (
              <div className="mt-8 p-6 sm:p-8 bg-white/5 border-2 border-red-500/30 rounded-xl backdrop-blur-sm max-w-2xl mx-auto">
                <p className="text-lg sm:text-xl md:text-2xl text-yellow-400 mb-4">
                  {loadingWinner ? '⏳ Calculando vencedor...' : '🏆 Parabéns a todas as equipes!'}
                </p>
                <p className="text-base sm:text-lg md:text-xl text-gray-300">
                  Aguarde o resultado final do ranking
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Efeito de scanlines (estilo arcade) */}
        <div className="fixed inset-0 pointer-events-none opacity-10">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-white to-transparent animate-scan"></div>
        </div>

        <style jsx>{`
          @keyframes glitch {
            0%, 100% {
              transform: translate(0);
            }
            20% {
              transform: translate(-2px, 2px);
            }
            40% {
              transform: translate(-2px, -2px);
            }
            60% {
              transform: translate(2px, 2px);
            }
            80% {
              transform: translate(2px, -2px);
            }
          }

          @keyframes scan {
            0% {
              transform: translateY(-100%);
            }
            100% {
              transform: translateY(100%);
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse-gold {
            0%, 100% {
              color: rgb(250, 204, 21);
              text-shadow: 0 0 20px rgba(250, 204, 21, 0.5);
            }
            50% {
              color: rgb(255, 237, 160);
              text-shadow: 0 0 40px rgba(250, 204, 21, 0.8), 0 0 60px rgba(250, 204, 21, 0.4);
            }
          }

          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(250, 204, 21, 0.3), 0 0 40px rgba(250, 204, 21, 0.2);
            }
            50% {
              box-shadow: 0 0 40px rgba(250, 204, 21, 0.5), 0 0 80px rgba(250, 204, 21, 0.3), 0 0 120px rgba(250, 204, 21, 0.2);
            }
          }

          @keyframes bounce-slow {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            50% {
              transform: translateY(-20px) scale(1.1);
            }
          }

          @keyframes confetti {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0.3;
            }
          }

          .animate-glitch {
            animation: glitch 0.5s infinite;
          }

          .animate-scan {
            animation: scan 8s linear infinite;
          }

          .animate-fade-in {
            animation: fade-in 1s ease-out;
          }

          .animate-fade-in-up {
            animation: fade-in-up 1s ease-out 0.5s both;
          }

          .animate-pulse-gold {
            animation: pulse-gold 2s ease-in-out infinite;
          }

          .animate-glow {
            animation: glow 2s ease-in-out infinite;
          }

          .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
          }

          .animate-confetti {
            animation: confetti linear infinite;
          }

          .delay-100 {
            animation-delay: 0.1s;
          }

          .delay-200 {
            animation-delay: 0.2s;
          }
        `}</style>
      </div>
    )
  }

  return null
}
