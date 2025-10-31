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
      // Garantir que o timestamp seja interpretado como UTC
      // Se não tem 'Z' no final, adicionar para forçar UTC
      const utcTimestamp = phaseStartedAt.endsWith('Z') ? phaseStartedAt : phaseStartedAt + 'Z'
      const startTime = new Date(utcTimestamp).getTime()
      const endTime = startTime + durationMinutes * 60 * 1000
      const now = new Date().getTime()
      const difference = endTime - now

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
    <Card className="p-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{phaseName}</h2>
        
        {timeLeft.isExpired ? (
          <div className="text-4xl font-bold animate-pulse">
            ⏰ TEMPO ESGOTADO!
          </div>
        ) : (
          <div className="flex justify-center gap-4 text-6xl font-bold font-mono">
            <div className="flex flex-col items-center">
              <span>{formatNumber(timeLeft.hours)}</span>
              <span className="text-sm font-normal">horas</span>
            </div>
            <span>:</span>
            <div className="flex flex-col items-center">
              <span>{formatNumber(timeLeft.minutes)}</span>
              <span className="text-sm font-normal">min</span>
            </div>
            <span>:</span>
            <div className="flex flex-col items-center">
              <span>{formatNumber(timeLeft.seconds)}</span>
              <span className="text-sm font-normal">seg</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}