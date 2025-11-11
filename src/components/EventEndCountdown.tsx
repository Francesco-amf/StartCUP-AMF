'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

interface WinnerTeam {
  team_id: string
  team_name: string
  total_points: number
}

interface EventEndCountdownProps {
  eventEndTime: string | null
  onEventEnd?: () => void
}

const supabase = createClient()

type EventPhase = 'countdown' | 'gameOver' | 'suspense' | 'winner'

export default function EventEndCountdown({ eventEndTime, onEventEnd }: EventEndCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [currentPhase, setCurrentPhase] = useState<EventPhase>('countdown')
  const [winner, setWinner] = useState<WinnerTeam | null>(null)
  const [loadingWinner, setLoadingWinner] = useState(false)
  const [lastPlayedSecond, setLastPlayedSecond] = useState<number | null>(null)
  const [suspenseCountdown, setSuspenseCountdown] = useState<number>(0)
  const [winnerRevealStage, setWinnerRevealStage] = useState<'hidden' | 'team' | 'name' | 'full'>('hidden')
  const SUSPENSE_DURATION = 15 // Duração em segundos (ajustável) - aumentado para transição épica
  const { playFile } = useSoundSystem()

  // Referência para os áudios
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null)
  const suspenseAudioRef = useRef<HTMLAudioElement | null>(null)
  const winnerMusicRef = useRef<HTMLAudioElement | null>(null)
  const winSoundRef = useRef<HTMLAudioElement | null>(null)

  // Flags para controle
  const audioStartedRef = useRef(false)
  const suspenseStartedRef = useRef(false)
  const winnerMusicStartedRef = useRef(false)
  const winSoundPlayedRef = useRef(false)
  const gameOverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const manuallyAdvancedRef = useRef(false)

  // Tocar som de countdown (usa game-over.mp3 como beep do countdown)
  const playCountdownSound = useCallback((second: number) => {
    console.log(`⏰ [EventEndCountdown] Tocando beep do countdown: ${second}s`)

    try {
      // Se o áudio nunca foi iniciado, criar e iniciar
      if (!audioStartedRef.current) {
        console.log(`⏰ Iniciando som contínuo do countdown no segundo 10`)
        audioStartedRef.current = true

        const audio = new Audio('/sounds/game-over.mp3')
        audio.preload = 'auto'
        audio.volume = 0.6 // Volume para countdown
        audio.loop = true // Loop contínuo
        countdownAudioRef.current = audio

        // Tentar tocar imediatamente
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn(`⚠️ Arquivo game-over.mp3 não disponível para countdown:`, err)
          })
        }
      }
      // Se já está tocando, deixar continuar sem fazer nada
      else if (countdownAudioRef.current && !countdownAudioRef.current.paused) {
        console.log(`⏰ Som já tocando continuamente, ignorando chamada para segundo ${second}s`)
        return
      }
    } catch (error) {
      console.log('❌ Erro ao reproduzir som de countdown')
    }
  }, [])

  // Tocar som de suspense em loop (para Game Over) com fade in
  const playSuspenseLoopSound = useCallback(() => {
    if (suspenseStartedRef.current) {
      console.log(`🎭 Som de suspense em loop já está tocando`)
      return
    }

    try {
      console.log(`🎭 Iniciando som de suspense em loop com fade in`)
      suspenseStartedRef.current = true

      const audio = new Audio('/sounds/suspense.mp3')
      audio.volume = 0 // Começar com volume 0
      audio.loop = true // Som em loop
      suspenseAudioRef.current = audio

      audio.play().catch(err => {
        console.warn(`⚠️ Arquivo suspense.mp3 não disponível:`, err)
      })

      // Fade in de 2 segundos (0 a 0.8)
      let currentVolume = 0
      const fadeInInterval = setInterval(() => {
        currentVolume += 0.4 / 20 // 0.8 volume em 2 segundos (20 steps de 100ms)
        if (currentVolume >= 0.8) {
          currentVolume = 0.8
          clearInterval(fadeInInterval)
        }
        if (audio) {
          audio.volume = currentVolume
        }
      }, 100)
    } catch (error) {
      console.log('❌ Erro ao reproduzir som de suspense em loop')
    }
  }, [])

  // Tocar som do countdown do vencedor (single play, não loop)
  const playSuspenseSound = useCallback(() => {
    if (suspenseStartedRef.current) {
      console.log(`🎭 Som do countdown do vencedor já está tocando`)
      return
    }

    try {
      console.log(`🎭 Iniciando som do countdown do vencedor`)
      suspenseStartedRef.current = true

      const audio = new Audio('/sounds/suspense.mp3')
      audio.volume = 0.8
      audio.loop = false // Som toca uma única vez
      suspenseAudioRef.current = audio

      audio.play().catch(err => {
        console.warn(`⚠️ Arquivo suspense.mp3 não disponível:`, err)
      })
    } catch (error) {
      console.log('❌ Erro ao reproduzir som do countdown do vencedor')
    }
  }, [])

  // Tocar música de vencedor com fade in gradual (7.5 segundos até o máximo)
  const playWinnerMusic = useCallback(() => {
    if (winnerMusicStartedRef.current) {
      console.log(`🏆 Música de vencedor já está tocando`)
      return
    }

    try {
      console.log(`🏆 Iniciando música de vencedor com fade in`)
      winnerMusicStartedRef.current = true

      const audio = new Audio('/sounds/winner-music.mp3')
      audio.volume = 0 // Começar com volume 0
      audio.loop = true // Loop contínuo enquanto a tela estiver visível
      winnerMusicRef.current = audio

      audio.play().catch(err => {
        console.warn(`⚠️ Arquivo winner-music.mp3 não disponível:`, err)
      })

      // Fade in super gradual e suave de 0 para 0.7 em 12.5 segundos (sincronizado com revelação do nome)
      // Usando curva easing para um fade in mais natural e dissoluto
      let currentVolume = 0
      const targetVolume = 0.7
      const fadeInDuration = 12500 // 12.5 segundos
      const fadeInSteps = 250 // 250 steps de 50ms cada (ultra suave)
      const volumeIncrement = targetVolume / fadeInSteps

      console.log(`🎵 Iniciando fade in ultra gradual da música em 12.5 segundos`)
      let stepCount = 0
      const fadeInInterval = setInterval(() => {
        stepCount++
        // Usar easing ease-in-out para um fade mais natural
        const progress = stepCount / fadeInSteps
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress

        currentVolume = targetVolume * easeProgress

        if (stepCount >= fadeInSteps) {
          currentVolume = targetVolume
          clearInterval(fadeInInterval)
          console.log(`🎵 Música alcançou volume máximo (0.7)`)
        }
        if (audio) {
          audio.volume = Math.min(currentVolume, targetVolume)
        }
      }, 50)
    } catch (error) {
      console.log('❌ Erro ao reproduzir música de vencedor')
    }
  }, [])

  // Tocar som de vitória quando o nome da equipe aparecer
  const playWinSound = useCallback(() => {
    if (winSoundPlayedRef.current) {
      console.log(`🎊 Som de vitória já foi tocado`)
      return
    }

    try {
      console.log(`🎊 Tocando som de vitória (win.mp3) com volume bem alto`)
      winSoundPlayedRef.current = true

      const audio = new Audio('/sounds/win.mp3')
      audio.volume = 1.0 // Volume máximo
      audio.loop = false // Tocar uma única vez
      winSoundRef.current = audio

      audio.play().catch(err => {
        console.warn(`⚠️ Arquivo win.mp3 não disponível:`, err)
      })
    } catch (error) {
      console.log('❌ Erro ao reproduzir som de vitória')
    }
  }, [])

  // Buscar equipe vencedora
  const fetchWinner = useCallback(async () => {
    setLoadingWinner(true)
    try {
      const { data, error } = await supabase
        .from('live_ranking')
        .select('team_id, team_name, total_points')
        .order('total_points', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Erro ao buscar vencedor:', error)
        return
      }

      // Se há dados, pegar o primeiro (já está ordenado)
      if (data && data.length > 0) {
        console.log(`🏆 Vencedor encontrado: ${data[0].team_name}`)
        setWinner(data[0])
      } else {
        console.warn('⚠️ Nenhuma equipe encontrada no ranking')
      }
    } catch (error) {
      console.error('Erro ao buscar vencedor:', error)
    } finally {
      setLoadingWinner(false)
    }
  }, [])

  // Transicionar de Countdown para Game Over quando timeLeft chega a 0
  useEffect(() => {
    if (currentPhase === 'countdown' && timeLeft === 0) {
      console.log(`⏰ Transicionando de Countdown para Game Over`)
      setCurrentPhase('gameOver')

      // Para o som do countdown - aumenta volume e desabilita loop
      if (countdownAudioRef.current && !countdownAudioRef.current.paused) {
        countdownAudioRef.current.volume = 0.7
        countdownAudioRef.current.loop = false
      }

      // Buscar o vencedor
      fetchWinner()
    }
  }, [currentPhase, timeLeft])

  // Função para avançar manualmente para Suspense (SEM timer automático)
  const advanceToSuspense = useCallback(() => {
    console.log(`🎭 Avançando manualmente para Suspense`)
    // Parar som de suspense em loop do Game Over
    if (suspenseAudioRef.current) {
      suspenseAudioRef.current.pause()
      suspenseAudioRef.current.currentTime = 0
      suspenseAudioRef.current.src = ''
    }
    suspenseStartedRef.current = false
    setCurrentPhase('suspense')
    setSuspenseCountdown(SUSPENSE_DURATION)
  }, [])

  // Tocar som de suspense em loop quando entra na fase de Game Over
  // O som do countdown continua tocando enquanto suspense entra com fade in
  useEffect(() => {
    if (currentPhase === 'gameOver') {
      playSuspenseLoopSound()
    }
  }, [currentPhase, playSuspenseLoopSound])

  // Tocar música do vencedor durante o countdown de suspense com fade in
  // Também fazer fade out da música de suspense anterior
  useEffect(() => {
    if (currentPhase === 'suspense') {
      // Parar som de suspense em loop do Game Over com fade out
      if (suspenseAudioRef.current) {
        let fadeOutVolume = suspenseAudioRef.current.volume || 0.8
        const fadeOutInterval = setInterval(() => {
          fadeOutVolume -= 0.8 / 10 // Fade out em 1 segundo (10 steps de 100ms)
          if (fadeOutVolume <= 0) {
            fadeOutVolume = 0
            suspenseAudioRef.current?.pause()
            suspenseAudioRef.current = null
            clearInterval(fadeOutInterval)
          }
          if (suspenseAudioRef.current) {
            suspenseAudioRef.current.volume = fadeOutVolume
          }
        }, 100)
      }
      suspenseStartedRef.current = false

      // Tocar música do vencedor durante o countdown
      console.log(`🎵 Tocando música do vencedor durante countdown`)
      playWinnerMusic()
    }
  }, [currentPhase, playWinnerMusic])

  // Countdown da fase de suspense com fade out nos últimos 4 segundos
  useEffect(() => {
    if (currentPhase === 'suspense' && suspenseCountdown > 0) {
      // Aplicar fade out durante os últimos 4 segundos
      if (suspenseCountdown <= 4 && suspenseAudioRef.current) {
        // Calcular volume: de 0.8 em 4s para 0 em 0s
        const volumePercentage = suspenseCountdown / 4
        suspenseAudioRef.current.volume = 0.8 * volumePercentage
        console.log(`🔊 Fade out: ${suspenseCountdown}s - Volume: ${(0.8 * volumePercentage).toFixed(2)}`)
      }

      const timer = setTimeout(() => {
        setSuspenseCountdown(prev => prev - 1)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [currentPhase, suspenseCountdown])

  // Transicionar de Suspense para Winner quando countdown chega a 0
  useEffect(() => {
    if (currentPhase === 'suspense' && suspenseCountdown === 0) {
      console.log(`🏆 Transicionando para Winner`)
      setCurrentPhase('winner')
      setWinnerRevealStage('hidden') // Começar revelação oculta

      // Parar som de suspense se ainda estiver tocando
      if (suspenseAudioRef.current && !suspenseAudioRef.current.paused) {
        suspenseAudioRef.current.pause()
        suspenseAudioRef.current.currentTime = 0
        suspenseAudioRef.current.src = ''
      }

      // Iniciar música de vencedor
      playWinnerMusic()
    }
  }, [currentPhase, suspenseCountdown, playWinnerMusic])

  // Controlar a revelação progressiva do vencedor
  useEffect(() => {
    if (currentPhase === 'winner') {
      // Fase 1: Mostrar "Equipe..." após 0.5s
      const timer1 = setTimeout(() => {
        console.log(`📢 Fase 1: Mostrando 'Equipe vencedora é...'`)
        setWinnerRevealStage('team')
      }, 500)

      // Fase 2: Mostrar nome da equipe após 12.5s (12 segundos de espera + 0.5s inicial)
      const timer2 = setTimeout(() => {
        console.log(`🏆 Fase 2: Revelando nome da equipe`)
        setWinnerRevealStage('name')
      }, 12500)

      // Fase 3: Mostrar informações completas após 15s
      const timer3 = setTimeout(() => {
        console.log(`✨ Fase 3: Mostrando informações completas`)
        setWinnerRevealStage('full')
      }, 15000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [currentPhase])

  // Tocar som de vitória quando o nome da equipe for revelado
  useEffect(() => {
    if (winnerRevealStage === 'name') {
      console.log(`🎊 Nome da equipe revelado! Tocando som de vitória`)
      playWinSound()
    }
  }, [winnerRevealStage, playWinSound])

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
        // Tocar som apenas se mudou de segundo
        if (lastPlayedSecond !== seconds) {
          setLastPlayedSecond(seconds)
          playCountdownSound(seconds)
        }
      } else if (seconds === 0 && currentPhase === 'countdown') {
        // Transição será automática pelo useEffect de transição de fases
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

  // FASE 1: Contagem regressiva final (10 segundos)
  if (currentPhase === 'countdown' && timeLeft !== null && timeLeft > 0) {
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

  // FASE 2: Game Over (silencioso, mostra mensagens)
  if (currentPhase === 'gameOver') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-black via-red-950 to-black flex items-center justify-center overflow-hidden">
        {/* Efeito de scanlines */}
        <div className="fixed inset-0 pointer-events-none opacity-5">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-white to-transparent animate-scan"></div>
        </div>

        <div className="text-center space-y-4 md:space-y-6">
          {/* GAME OVER gigante com efeito */}
          <div className="relative mb-4 md:mb-8">
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-red-600 tracking-widest animate-glitch leading-tight drop-shadow-2xl">
              GAME OVER
            </h1>
            <div className="absolute inset-0 text-5xl md:text-8xl lg:text-9xl font-black text-red-500 opacity-40 blur-xl animate-pulse leading-tight">
              GAME OVER
            </div>
            <div className="absolute inset-0 text-5xl md:text-8xl lg:text-9xl font-black text-white opacity-10 blur-3xl leading-tight">
              GAME OVER
            </div>
          </div>

          {/* Emoji dramático */}
          <div className="text-6xl md:text-8xl lg:text-9xl animate-bounce my-2 md:my-4">
            🏁
          </div>

          {/* Texto de evento terminado */}
          <div className="relative mb-4">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-wider animate-glitch leading-tight">
              EVENTO TERMINADO
            </h2>
            <div className="absolute inset-0 text-3xl md:text-5xl font-black text-white opacity-20 blur-lg animate-pulse leading-tight">
              EVENTO TERMINADO
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-lg md:text-2xl font-bold text-red-300 leading-tight">
              O EVENTO FOI ENCERRADO!
            </p>
            <p className="text-sm md:text-base text-gray-400 leading-tight">
              Todas as submissões foram finalizadas
            </p>
          </div>

          <p className="text-xs md:text-sm text-gray-500 mt-6 md:mt-8 mb-6 md:mb-8">
            Preparando resultado final...
          </p>

          {/* Botão para avançar manualmente */}
          <button
            onClick={advanceToSuspense}
            className="px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-black text-lg md:text-xl rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/50 cursor-pointer"
          >
            ▶️ REVELAR VENCEDOR
          </button>
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

          .animate-glitch {
            animation: glitch 0.3s ease-in-out infinite;
          }

          .animate-scan {
            animation: scan 8s linear infinite;
          }
        `}</style>
      </div>
    )
  }

  // FASE 3: Suspense (15 segundos de transição épica com efeitos especiais)
  if (currentPhase === 'suspense') {
    // Calcular progresso da transição (0 a 1)
    const transitionProgress = 1 - (suspenseCountdown / SUSPENSE_DURATION)
    // Zoom in gradual
    const scale = 1 + transitionProgress * 0.3
    // Opacidade do countdown vai diminuindo nos últimos 3 segundos
    const countdownOpacity = suspenseCountdown > 3 ? 1 : suspenseCountdown / 3

    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-black via-purple-950 to-black flex items-center justify-center overflow-hidden">
        {/* Efeito de scanlines */}
        <div className="fixed inset-0 pointer-events-none opacity-10">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-white to-transparent animate-scan"></div>
        </div>

        {/* Fundo de luz pulsante que cresce */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle, rgba(168, 85, 247, ${0.1 + transitionProgress * 0.2}) 0%, transparent 70%)`,
            animation: 'pulse 2s ease-in-out infinite'
          }}
        ></div>

        {/* Anéis de expansão */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="fixed inset-0 pointer-events-none"
            style={{
              border: '2px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '50%',
              width: `${100 + transitionProgress * 200 + i * 100}px`,
              height: `${100 + transitionProgress * 200 + i * 100}px`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 1 - transitionProgress - i * 0.2,
              animation: `expandRing ${2 + i * 0.5}s ease-out infinite`
            }}
          ></div>
        ))}

        <div className="text-center space-y-6 relative z-10" style={{ transform: `scale(${scale})` }}>
          {/* Estrelas grandes */}
          <div className="text-8xl md:text-9xl animate-pulse my-4">
            ⭐
          </div>

          {/* Título épico com glitch */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-purple-300 tracking-wider leading-tight animate-glitch drop-shadow-2xl">
            O VENCEDOR DO JOGO É...
          </h1>

          {/* Countdown gigante com fade out nos últimos 3 segundos */}
          <div className="mt-12 relative">
            <div
              className="text-8xl md:text-9xl lg:text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-purple-300 to-pink-300 animate-bounce leading-none drop-shadow-2xl transition-opacity duration-300"
              style={{ opacity: countdownOpacity }}
            >
              {suspenseCountdown}
            </div>
          </div>

          {/* Mensagem de antecipação */}
          <p className="text-base md:text-xl text-purple-200 mt-12 font-bold tracking-wide">
            ✨ A REVELAÇÃO SE APROXIMA... ✨
          </p>
        </div>

        <style jsx>{`
          @keyframes glitch {
            0%, 100% {
              transform: translate(0);
            }
            20% {
              transform: translate(-3px, 3px);
            }
            40% {
              transform: translate(-3px, -3px);
            }
            60% {
              transform: translate(3px, 3px);
            }
            80% {
              transform: translate(3px, -3px);
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

          @keyframes expandRing {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(2);
            }
          }

          .animate-glitch {
            animation: glitch 0.3s ease-in-out infinite;
          }

          .animate-scan {
            animation: scan 8s linear infinite;
          }
        `}</style>
      </div>
    )
  }

  // FASE 4: Winner - Tela final com vencedor
  if (currentPhase === 'winner') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-yellow-950 via-black to-black overflow-hidden flex flex-col animate-winner-entrance">
        {/* Confetes caindo mais densos com delay para entrada suave */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${0.5 + Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              {['🎉', '🎊', '✨', '⭐', '🌟', '💫'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>

        {/* Fundo de luz que cresce da entrada */}
        <div className="fixed inset-0 pointer-events-none animate-winner-glow" style={{
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.1) 0%, transparent 70%)',
        }}></div>

        {/* Container centralizado - flexível e responsivo */}
        <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-3 sm:py-4 overflow-hidden">
          <div className="text-center space-y-3 sm:space-y-4 md:space-y-5 animate-winner-content-enter relative z-10 w-full max-w-3xl sm:max-w-5xl max-h-full overflow-y-auto">

            {/* VENCEDOR - Destaque total */}
            {winner && (
              <div className="space-y-4 sm:space-y-5 animate-fade-in-up flex-1 flex flex-col overflow-y-auto">
                {/* Troféu mega grande */}
                <div className="text-7xl sm:text-8xl md:text-9xl lg:text-[150px] animate-bounce-slow flex-shrink-0">
                  🏆
                </div>

                {/* Fase 1: Oculto inicialmente */}
                {winnerRevealStage === 'hidden' && (
                  <div className="space-y-4 animate-fade-in-up">
                    <p className="text-2xl sm:text-3xl md:text-4xl text-yellow-300 font-black tracking-wide">
                      ⏳ Preparando revelação...
                    </p>
                  </div>
                )}

                {/* Fase 2: Mostrar "Equipe..." */}
                {(winnerRevealStage === 'team' || winnerRevealStage === 'name' || winnerRevealStage === 'full') && (
                  <>
                    {/* Saudação entusiasmada */}
                    <div className="relative flex-shrink-0 animate-fade-in-up">
                      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-yellow-300 tracking-wider leading-tight animate-pulse">
                        PARABÉNS! 🎊
                      </h1>
                    </div>

                    {/* Revelação da equipe */}
                    <div className="relative flex-shrink-0 animate-reveal-text">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-200 tracking-wide">
                        A EQUIPE VENCEDORA É...
                      </h2>
                    </div>
                  </>
                )}

                {/* Fase 3: Mostrar nome da equipe */}
                {(winnerRevealStage === 'name' || winnerRevealStage === 'full') && (
                  <div className="relative p-4 sm:p-6 md:p-8 bg-gradient-to-br from-yellow-400/30 via-yellow-600/20 to-orange-500/30 border-4 border-yellow-400 rounded-xl backdrop-blur-sm shadow-2xl shadow-yellow-500/60 animate-glow flex-shrink-0 animate-reveal-content">
                    {/* Confetes animados ao redor */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-4xl sm:text-5xl animate-bounce">
                      🎉
                    </div>
                    <div className="absolute -top-4 left-1/3 text-3xl sm:text-4xl animate-bounce delay-100">
                      ✨
                    </div>
                    <div className="absolute -top-4 right-1/3 text-3xl sm:text-4xl animate-bounce delay-200">
                      🎊
                    </div>
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-3xl sm:text-4xl animate-bounce delay-300">
                      ⭐
                    </div>

                    {/* Nome gigante da equipe com efeito de pixel building */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 text-center break-words pt-2 animate-pixel-reveal">
                      {winner.team_name}
                    </h2>

                    {/* Pontuação em destaque */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
                      <span className="text-3xl sm:text-4xl md:text-5xl">🪙</span>
                      <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-yellow-200">
                        {winner.total_points}
                      </span>
                      <span className="text-base sm:text-lg md:text-xl text-yellow-300 font-bold">
                        Pontos
                      </span>
                    </div>

                    {/* Mensagem de celebração */}
                    <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-yellow-100 font-bold text-center animate-pulse">
                      🏅 CAMPEÃ! 🏅
                    </p>
                  </div>
                )}

                {/* Fase 4: Mostrar informações completas */}
                {winnerRevealStage === 'full' && (
                  <div className="animate-fade-in-up" />
                )}

                {/* Mensagem inclusiva para todas as equipes */}
                <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-2 border-purple-400/60 rounded-lg backdrop-blur-sm w-full flex-shrink-0">
                  <p className="text-sm sm:text-base md:text-lg text-purple-100 text-center font-semibold">
                    ✨ Parabéns a todas as equipes! ✨
                  </p>
                  <p className="text-xs sm:text-sm text-purple-300/80 text-center mt-2">
                    Obrigado por participarem desta incrível jornada!
                  </p>
                </div>
              </div>
            )}

            {/* Loading ou sem vencedor */}
            {!winner && (
              <div className="mt-6 space-y-4 flex-1 flex flex-col overflow-y-auto">
                <div className="text-6xl sm:text-7xl md:text-8xl animate-bounce flex-shrink-0">
                  🏆
                </div>
                <p className="text-2xl sm:text-3xl md:text-4xl text-yellow-300 font-black mb-2 flex-shrink-0">
                  {loadingWinner ? '⏳ Calculando Vencedor...' : '🎊 Aguarde...'}
                </p>
                <p className="text-sm sm:text-base md:text-lg text-yellow-100/80 flex-shrink-0">
                  {loadingWinner ? 'Processando resultados finais' : 'Revelando a equipe vencedora'}
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

          @keyframes winner-entrance {
            0% {
              opacity: 0;
              transform: scale(0.8) translateY(100px);
              filter: blur(20px);
            }
            50% {
              filter: blur(10px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0);
            }
          }

          @keyframes winner-glow-entrance {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }

          @keyframes winner-content-enter {
            0% {
              opacity: 0;
              transform: translateY(50px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
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

          .animate-winner-entrance {
            animation: winner-entrance 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          .animate-winner-glow {
            animation: winner-glow-entrance 1.5s ease-out forwards;
          }

          .animate-winner-content-enter {
            animation: winner-content-enter 1s ease-out 0.3s both;
          }

          @keyframes reveal-text {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes reveal-content {
            0% {
              opacity: 0;
              transform: scale(0.9) translateY(30px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .animate-reveal-text {
            animation: reveal-text 0.8s ease-out forwards;
          }

          .animate-reveal-content {
            animation: reveal-content 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          @keyframes pixel-reveal {
            0% {
              opacity: 0;
              background: linear-gradient(90deg, transparent 0%, transparent 100%);
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              text-shadow: none;
              filter: blur(10px) brightness(0.3);
            }
            25% {
              opacity: 0.5;
              filter: blur(8px) brightness(0.6);
            }
            50% {
              opacity: 0.75;
              background: linear-gradient(90deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              filter: blur(4px) brightness(0.9);
              text-shadow:
                0 0 20px rgba(255, 255, 255, 0.5),
                0 0 40px rgba(250, 204, 21, 0.4);
            }
            100% {
              opacity: 1;
              filter: blur(0) brightness(1);
              text-shadow:
                0 0 20px rgba(255, 255, 255, 0.8),
                0 0 40px rgba(250, 204, 21, 0.6),
                0 0 60px rgba(250, 204, 21, 0.4),
                0 0 80px rgba(184, 134, 11, 0.3);
              background: none;
              -webkit-text-fill-color: unset;
              color: white;
            }
          }

          @keyframes pixel-building {
            0% {
              clip-path: inset(0 100% 0 0);
              opacity: 0;
            }
            50% {
              opacity: 0.8;
            }
            100% {
              clip-path: inset(0 0 0 0);
              opacity: 1;
            }
          }

          .animate-pixel-reveal {
            animation: pixel-building 2s ease-in-out forwards, pixel-reveal 2s ease-out forwards;
          }

          .delay-100 {
            animation-delay: 0.1s;
          }

          .delay-200 {
            animation-delay: 0.2s;
          }

          /* Remover barra de scroll */
          ::-webkit-scrollbar {
            display: none;
          }

          /* Firefox */
          * {
            scrollbar-width: none;
          }
        `}</style>
      </div>
    )
  }

  return null
}
