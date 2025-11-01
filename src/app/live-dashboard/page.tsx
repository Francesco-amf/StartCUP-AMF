'use client'

import { useRealtimeRanking, useRealtimePhase } from '@/lib/hooks/useRealtime'
import RankingBoard from '@/components/dashboard/RankingBoard'
import CurrentQuestTimer from '@/components/dashboard/CurrentQuestTimer'
import EvaluatorCardsDisplay from '@/components/EvaluatorCardsDisplay'
import LivePowerUpStatus from '@/components/dashboard/LivePowerUpStatus'
import LivePenaltiesStatus from '@/components/dashboard/LivePenaltiesStatus'

export default function LiveDashboard() {
  const { ranking, loading: rankingLoading } = useRealtimeRanking()
  const { phase, loading: phaseLoading } = useRealtimePhase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001A4D] via-[#0A1E47] to-[#0047AB]" role="main" aria-label="Live Dashboard - Real-time event tracking">
      {/* Header */}
      <div className="bg-[#001A4D]/50 backdrop-blur-sm border-b-2 border-[#00E5FF]/30 p-4 md:p-6" role="banner">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Logo do Evento */}
              <img
                src="/startcup-logo.jpg"
                alt="StartCup AMF"
                className="h-20 md:h-24 w-auto object-contain drop-shadow-lg"
              />

              <div className="border-l-2 border-[#00E5FF]/50"></div>

              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#00E5FF] mb-1">
                  🏆 Ranking Ao Vivo
                </h2>
                <p className="text-[#00E5FF]/80 text-xs md:text-sm">
                  Atualização em Tempo Real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Badge ao vivo */}
              <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full font-bold">
                <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                AO VIVO
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Coluna Principal - Ranking */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-[#00E5FF]">
                🏆 Ranking Geral
              </h2>
              {!rankingLoading && (
                <div className="text-[#00E5FF]/80 text-sm font-semibold">
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

            {/* Cards dos Avaliadores - Preenchendo a página */}
            <div className="bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 backdrop-blur-sm border-2 border-[#00E5FF]/40 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-6 text-[#00E5FF]">👥 Avaliadores - Detalhes</h3>
              <EvaluatorCardsDisplay />
            </div>
          </div>

          {/* Coluna Lateral - Timer e Info */}
          <div className="space-y-6">
            
            {/* Timer da Fase e Quest Atual */}
            {phase?.event_status === 'running' && phase?.phase_started_at && (
              <>
                <CurrentQuestTimer
                  phase={phase.current_phase}
                  phaseStartedAt={phase.phase_started_at}
                  phaseDurationMinutes={phase.phases?.duration_minutes || 60}
                />
              </>
            )}

            {/* Status do Evento */}
            <div className="bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 backdrop-blur-sm border-2 border-[#00E5FF]/40 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4 text-[#00E5FF]">📊 Status do Evento</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#00E5FF]/80">Status:</span>
                  <span className="font-bold capitalize">
                    {phase?.event_status === 'running' ? '🟢 Em Andamento' :
                     phase?.event_status === 'paused' ? '🟡 Pausado' :
                     '⚪ Não Iniciado'}
                  </span>
                </div>

                {phase?.phases && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#00E5FF]/80">Fase Atual:</span>
                    <span className="font-bold text-white">{phase.phases.name}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-[#00E5FF]/80">Equipes:</span>
                  <span className="font-bold text-white">{ranking.length}</span>
                </div>

                {ranking.length > 0 && (
                  <div className="flex justify-between items-center border-t border-[#00E5FF]/20 pt-3">
                    <span className="text-[#00E5FF]/80">Pontuação Líder:</span>
                    <span className="font-bold text-[#00E5FF] text-xl">
                      {ranking[0]?.total_points.toFixed(0)} pts
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Top 3 Resumido */}
            {ranking.length >= 3 && (
              <div className="bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 backdrop-blur-sm border-2 border-[#00E5FF]/40 rounded-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-4 text-[#00E5FF]">🏅 Pódio</h3>

                <div className="space-y-3">
                  {ranking.slice(0, 3).map((team, index) => (
                    <div key={team.team_id} className="flex items-center gap-3 p-3 bg-[#0A1E47]/40 rounded-lg border-l-4 border-[#00E5FF]/60">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <div className="flex-1">
                        <p className="font-bold truncate text-white">{team.team_name}</p>
                        <p className="text-xs text-[#00E5FF]/70 truncate">{team.course}</p>
                      </div>
                      <span className="font-bold text-lg text-[#00E5FF]">
                        {team.total_points.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Power-ups Ativados */}
            <LivePowerUpStatus />

            {/* Penalidades Aplicadas */}
            <LivePenaltiesStatus />

          </div>

        </div>
      </div>
    </div>
  )
}

