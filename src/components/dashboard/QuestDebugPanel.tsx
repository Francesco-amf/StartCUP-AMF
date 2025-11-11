'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DiagnosticData {
  eventConfig: any | null
  phases: any | null
  quests: any[] | null
  activeQuest: any | null
  phaseStartTime: string | null
  isLoading: boolean
  error: string | null
}

/**
 * 🔍 PAINEL DE DEBUG - QUEST CONGELADA
 *
 * Use este componente para diagnosticar por que a quest não avança.
 *
 * Para ativar, adicione isso no final de src/app/live-dashboard/page.tsx:
 *
 * import QuestDebugPanel from '@/components/dashboard/QuestDebugPanel'
 * ...
 * export default function LiveDashboard() {
 *   return (
 *     <div>
 *       {/* ...outros components... }
 *       <QuestDebugPanel /> {/* ← Adicione aqui }
 *     </div>
 *   )
 * }
 */

export default function QuestDebugPanel() {
  const [data, setData] = useState<DiagnosticData>({
    eventConfig: null,
    phases: null,
    quests: null,
    activeQuest: null,
    phaseStartTime: null,
    isLoading: false,
    error: null
  })

  const supabase = createClient()

  const runDiagnostics = async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // 1. Buscar event_config
      const { data: eventConfig, error: configError } = await supabase
        .from('event_config')
        .select('*')
        .single()

      if (configError) throw new Error(`Event Config Error: ${configError.message}`)

      if (!eventConfig) throw new Error('Event config not found')

      const currentPhase = eventConfig.current_phase
      const phaseStartColumn = `phase_${currentPhase}_start_time`
      const phaseStartTime = eventConfig[phaseStartColumn]

      // 2. Buscar fase
      const { data: phaseData, error: phaseError } = await supabase
        .from('phases')
        .select('*')
        .eq('order_index', currentPhase)
        .single()

      if (phaseError) throw new Error(`Phase Error: ${phaseError.message}`)

      // 3. Buscar quests
      const { data: quests, error: questsError } = await supabase
        .from('quests')
        .select('*')
        .eq('phase_id', phaseData.id)
        .order('order_index')

      if (questsError) throw new Error(`Quests Error: ${questsError.message}`)

      // 4. Encontrar quest ativa
      const activeQuest = quests?.find((q: any) => q.status === 'active') || null

      setData({
        eventConfig,
        phases: phaseData,
        quests: quests || [],
        activeQuest,
        phaseStartTime,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  useEffect(() => {
    runDiagnostics()
    const interval = setInterval(runDiagnostics, 5000) // Auto-refresh a cada 5s
    return () => clearInterval(interval)
  }, [])

  const getIssues = () => {
    const issues: string[] = []

    if (!data.eventConfig?.event_started) {
      issues.push('Event not started')
    }

    if (!data.phaseStartTime) {
      issues.push(`phase_${data.eventConfig?.current_phase}_start_time is NULL`)
    }

    if (!data.activeQuest) {
      issues.push('No active quest')
    } else if (!data.activeQuest.started_at) {
      issues.push(`Active quest "${data.activeQuest.name}" has NO started_at!`)
    }

    return issues
  }

  const issues = getIssues()
  const isHealthy = issues.length === 0

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Card className={`p-4 text-white text-xs font-mono ${
        isHealthy ? 'bg-green-900/70' : 'bg-red-900/70'
      } border-2 ${isHealthy ? 'border-green-500' : 'border-red-500'}`}>

        <div className="mb-3 flex justify-between items-center">
          <span className="font-bold">
            {isHealthy ? '✅ QUEST SYSTEM OK' : '❌ QUEST SYSTEM ISSUES'}
          </span>
          <Button
            onClick={runDiagnostics}
            disabled={data.isLoading}
            size="sm"
            className="text-xs"
            variant="outline"
          >
            {data.isLoading ? '⏳' : '🔄'}
          </Button>
        </div>

        {data.error && (
          <div className="bg-red-600/50 p-2 rounded mb-2 text-red-100">
            Error: {data.error}
          </div>
        )}

        <div className="space-y-1 mb-3 pb-3 border-b border-white/20">
          <div>
            <span className="text-gray-300">Phase:</span> {data.eventConfig?.current_phase}
          </div>
          <div>
            <span className="text-gray-300">Active Quest:</span> {data.activeQuest?.name || 'None'} ({data.activeQuest?.order_index})
          </div>
          <div>
            <span className="text-gray-300">Status:</span> {data.activeQuest?.status}
          </div>
          <div className="text-xs mt-1 border-t border-white/10 pt-1 max-h-40 overflow-y-auto">
            <div className="font-bold text-gray-200 mb-1">All Quests:</div>
            {data.quests?.map((q: any) => {
              const started = q.started_at ? new Date(q.started_at).getTime() : 0
              const now = Date.now()
              const elapsedMin = started > 0 ? Math.round((now - started) / 1000 / 60) : -1
              const statusLabel = q.status === 'active' ? 'A' : q.status === 'closed' ? 'C' : 'S'
              const timeStr = q.started_at ? `${elapsedMin}m` : 'pending'

              return (
                <div key={q.id} className="text-gray-400 py-0.5">
                  [{statusLabel}] {q.order_index}. {q.name?.substring(0, 16)}... ({timeStr})
                </div>
              )
            })}
          </div>
        </div>

        {issues.length > 0 && (
          <div className="bg-red-600/30 p-2 rounded space-y-1">
            <div className="font-bold text-red-200">Issues:</div>
            {issues.map((issue, i) => (
              <div key={i} className="text-red-100">• {issue}</div>
            ))}
          </div>
        )}

        <div className="mt-2 text-gray-400 text-xs">
          Auto-refresh: 5s
        </div>
      </Card>
    </div>
  )
}
