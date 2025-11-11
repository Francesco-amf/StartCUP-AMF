'use client'

import { useRealtimeRanking, useRealtimePhase } from '@/lib/hooks/useRealtime'
import RankingBoard from '@/components/dashboard/RankingBoard'
import CurrentQuestTimer from '@/components/dashboard/CurrentQuestTimer'
import EvaluatorCardsDisplay from '@/components/EvaluatorCardsDisplay'
import LivePowerUpStatus from '@/components/dashboard/LivePowerUpStatus'
import LivePenaltiesStatus from '@/components/dashboard/LivePenaltiesStatus'
import AudioAuthorizationBanner from '@/components/dashboard/AudioAuthorizationBanner'
import QuestDebugPanel from '@/components/dashboard/QuestDebugPanel'
import EventEndCountdownWrapper from '@/components/EventEndCountdownWrapper'

export default function LiveDashboard() {
  const { ranking, loading: rankingLoading } = useRealtimeRanking()
  const { phase, loading: phaseLoading } = useRealtimePhase()

  return (
    <>
      <EventEndCountdownWrapper />
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
        {/* Audio Authorization Banner */}
        <AudioAuthorizationBanner />

        {/* Timer da Fase e Quest Atual - Topo em destaque */}
        {phase?.event_status === 'running' && phase?.phase_started_at && (
          <div className="mb-6">
            <CurrentQuestTimer
              phase={phase.current_phase}
              phaseStartedAt={phase.phase_started_at}
              phaseDurationMinutes={phase.phases?.duration_minutes || 60}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Coluna Principal - Ranking */}
          <div className="lg:col-span-3 space-y-6">
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

          {/* Coluna Lateral - Info Cards */}
          <div className="space-y-4">

            {/* Status do Evento */}
            <div className="bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 backdrop-blur-sm border-2 border-[#00E5FF]/40 rounded-lg p-4 text-white">
              <h3 className="text-lg font-bold mb-3 text-[#00E5FF]">📊 Status do Evento</h3>

              <div className="space-y-2 text-sm">
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
                    <span className="text-[#00E5FF]/80">Fase:</span>
                    <span className="font-bold text-white text-xs truncate">{phase.phases.name}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-[#00E5FF]/80">Equipes:</span>
                  <span className="font-bold text-white">{ranking.length}</span>
                </div>
              </div>
            </div>

            {/* Top 3 Resumido */}
            {ranking.length >= 3 && (
              <div className="bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 backdrop-blur-sm border-2 border-[#00E5FF]/40 rounded-lg p-4 text-white">
                <h3 className="text-lg font-bold mb-3 text-[#00E5FF]">🏅 Pódio</h3>

                <div className="space-y-2">
                  {ranking.slice(0, 3).map((team, index) => (
                    <div key={team.team_id} className="flex items-center gap-2 p-2 bg-[#0A1E47]/40 rounded border-l-4 border-[#00E5FF]/60">
                      <span className="text-xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-white text-xs">{team.team_name}</p>
                      </div>
                      <span className="font-bold text-sm text-[#00E5FF]">
                        🪙 {team.total_points.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Power-ups Ativados */}
            <div className="hidden lg:block">
              <LivePowerUpStatus />
            </div>

            {/* Penalidades Aplicadas */}
            <div className="hidden lg:block">
              <LivePenaltiesStatus />
            </div>

          </div>

        </div>
      </div>

      {/* 🔍 PAINEL DE DEBUG - Quest Congelada */}
      <QuestDebugPanel />
    </div>
    </>
  )
}

