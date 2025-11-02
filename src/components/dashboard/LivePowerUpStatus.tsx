'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TeamPowerUp {
  team_id: string
  team_name: string
  power_up_type: string
}

const POWER_UP_ICONS: Record<string, string> = {
  mentor_session: '👨‍🏫',
  instant_feedback: '⚡',
  checkpoint_review: '✅',
  revision_session: '🔍'
}

const POWER_UP_NAMES: Record<string, string> = {
  mentor_session: 'Mentoria de 15min',
  instant_feedback: 'Feedback Instantâneo',
  checkpoint_review: 'Checkpoint Extra',
  revision_session: 'Sessão de Revisão'
}

export default function LivePowerUpStatus() {
  const [powerUps, setPowerUps] = useState<TeamPowerUp[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPhase, setCurrentPhase] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchPowerUps = async () => {
      try {
        // Obter fase atual
        const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
        const { data: eventConfig } = await supabase
          .from('event_config')
          .select('current_phase, event_status')
          .eq('id', eventConfigId)
          .single()

        if (!eventConfig) {
          setPowerUps([])
          setLoading(false)
          return
        }

        // Se evento não está em andamento, limpar power-ups
        if (eventConfig.event_status !== 'running') {
          setPowerUps([])
          setCurrentPhase(eventConfig.current_phase)
          setLoading(false)
          return
        }

        setCurrentPhase(eventConfig.current_phase)

        // Obter power-ups usados APENAS nesta fase específica e que estão com status 'used'
        const { data: pups } = await supabase
          .from('power_ups')
          .select('team_id, power_up_type')
          .eq('phase_used', eventConfig.current_phase)
          .eq('status', 'used')

        if (pups && pups.length > 0) {
          // Obter nomes das equipes
          const teamIds = [...new Set(pups.map(p => p.team_id))]
          const { data: teams } = await supabase
            .from('teams')
            .select('id, name')
            .in('id', teamIds)

          const teamMap = new Map(teams?.map(t => [t.id, t.name]) || [])

          // Filtrar apenas power-ups de equipes que existem
          const formatted = pups
            .filter(p => teamMap.has(p.team_id))
            .map((p: any) => ({
              team_id: p.team_id,
              team_name: teamMap.get(p.team_id)!,
              power_up_type: p.power_up_type
            }))
          setPowerUps(formatted)
        } else {
          setPowerUps([])
        }
      } catch (err) {
        console.error('Erro ao buscar power-ups:', err)
        setPowerUps([])
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchPowerUps()

    // Atualizar a cada 5 segundos para pegar mudanças de fase
    const interval = setInterval(fetchPowerUps, 5000)
    return () => clearInterval(interval)
  }, [supabase])

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4">⚡ Power-ups Ativados</h3>
        <p className="text-sm text-purple-200">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-white" role="region" aria-live="polite" aria-label="Active power-ups in current phase">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-1">⚡ Power-ups Ativados</h3>
        <p className="text-xs text-purple-200">Fase {currentPhase + 1}</p>
      </div>

      {powerUps.length === 0 ? (
        <div className="text-sm text-purple-200">
          Nenhum power-up ativado nesta fase
        </div>
      ) : (
        <div className="space-y-2">
          {powerUps.map((powerUp) => (
            <div
              key={`${powerUp.team_id}-${powerUp.power_up_type}`}
              className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {POWER_UP_ICONS[powerUp.power_up_type] || '⚡'}
                </span>
                <div>
                  <p className="font-semibold text-sm">{powerUp.team_name}</p>
                  <p className="text-xs text-purple-200">
                    {POWER_UP_NAMES[powerUp.power_up_type] || powerUp.power_up_type}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-purple-500/30 px-2 py-1 rounded text-purple-100">
                Ativo
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-purple-300">
          Total: <span className="font-bold">{powerUps.length}</span> power-ups ativados
        </p>
      </div>
    </div>
  )
}
