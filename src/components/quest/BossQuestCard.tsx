'use client'

import { Card } from '@/components/ui/card'
import { useEffect, useState, useRef } from 'react'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

interface BossQuestCardProps {
  questName: string
  description: string
  maxPoints: number
  startedAt?: string | null
  deadlineMinutes: number
  isActive: boolean
}

export default function BossQuestCard({
  questName,
  description,
  maxPoints,
  startedAt,
  deadlineMinutes,
  isActive
}: BossQuestCardProps) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number
    seconds: number
  }>({ minutes: 0, seconds: 0 })
  const { play } = useSoundSystem()
  const previousActiveRef = useRef(false)
  const soundPlayedRef = useRef(false) // ✅ NOVO: Garantir que som toca apenas 1x

  useEffect(() => {
    if (!isActive || !startedAt) return

    // Detectar ativação do boss e tocar som APENAS UMA VEZ
    if (isActive && !previousActiveRef.current && !soundPlayedRef.current) {
      play('boss-spawn')
      soundPlayedRef.current = true // Marcar como já tocado
    }
    previousActiveRef.current = isActive

    const calculateTimeLeft = () => {
      // ✅ CORRIGIR TIMESTAMP: Supabase retorna com +00:00, converter para Z
      const cleanTimestamp = startedAt.endsWith('Z') 
        ? startedAt 
        : startedAt.replace('+00:00', 'Z')
      
      const start = new Date(cleanTimestamp)
      
      // Validar que a data é válida
      if (isNaN(start.getTime())) {
        console.error('[BossQuestCard] Invalid started_at timestamp:', startedAt)
        setTimeLeft({ minutes: 0, seconds: 0 })
        return
      }
      
      const deadline = new Date(start.getTime() + deadlineMinutes * 60 * 1000)
      const now = new Date()
      const diff = deadline.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 })
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ minutes, seconds })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [isActive, startedAt, deadlineMinutes])

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-[#5A0A0A]/90 to-[#3A0A0A]/90 border-4 border-[#FF6B6B] p-6">
      {/* Badge BOSS */}
      <div className="absolute top-4 right-4 bg-[#FF6B6B] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
        🔥 BOSS
      </div>

      {/* Cabeçalho */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-[#FF6B6B] mb-2">{questName}</h3>
        <p className="text-[#FF6B6B]/80 text-sm">{description}</p>
      </div>

      {/* Informações */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-lg p-3">
          <p className="text-xs text-[#FF6B6B]/60 mb-1">🪙 AMF Coins</p>
          <p className="text-2xl font-bold text-[#FFD700]">{maxPoints} AMF Coins</p>
        </div>
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-lg p-3">
          <p className="text-xs text-[#FF6B6B]/60 mb-1">Duração</p>
          <p className="text-2xl font-bold text-[#FF6B6B]">{deadlineMinutes} min</p>
        </div>
      </div>

      {/* Timer (se ativo) */}
      {isActive && startedAt && (
        <div className="bg-[#3A0A0A]/80 border-2 border-[#FF6B6B] rounded-lg p-4 mb-4">
          <p className="text-xs text-[#FF6B6B]/60 mb-2 text-center">⏰ TEMPO RESTANTE</p>
          <div className="text-4xl font-mono font-bold text-[#FF6B6B] text-center">
            {String(isNaN(timeLeft.minutes) ? 0 : timeLeft.minutes).padStart(2, '0')}:{String(isNaN(timeLeft.seconds) ? 0 : timeLeft.seconds).padStart(2, '0')}
          </div>
        </div>
      )}

      {/* Tipo de Apresentação */}
      <div className="bg-[#FF6B6B]/20 border border-[#FF6B6B]/40 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎤</span>
          <p className="text-sm font-bold text-[#FF6B6B]">APRESENTAÇÃO PRESENCIAL</p>
        </div>
        <p className="text-xs text-[#FF6B6B]/70">
          Este é um momento de apresentação oral. Não há submissão digital. 
          A avaliação será feita presencialmente pelos jurados.
        </p>
      </div>

      {/* Status */}
      {!isActive && (
        <div className="mt-4 bg-[#0A1E47]/80 border border-[#00E5FF]/40 rounded-lg p-3 text-center">
          <p className="text-sm text-[#00E5FF]">
            ⏳ BOSS será ativado automaticamente após as 3 quests anteriores
          </p>
        </div>
      )}

      {isActive && (
        <div className="mt-4 bg-[#FF6B6B]/20 border-2 border-[#FF6B6B] rounded-lg p-3 text-center animate-pulse">
          <p className="text-sm font-bold text-[#FF6B6B]">
            🔴 BOSS ATIVO - Prepare-se para apresentar!
          </p>
        </div>
      )}
    </Card>
  )
}
