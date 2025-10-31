'use client'

import { useRealtimeRanking, useRealtimePhase } from '@/lib/hooks/useRealtime'
import RankingBoard from '@/components/dashboard/RankingBoard'
import PhaseTimer from '@/components/dashboard/PhaseTimer'

export default function LiveDashboard() {
  const { ranking, loading: rankingLoading } = useRealtimeRanking()
  const { phase, loading: phaseLoading } = useRealtimePhase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4 md:p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
                🎮 StartCup AMF
              </h1>
              <p className="text-purple-200 text-sm md:text-base">
                Ranking ao Vivo - Atualização em Tempo Real
              </p>
            </div>
            
            {/* Badge ao vivo */}
            <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full font-bold">
              <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
              AO VIVO
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Coluna Principal - Ranking */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-white">
                🏆 Ranking Geral
              </h2>
              {!rankingLoading && (
                <div className="text-purple-200 text-sm">
                  {ranking.length} equipes
                </div>
              )}
            </div>

            {rankingLoading ? (
              <div className="text-center text-white py-12">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-xl">Carregando ranking...</p>
              </div>
            ) : (
              <RankingBoard ranking={ranking} />
            )}
          </div>

          {/* Coluna Lateral - Timer e Info */}
          <div className="space-y-6">
            
            {/* Timer da Fase */}
            {phase?.event_status === 'running' && phase?.phase_started_at && (
              <PhaseTimer
                phaseStartedAt={phase.phase_started_at}
                durationMinutes={phase.phases?.duration_minutes || 60}
                phaseName={phase.phases?.name || 'Fase Atual'}
              />
            )}

            {/* Status do Evento */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4">📊 Status do Evento</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-purple-200">Status:</span>
                  <span className="font-bold capitalize">
                    {phase?.event_status === 'running' ? '🟢 Em Andamento' : 
                     phase?.event_status === 'paused' ? '🟡 Pausado' : 
                     '⚪ Não Iniciado'}
                  </span>
                </div>

                {phase?.phases && (
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Fase Atual:</span>
                    <span className="font-bold">{phase.phases.name}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-purple-200">Equipes:</span>
                  <span className="font-bold">{ranking.length}</span>
                </div>

                {ranking.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Pontuação Líder:</span>
                    <span className="font-bold text-yellow-400 text-xl">
                      {ranking[0]?.total_points.toFixed(0)} pts
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Top 3 Resumido */}
            {ranking.length >= 3 && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-4">🏅 Pódio</h3>
                
                <div className="space-y-3">
                  {ranking.slice(0, 3).map((team, index) => (
                    <div key={team.team_id} className="flex items-center gap-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <div className="flex-1">
                        <p className="font-bold truncate">{team.team_name}</p>
                        <p className="text-xs text-purple-200 truncate">{team.course}</p>
                      </div>
                      <span className="font-bold text-lg">
                        {team.total_points.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}