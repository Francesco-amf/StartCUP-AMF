'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

interface PhaseTimerProps {
  phaseStartedAt: string
  durationMinutes: number
  phaseName: string
}

export default function PhaseTimer({
  phaseStartedAt,
  durationMinutes,
  phaseName,
}: PhaseTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      // ⚠️ CRÍTICO: phaseStartedAt pode vir SEM Z do Supabase
      // Se não tem Z, adicionar para forçar interpretação como UTC
      const ensureZFormat = phaseStartedAt.endsWith('Z')
        ? phaseStartedAt
        : `${phaseStartedAt}Z`

      const startTime = new Date(ensureZFormat).getTime()
      const endTime = startTime + durationMinutes * 60 * 1000
      const now = new Date().getTime()
      const difference = endTime - now

      console.log(`⏱️ PhaseTimer - ${phaseName}:`)
      console.log(`   phaseStartedAt (raw): ${phaseStartedAt}`)
      console.log(`   with Z: ${ensureZFormat}`)
      console.log(`   startTime (ms): ${startTime}`)
      console.log(`   endTime (ms): ${endTime}`)
      console.log(`   now (ms): ${now}`)
      console.log(`   difference (ms): ${difference}`)
      console.log(`   difference (mins): ${(difference / 1000 / 60).toFixed(1)}`)

      if (difference <= 0) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        })
        return
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({
        hours,
        minutes,
        seconds,
        isExpired: false,
      })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [phaseStartedAt, durationMinutes])

  const formatNumber = (num: number) => String(num).padStart(2, '0')

  return (
    <Card className="p-4 md:p-6 bg-gradient-to-r from-[#0A1E47]0 to-[#001A4D]0 text-white overflow-hidden">
      <div className="text-center">
        <h2 className="text-lg md:text-2xl font-bold mb-2 truncate">{phaseName}</h2>

        {timeLeft.isExpired ? (
          <div className="text-2xl md:text-4xl font-bold animate-pulse">
            ⏰ TEMPO ESGOTADO!
          </div>
        ) : (
          <div className="flex justify-center gap-1 md:gap-4 text-3xl md:text-6xl font-bold font-mono overflow-x-auto">
            <div className="flex flex-col items-center flex-shrink-0">
              <span>{formatNumber(timeLeft.hours)}</span>
              <span className="text-xs md:text-sm font-normal">horas</span>
            </div>
            <span className="flex-shrink-0">:</span>
            <div className="flex flex-col items-center flex-shrink-0">
              <span>{formatNumber(timeLeft.minutes)}</span>
              <span className="text-xs md:text-sm font-normal">min</span>
            </div>
            <span className="flex-shrink-0">:</span>
            <div className="flex flex-col items-center flex-shrink-0">
              <span>{formatNumber(timeLeft.seconds)}</span>
              <span className="text-xs md:text-sm font-normal">seg</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}