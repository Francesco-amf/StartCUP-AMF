'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UsePowerUpStatusReturn {
  canUse: boolean
  usedPowerUp: string | null
  isLoading: boolean
  currentPhase: number | null
}

export function usePowerUpStatus(): UsePowerUpStatusReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [canUse, setCanUse] = useState(true)
  const [usedPowerUp, setUsedPowerUp] = useState<string | null>(null)
  const [currentPhase, setCurrentPhase] = useState<number | null>(null)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current
    const checkPowerUpUsage = async () => {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setCanUse(true)
          setUsedPowerUp(null)
          setCurrentPhase(null)
          setIsLoading(false)
          return
        }

        // Buscar equipe e evento em paralelo
        const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
        const [teamResult, eventResult] = await Promise.all([
          supabase
            .from('teams')
            .select('id')
            .eq('email', user.email)
            .maybeSingle(),
          supabase
            .from('event_config')
            .select('current_phase')
            .eq('id', eventConfigId)
            .maybeSingle()
        ])

        if (teamResult.error || !teamResult.data || eventResult.error || !eventResult.data) {
          setCanUse(true)
          setUsedPowerUp(null)
          setCurrentPhase(null)
          setIsLoading(false)
          return
        }

        const phaseId = eventResult.data.current_phase
        setCurrentPhase(phaseId)

        // Verificar power-ups usados APENAS nesta fase
        // Importante: Só busca power-ups onde phase_used === current_phase
        const { data: existingPowerUps, error: powerUpError } = await supabase
          .from('power_ups')
          .select('power_up_type')
          .eq('team_id', teamResult.data.id)
          .eq('phase_used', phaseId)
          .eq('status', 'used')
          .limit(1)

        if (powerUpError) {
          console.error('Erro ao verificar power-ups:', powerUpError)
          setCanUse(true)
          setUsedPowerUp(null)
          setIsLoading(false)
          return
        }

        if (existingPowerUps && existingPowerUps.length > 0) {
          setUsedPowerUp(existingPowerUps[0].power_up_type)
          setCanUse(false)
        } else {
          setCanUse(true)
          setUsedPowerUp(null)
        }
      } catch (err) {
        console.error('Erro ao verificar power-up:', err)
        setCanUse(true)
        setUsedPowerUp(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkPowerUpUsage()

    // Verificar a cada 2 segundos (reduzido de 10 para ser mais responsivo a mudanças de fase)
    const interval = setInterval(checkPowerUpUsage, 2000)
    return () => clearInterval(interval)
  }, [])

  return { canUse, usedPowerUp, isLoading, currentPhase }
}
