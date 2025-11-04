'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

/**
 * Componente que mostra contador regressivo até a próxima execução do auto_advance_phase()
 * O cron executa a cada 1 minuto (* * * * *)
 */
export default function AutoAdvanceCountdown() {
  const [secondsUntilNextRun, setSecondsUntilNextRun] = useState(0)

  useEffect(() => {
    const calculateSecondsUntilNextMinute = () => {
      const now = new Date()
      const secondsIntoMinute = now.getSeconds()
      const millisecondsIntoSecond = now.getMilliseconds()
      
      // Próxima execução é no início do próximo minuto (segundo 0)
      const secondsRemaining = 60 - secondsIntoMinute
      const msRemaining = 1000 - millisecondsIntoSecond
      
      // Total em segundos (arredondado)
      return secondsRemaining - (msRemaining > 500 ? 0 : 1)
    }

    // Atualizar imediatamente
    setSecondsUntilNextRun(calculateSecondsUntilNextMinute())

    // Atualizar a cada 1 segundo
    const interval = setInterval(() => {
      setSecondsUntilNextRun(calculateSecondsUntilNextMinute())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="p-3 bg-gradient-to-r from-[#1B3A5A] to-[#0A2A4A] border border-[#00D4FF]/40">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏱️</span>
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wide">
              Próxima Verificação de Fase
            </p>
            <p className="text-sm text-white/90">
              Auto-advance executa a cada minuto
            </p>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-[#0A1E47] rounded-lg px-4 py-2 border border-[#00D4FF]/60">
            <p className="text-3xl font-bold text-[#00E5FF] tabular-nums">
              {secondsUntilNextRun}s
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
