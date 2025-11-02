import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Header from '@/components/Header'
import EvaluatorStatusList from '@/components/EvaluatorStatusList'
import CurrentQuestCard from '@/components/CurrentQuestCard'
import PowerUpsGuide from '@/components/PowerUpsGuide'
import PenaltiesGuide from '@/components/PenaltiesGuide'
import PhaseDetailsCard from '@/components/PhaseDetailsCard'
import FinalEvaluationGuide from '@/components/FinalEvaluationGuide'
import TeamLogoUpload from '@/components/TeamLogoUpload'
import PowerUpActivator from '@/components/PowerUpActivator'

export default async function TeamDashboard() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // Buscar informações da equipe
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('email', user.email)
    .single()

  // Buscar configuração do evento
  const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
  const { data: eventConfig } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', eventConfigId)
    .single()

  const phaseNames = [
    { name: 'Preparação', icon: '⏸️', color: 'gray' },
    { name: 'Fase 1: Descoberta', icon: '🔍', color: 'blue' },
    { name: 'Fase 2: Criação', icon: '💡', color: 'purple' },
    { name: 'Fase 3: Estratégia', icon: '📊', color: 'green' },
    { name: 'Fase 4: Refinamento', icon: '✨', color: 'yellow' },
    { name: 'Fase 5: Pitch Final', icon: '🎯', color: 'red' },
  ]

  const currentPhase = phaseNames[eventConfig?.current_phase || 0]

  // Buscar submissions da equipe
  const { data: submissions } = await supabase
    .from('submissions')
    .select('quest_id, status, final_points')
    .eq('team_id', team?.id)

  console.log('📦 Team submissions for dashboard:', submissions)

  // Calcular pontuação total
  const totalPoints = submissions?.reduce((sum, s) => sum + (s.final_points || 0), 0) || 0

  // Determinar a quest atual (primeira não completa)
  // Mapa de quests por fase
  const questsByPhase: Record<number, number[]> = {
    1: [1, 2, 3],
    2: [1, 2, 3],
    3: [1, 2, 3],
    4: [1, 2, 3],
    5: [1, 2, 3]
  }

  const phaseQuests = questsByPhase[eventConfig?.current_phase || 1] || [1, 2, 3]
  const completedQuestIds = submissions
    ?.filter(s => s.status === 'evaluated')
    .map(s => s.quest_id) || []

  // Encontrar primeira quest não completada (por questNumber dentro da fase)
  let currentQuestNumber = 1
  for (const questNum of phaseQuests) {
    const questId = `${eventConfig?.current_phase}-${questNum}`
    if (!completedQuestIds.includes(questId)) {
      currentQuestNumber = questNum
      break
    }
  }

  return (
    <div className="min-h-screen gradient-startcup overflow-x-hidden">
      <Header
        title={`Bem-vindo, ${team?.name || 'Equipe'}! 👋`}
        subtitle={team?.course}
        showLogout={true}
        logoUrl={team?.logo_url}
      />

      <div className="w-screen px-2 py-2">
        {/* Upload de Logo - Discreto no topo */}
        <div className="text-right py-1 px-2">
          <TeamLogoUpload
            teamId={team?.id || ''}
            teamName={team?.name || 'Equipe'}
            currentLogoUrl={team?.logo_url}
          />
        </div>

        <div className="grid gap-2 md:gap-3 p-3">
          {/* Fase Atual do Evento */}
          <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-r from-[#0A1E47] to-[#001A4D] border-2 border-[#00E5FF]/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm text-[#00E5FF] font-semibold mb-1">🎮 FASE ATUAL DO EVENTO</p>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#00E5FF]">
                  {currentPhase.icon} {currentPhase.name}
                </h2>
              </div>
              <div className="text-right">
                {eventConfig?.event_started && !eventConfig?.event_ended && (
                  <span className="bg-green-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-sm">
                    🔥 EM ANDAMENTO
                  </span>
                )}
                {!eventConfig?.event_started && (
                  <span className="bg-gray-400 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-sm">
                    ⏸️ AGUARDANDO
                  </span>
                )}
                {eventConfig?.event_ended && (
                  <span className="bg-red-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-sm">
                    🏁 ENCERRADO
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Estatísticas */}
          <div className="grid gap-1 sm:gap-2 md:gap-4 md:grid-cols-3">
            <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-br from-[#1B4A7F] via-[#0F3860] to-[#0A1E47] border-l-4 border-[#0077FF]/80">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white">Pontuação Total</h3>
                <span className="text-lg sm:text-2xl">🏆</span>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#00B3FF]">
                {totalPoints}
              </p>
            </Card>

            <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-br from-[#0B5A80] via-[#0A3A5A] to-[#0A1E47] border-l-4 border-[#00D4FF]/80">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white">Entregas</h3>
                <span className="text-lg sm:text-2xl">📦</span>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#00E5FF]">
                {submissions?.length || 0}
              </p>
            </Card>

            <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-br from-[#1B5A5A] via-[#0A4040] to-[#0A1E47] border-l-4 border-[#00FF88]/80">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white">Avaliadas</h3>
                <span className="text-lg sm:text-2xl">✅</span>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#00FF88]">
                {submissions?.filter(s => s.status === 'evaluated').length || 0}
              </p>
            </Card>
          </div>

          {/* Detalhes Completos da Fase Atual com Quest Atual */}
          <PhaseDetailsCard
            currentPhase={eventConfig?.current_phase || 0}
            currentQuestNumber={currentQuestNumber}
          />

          {/* Minhas Submissões */}
          <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-br from-[#1B5A7F] via-[#0F3A5A] to-[#0A1E47] border-l-4 border-[#0077FF]/80">
            <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 text-[#00B3FF]">📋 Minhas Entregas</h2>
            {submissions && submissions.length > 0 ? (
              <div className="space-y-1 sm:space-y-2">
                {submissions.map((submission, index) => (
                  <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-[#0A1E47]/40 border-l-4 border-[#00E5FF]/50 rounded-lg hover:bg-[#0A1E47]/60 transition-colors">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-white">Quest {index + 1}</p>
                      <p className="text-xs text-[#00E5FF]/70">
                        Status: {submission.status === 'pending' ? '⏳ Pendente' : '✅ Avaliada'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-lg font-bold text-[#00E5FF]">
                        {submission.final_points || 0} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#00E5FF]/70">
                Nenhuma entrega ainda. Clique abaixo para submeter!
              </p>
            )}
          </Card>

          {/* Avaliadores Disponíveis */}
          <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-br from-[#0B5A80] via-[#0A3A60] to-[#0A1E47] border-l-4 border-[#00D4FF]/80">
            <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 text-[#00E5FF]">👥 Avaliadores Disponíveis</h2>
            <EvaluatorStatusList />
          </Card>

          {/* Power-ups - Ativador */}
          <PowerUpActivator />

          {/* Power-ups - Guia */}
          <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-br from-[#1B5A5A] via-[#0A4040] to-[#0A1E47] border-l-4 border-[#00FF88]/80">
            <PowerUpsGuide />
          </Card>

          {/* Penalidades - Guia */}
          <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-br from-[#1B4A7F] via-[#0F3860] to-[#0A1E47] border-l-4 border-[#0077FF]/80">
            <PenaltiesGuide />
          </Card>

          {/* Avaliação Final */}
          <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-br from-[#0B5A80] via-[#0A3A5A] to-[#0A1E47] border-l-4 border-[#00D4FF]/80">
            <FinalEvaluationGuide />
          </Card>

          {/* Ações Rápidas */}
          <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-br from-[#0A1E47]/70 to-[#001A4D]/70 border border-[#00E5FF]/40">
            <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 text-[#00E5FF]">⚡ Ações Rápidas</h2>
            <div className="space-y-2">
              <Link href="/submit">
                <Button className="w-full text-xs sm:text-sm" size="sm">
                  📝 Submeter Entregas
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
