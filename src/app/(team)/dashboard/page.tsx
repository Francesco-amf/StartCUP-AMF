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
import MentorRequestButton from '@/components/MentorRequestButton'
import { Accordion } from '@/components/ui/Accordion'
import AMFCoinsHistory from '@/components/team/AMFCoinsHistory'
import TeamDashboardClient from '@/components/TeamDashboardClient'
import crypto from 'crypto'

// ✅ Server-rendered dynamically on every request
// ✅ No static generation - always fetch fresh data from Supabase
export const dynamic = 'force-dynamic'

export default async function TeamDashboard() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // Buscar informações da equipe
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('email', user.email)
    .single()

  if (teamError || !team) {
    console.error('❌ Erro ao buscar equipe:', teamError)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0F1E] via-[#0A1E47] to-[#0A0F1E]">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Equipe não encontrada</h1>
          <p className="text-red-200 mb-4">
            Não conseguimos encontrar sua equipe no sistema. Por favor, verifique se:
          </p>
          <ul className="text-red-200 text-left mb-4 list-disc list-inside">
            <li>Você está usando o email correto</li>
            <li>Sua equipe foi registrada no sistema</li>
            <li>Entre em contato com os organizadores se o problema persistir</li>
          </ul>
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            ← Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  // Buscar configuração do evento
  const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
  const { data: eventConfig, error: eventError } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', eventConfigId)
    .single()

  if (eventError) {
    console.error('❌ Erro ao buscar configuração do evento:', eventError)
  }

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
    .select('quest_id, status, final_points, created_at')
    .eq('team_id', team?.id)

  // Buscar quests da fase atual diretamente da tabela 'quests' (consistência com /submit)
  const { data: questsData } = await supabase
    .from('quests')
    .select(`
      *,
      phase:phase_id (
        id,
        name,
        order_index
      )
    `)
    .order('phase_id, order_index')

  const quests = (questsData || []).map((quest: any) => ({
    ...quest,
    deliverable_type: Array.isArray(quest.deliverable_type)
      ? quest.deliverable_type
      : (quest.deliverable_type ? [quest.deliverable_type] : [])
  }))

  const sortedQuests = quests
    .filter((q: any) => q.phase?.order_index === eventConfig?.current_phase)
    .sort((a: any, b: any) => a.order_index - b.order_index)

  const submittedQuestIds = submissions?.map(s => s.quest_id) || []

  // Selecionar a "quest atual" com a mesma regra do SubmissionWrapper:
  // - primeira não-submetida cuja janela total (prazo + atraso) ainda não expirou
  // - se planned_deadline_minutes for nulo, tratar como ativa (não expira)
  // - se nenhuma se qualificar, cair no fallback: primeira não-submetida (expirada)
  const getDate = (iso?: string | null) => {
    if (!iso) return null
    const str = iso.endsWith('Z') ? iso : iso.replace('+00:00', 'Z')
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
  }

  const nowMs = Date.now()
  const epsilon = 500
  let currentIndex = -1
  for (let i = 0; i < sortedQuests.length; i++) {
    const q = sortedQuests[i]
    if (submittedQuestIds.includes(q.id)) continue
    const start = getDate(q.started_at)
    if (!start) { currentIndex = i; break }
    const planned = typeof q.planned_deadline_minutes === 'number' ? q.planned_deadline_minutes : null
    const late = typeof q.late_submission_window_minutes === 'number' ? q.late_submission_window_minutes : 0
    if (planned === null) { currentIndex = i; break }
    const regularEndMs = start.getTime() + planned * 60_000
    const finalEndMs = regularEndMs + late * 60_000
    if (nowMs <= finalEndMs + epsilon) { currentIndex = i; break }
  }

  if (currentIndex === -1) {
    for (let i = 0; i < sortedQuests.length; i++) {
      const q = sortedQuests[i]
      if (!submittedQuestIds.includes(q.id)) { currentIndex = i; break }
    }
  }

  const currentQuest = currentIndex >= 0 ? sortedQuests[currentIndex] : undefined

  // REMOVIDO: autoAdvancedNotice causava confusão quando quests eram auto-iniciadas
  // A mensagem não agregava valor e confundia equipes após submissões
  const autoAdvancedNotice: { fromName: string, toName: string } | null = null

  // Buscar pontuação total da view live_ranking (inclui submissions, penalidades e ajustes)
  const { data: rankingData } = await supabase
    .from('live_ranking')
    .select('total_points')
    .eq('team_id', team?.id)
    .single()

  const totalPoints = rankingData?.total_points || 0

  // ✅ Criar snapshot dos dados para polling em tempo real
  const dataSnapshot = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      currentPhase: eventConfig?.current_phase,
      eventStarted: eventConfig?.event_started,
      eventEnded: eventConfig?.event_ended,
      submissionsCount: submissions?.length || 0,
      lastSubmissionTime: submissions?.[0]?.created_at
    }))
    .digest('hex')

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0A0F1E] via-[#0A1E47] to-[#0A0F1E]">
      {/* ✅ REMOVED: TeamPageRealtime was causing router.refresh() affecting all tabs
          Server-component is already force-dynamic, fetching fresh data on every request */}
      <Header
        title="🎮 Dashboard da Equipe"
        subtitle={`${team?.name || 'Equipe'} - ${team?.course || 'Curso'}`}
        showLogout={true}
        logoUrl={team?.logo_url}
      />

      {/* ✅ Componente cliente para monitorar avaliações e tocar som */}
      <TeamDashboardClient
        teamId={team?.id || ''}
        initialSubmissionsCount={submissions?.length || 0}
        initialEvaluatedCount={submissions?.filter(s => s.status === 'evaluated').length || 0}
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
          {/* REMOVIDO: autoAdvancedNotice - causava confusão após submissões */}
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
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white">Total AMF Coins</h3>
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

          {/* Seções Interativas com Accordion */}
          <Accordion
            items={[
              {
                id: 'coins-history',
                title: 'Histórico de AMF Coins',
                icon: '🪙',
                defaultOpen: false,
                children: (
                  <AMFCoinsHistory 
                    teamId={team?.id || ''} 
                    currentTotalCoins={totalPoints} 
                  />
                ),
              },
              {
                id: 'quest-details',
                title: 'Detalhes da Quest Atual',
                icon: '🎯',
                defaultOpen: true,
                children: (
                  <PhaseDetailsCard
                    currentQuest={currentQuest}
                    currentPhaseNumber={eventConfig?.current_phase || 0}
                  />
                ),
              },
              {
                id: 'my-submissions',
                title: 'Minhas Entregas',
                icon: '📋',
                defaultOpen: false,
                children: (
                  <div>
                    {submissions && submissions.length > 0 ? (
                      <div className="space-y-2 md:space-y-3">
                        {submissions.map((submission, index) => (
                          <div key={index} className="flex justify-between items-center p-3 md:p-4 bg-[#0A1E47]/40 border-l-4 border-[#00E5FF]/50 rounded-lg hover:bg-[#0A1E47]/60 transition-colors">
                            <div>
                              <p className="text-sm md:text-base font-medium text-white">Quest {index + 1}</p>
                              <p className="text-xs md:text-sm text-[#00E5FF]/70">
                                Status: {submission.status === 'pending' ? '⏳ Pendente' : '✅ Avaliada'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-base md:text-lg font-bold text-[#00E5FF]">
                                🪙 {submission.final_points || 0} AMF Coins
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#00E5FF]/70 text-sm md:text-base">
                        Nenhuma entrega ainda. Clique no botão abaixo para submeter!
                      </p>
                    )}
                  </div>
                ),
              },
              {
                id: 'evaluators',
                title: 'Avaliadores Disponíveis',
                icon: '👥',
                defaultOpen: false,
                children: <EvaluatorStatusList />,
              },
              {
                id: 'power-ups',
                title: 'Power-ups do Evento',
                icon: '⚡',
                defaultOpen: false,
                children: (
                  <div className="space-y-3 md:space-y-4">
                    <PowerUpActivator />
                    <MentorRequestButton 
                      currentPhase={eventConfig?.current_phase || 0}
                      teamCoins={totalPoints}
                    />
                    <PowerUpsGuide />
                  </div>
                ),
              },
              {
                id: 'penalties',
                title: 'Sistema de Penalidades',
                icon: '⚠️',
                defaultOpen: false,
                children: <PenaltiesGuide />,
              },
              {
                id: 'final-eval',
                title: 'Avaliação Final',
                icon: '🏆',
                defaultOpen: false,
                children: <FinalEvaluationGuide />,
              },
              {
                id: 'actions',
                title: 'Ações Rápidas',
                icon: '🚀',
                defaultOpen: false,
                children: (
                  <div className="space-y-2">
                    <Link href="/submit" className="block">
                      <Button className="w-full text-xs sm:text-sm md:text-base" size="sm">
                        📝 Submeter Entregas
                      </Button>
                    </Link>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
