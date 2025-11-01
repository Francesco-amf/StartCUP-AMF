'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

interface Quest {
  questNumber: number
  name: string
  description: string
  maxPoints: number
  deliveryType: string[]
}

interface CurrentQuestTimerProps {
  phase: number
  phaseStartedAt: string
  phaseDurationMinutes: number
}

// Quest data by phase
const PHASES_QUESTS: Record<number, Quest[]> = {
  1: [
    {
      questNumber: 1,
      name: 'Conhecendo o Terreno',
      description: 'Análise do mercado através de TAM/SAM/SOM',
      maxPoints: 100,
      deliveryType: ['file']
    },
    {
      questNumber: 2,
      name: 'A Persona Secreta',
      description: 'Definir o público-alvo da startup',
      maxPoints: 50,
      deliveryType: ['file', 'text']
    },
    {
      questNumber: 3,
      name: 'Construindo Pontes',
      description: 'Estratégia de relacionamento e distribuição',
      maxPoints: 50,
      deliveryType: ['file']
    }
  ],
  2: [
    {
      questNumber: 1,
      name: 'A Grande Ideia',
      description: 'Proposta de valor única + Business Model Canvas',
      maxPoints: 100,
      deliveryType: ['file', 'text']
    },
    {
      questNumber: 2,
      name: 'Identidade Secreta',
      description: 'Nome e logotipo da startup',
      maxPoints: 50,
      deliveryType: ['file']
    },
    {
      questNumber: 3,
      name: 'Prova de Conceito',
      description: 'Protótipo navegável da solução',
      maxPoints: 150,
      deliveryType: ['url', 'file']
    }
  ],
  3: [
    {
      questNumber: 1,
      name: 'Montando o Exército',
      description: 'Atividades-chave e recursos necessários',
      maxPoints: 50,
      deliveryType: ['file']
    },
    {
      questNumber: 2,
      name: 'Aliados Estratégicos',
      description: 'Definir 2 parceiros-chave',
      maxPoints: 50,
      deliveryType: ['file', 'text']
    },
    {
      questNumber: 3,
      name: 'Show Me The Money',
      description: 'Estrutura de custos e receitas',
      maxPoints: 100,
      deliveryType: ['file']
    }
  ],
  4: [
    {
      questNumber: 1,
      name: 'Teste de Fogo',
      description: 'Simular uso do produto e melhorias',
      maxPoints: 50,
      deliveryType: ['file']
    },
    {
      questNumber: 2,
      name: 'Validação de Mercado',
      description: 'Pesquisa rápida com 5+ pessoas',
      maxPoints: 50,
      deliveryType: ['file']
    },
    {
      questNumber: 3,
      name: 'Números que Convencem',
      description: 'Refinar projeções financeiras',
      maxPoints: 50,
      deliveryType: ['file']
    }
  ],
  5: [
    {
      questNumber: 1,
      name: 'A História Épica',
      description: 'Estruturar narrativa do pitch (5 minutos)',
      maxPoints: 75,
      deliveryType: ['file']
    },
    {
      questNumber: 2,
      name: 'Slides de Impacto',
      description: 'Criar apresentação visual',
      maxPoints: 50,
      deliveryType: ['file', 'url']
    },
    {
      questNumber: 3,
      name: 'Ensaio Geral',
      description: 'Treinar pitch e ajustar timing',
      maxPoints: 25,
      deliveryType: ['file']
    }
  ]
}

export default function CurrentQuestTimer({
  phase,
  phaseStartedAt,
  phaseDurationMinutes
}: CurrentQuestTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    percentage: number
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    percentage: 100
  })

  const quests = PHASES_QUESTS[phase] || []
  const questCount = quests.length
  const timePerQuest = (phaseDurationMinutes / questCount) * 60 * 1000 // Convert to milliseconds

  useEffect(() => {
    const calculateTimeLeft = () => {
      const utcTimestamp = phaseStartedAt.endsWith('Z') ? phaseStartedAt : phaseStartedAt + 'Z'
      const startTime = new Date(utcTimestamp).getTime()
      const now = new Date().getTime()
      const elapsed = now - startTime
      const totalDuration = phaseDurationMinutes * 60 * 1000

      if (elapsed >= totalDuration) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          percentage: 0
        })
        return
      }

      const timeRemaining = totalDuration - elapsed
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)
      const percentage = Math.round((timeRemaining / totalDuration) * 100)

      setTimeLeft({
        hours,
        minutes,
        seconds,
        percentage
      })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [phaseStartedAt, phaseDurationMinutes])

  const formatNumber = (num: number) => String(num).padStart(2, '0')

  // Determine which quest is current based on time elapsed
  const elapsedSeconds = Math.floor(
    (new Date().getTime() -
      new Date(phaseStartedAt.endsWith('Z') ? phaseStartedAt : phaseStartedAt + 'Z').getTime()) / 1000
  )
  const timePerQuestSeconds = (phaseDurationMinutes / questCount) * 60
  const currentQuestIndex = Math.floor(elapsedSeconds / timePerQuestSeconds)
  const currentQuest = quests[Math.min(currentQuestIndex, quests.length - 1)]
  const questTimeRemaining = timePerQuestSeconds - (elapsedSeconds % timePerQuestSeconds)

  const getProgressColor = () => {
    if (timeLeft.percentage > 66) return 'bg-green-500'
    if (timeLeft.percentage > 33) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-4">
      {/* Quest Atual */}
      <Card className="p-4 md:p-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white overflow-hidden">
        <div className="space-y-3">
          <div>
            <p className="text-xs md:text-sm font-semibold text-indigo-100 mb-1">
              QUEST ATUAL ({currentQuestIndex + 1}/{questCount})
            </p>
            <h3 className="text-lg md:text-2xl font-bold mb-1 truncate">
              {currentQuest?.questNumber}. {currentQuest?.name}
            </h3>
            <p className="text-sm md:text-base text-indigo-100 line-clamp-2">
              {currentQuest?.description}
            </p>
          </div>

          {/* Progress bar for quest */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs md:text-sm font-semibold">Tempo desta Quest</span>
              <span className="text-xs md:text-sm font-mono">
                {Math.floor(questTimeRemaining / 60)}:{formatNumber(Math.floor(questTimeRemaining % 60))}
              </span>
            </div>
            <div className="w-full bg-[#0A1E47]/20 rounded-full h-2 md:h-3 overflow-hidden">
              <div
                className="bg-[#0A1E47] h-full transition-all duration-1000"
                style={{
                  width: `${Math.max(0, (questTimeRemaining / timePerQuestSeconds) * 100)}%`
                }}
              />
            </div>
          </div>

          {/* Points info */}
          <div className="flex justify-between items-center pt-2 border-t border-[#00E5FF]/40">
            <span className="text-xs md:text-sm">Pontos desta Quest</span>
            <span className="text-lg md:text-xl font-bold">{currentQuest?.maxPoints} pts</span>
          </div>
        </div>
      </Card>

      {/* Total Phase Time */}
      <Card className="p-4 md:p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 text-white overflow-visible border-2 border-[#00E5FF]/40">
        <div className="space-y-4">
          <div>
            <p className="text-xs md:text-sm font-semibold text-[#00E5FF] mb-3">⏱️ TEMPO TOTAL DA FASE</p>

            {/* Timer Numbers - Escala fluida com CSS clamp */}
            <div
              className="flex items-center justify-center gap-0 font-bold font-mono leading-none"
              style={{
                fontSize: 'clamp(1.5rem, 8vw, 2.5rem)',
              }}
            >
              {/* Horas */}
              <div className="flex flex-col items-center min-w-max">
                <span className="leading-tight">{formatNumber(timeLeft.hours)}</span>
                <span className="font-normal mt-0.5" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>h</span>
              </div>

              {/* Separador */}
              <span className="leading-tight" style={{ padding: 'clamp(0.25rem, 1vw, 1rem)' }}>:</span>

              {/* Minutos */}
              <div className="flex flex-col items-center min-w-max">
                <span className="leading-tight">{formatNumber(timeLeft.minutes)}</span>
                <span className="font-normal mt-0.5" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>m</span>
              </div>

              {/* Separador */}
              <span className="leading-tight" style={{ padding: 'clamp(0.25rem, 1vw, 1rem)' }}>:</span>

              {/* Segundos */}
              <div className="flex flex-col items-center min-w-max">
                <span className="leading-tight">{formatNumber(timeLeft.seconds)}</span>
                <span className="font-normal mt-0.5" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>s</span>
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="space-y-2">
            <div className="w-full bg-[#0A1E47]/20 rounded-full h-3 md:h-4 overflow-hidden">
              <div
                className={`${getProgressColor()} h-full transition-all duration-1000`}
                style={{ width: `${timeLeft.percentage}%` }}
              />
            </div>
            <p className="text-xs md:text-sm text-white/80 text-center font-semibold">
              {timeLeft.percentage}% da fase restante
            </p>
          </div>
        </div>
      </Card>

      {/* Próximas Quests */}
      {currentQuestIndex < quests.length - 1 && (
        <div className="bg-[#0A1E47]/40 backdrop-blur-sm border-2 border-[#00E5FF]/40 rounded-lg p-4">
          <p className="text-xs md:text-sm font-bold text-[#00E5FF] mb-3 uppercase tracking-wide">📋 PRÓXIMAS QUESTS</p>
          <div className="space-y-2">
            {quests.slice(currentQuestIndex + 1, currentQuestIndex + 3).map((quest) => (
              <div key={quest.questNumber} className="flex items-start gap-3 p-3 bg-[#0A1E47]/60 border border-[#00E5FF]/20 rounded-lg hover:border-[#00E5FF]/40 transition-all">
                <span className="text-base font-bold text-[#00E5FF] flex-shrink-0">
                  {quest.questNumber}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-white truncate">
                    {quest.name}
                  </p>
                  <p className="text-xs text-[#00E5FF]/80 line-clamp-1">{quest.description}</p>
                </div>
                <span className="text-xs md:text-sm font-bold text-yellow-300 flex-shrink-0 whitespace-nowrap">
                  {quest.maxPoints}pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
