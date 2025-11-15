'use client'

import { useState } from 'react'
import { useRealtimePenalties } from '@/lib/hooks/useRealtime'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

interface Penalty {
  id: string
  team_id: string
  team_name: string
  penalty_type: string
  points_deduction: number
  reason: string | null
  assigned_by_admin: boolean
  evaluator_name: string | null
  created_at: string
}

const PENALTY_ICONS: Record<string, string> = {
  plagio: '⚠️',
  desorganizacao: '📌',
  desrespeito: '🚫',
  ausencia: '❌',
  atraso: '⏰'
}

const PENALTY_NAMES: Record<string, string> = {
  plagio: 'Plágio',
  desorganizacao: 'Desorganização',
  desrespeito: 'Desrespeito às Regras',
  ausencia: 'Ausência',
  atraso: 'Atraso'
}

// ✨ P2.3 OPTIMIZATION: Use consolidated hook instead of duplicated fetches
export default function LivePenaltiesStatus() {
  // Get penalties from consolidated hook (includes teams + evaluators + sound)
  const { penalties, loading } = useRealtimePenalties()

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4">⚖️ Penalidades Aplicadas</h3>
        <p className="text-sm text-purple-200">Carregando...</p>
      </div>
    )
  }

  return (
    <div
      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-white"
      role="region"
      aria-live="polite"
      aria-label="Active penalties in event"
    >
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-1">⚖️ Penalidades Aplicadas</h3>
        <p className="text-xs text-purple-200">Últimas penalidades do evento</p>
      </div>

      {penalties.length === 0 ? (
        <div className="text-sm text-purple-200">
          Nenhuma penalidade aplicada até o momento
        </div>
      ) : (
        <div className="space-y-3">
          {penalties.map((penalty) => (
            <div
              key={penalty.id}
              className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
            >
              <span className="text-2xl flex-shrink-0">
                {PENALTY_ICONS[penalty.penalty_type] || '⚖️'}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm truncate">{penalty.team_name}</p>
                  <span className="text-xs font-bold text-[#FF3D00] bg-[#FF3D00]/20 px-2 py-1 rounded whitespace-nowrap">
                    -{penalty.points_deduction} AMF Coins
                  </span>
                </div>

                <p className="text-xs text-purple-200">
                  {PENALTY_NAMES[penalty.penalty_type] || penalty.penalty_type}
                </p>

                {penalty.reason && (
                  <p className="text-xs text-white/60 mt-1 line-clamp-2">
                    {penalty.reason}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2 text-xs text-purple-300">
                  {penalty.assigned_by_admin ? (
                    <span>👤 Admin</span>
                  ) : penalty.evaluator_name ? (
                    <span>👨‍🏫 {penalty.evaluator_name}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-purple-300">
          Total: <span className="font-bold">{penalties.length}</span> penalidades aplicadas
        </p>
      </div>
    </div>
  )
}
