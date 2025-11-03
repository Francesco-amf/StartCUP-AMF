import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import SubmissionWrapper from '@/components/forms/SubmissionWrapper'
import Header from '@/components/Header'

export default async function SubmitPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar informações da equipe
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!team) {
    return (
      <div className="min-h-screen gradient-startcup p-6">
        <Card className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-[#0A1E47]/80 to-[#001A4D]/80 border border-red-500/50">
          <h2 className="text-xl font-bold mb-2 text-red-400">Equipe não encontrada</h2>
          <p className="text-[#00E5FF]/70">
            Não encontramos uma equipe cadastrada com o email: <strong>{user.email}</strong>
          </p>
          <p className="text-[#00E5FF]/70 mt-2">
            Entre em contato com a organização para cadastrar sua equipe.
          </p>
          {teamError && (
            <p className="text-red-400 mt-2 text-sm">
              Erro técnico: {teamError.message}
            </p>
          )}
        </Card>
      </div>
    )
  }

  // Buscar configuração do evento
  const { data: eventConfig } = await supabase
    .from('event_config')
    .select('*')
    .single()

  // Buscar APENAS quests ativas (novo sistema baseado em quests)
  let quests: any[] = []

  const { data: activeQuestsData } = await supabase
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

  if (activeQuestsData) quests = activeQuestsData

  // Buscar submissions já feitas pela equipe
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('quest_id, status, final_points')
    .eq('team_id', team.id)

  console.log('📦 Team submissions:', {
    teamId: team.id,
    submissions,
    submissionsError
  })

  const submittedQuestIds = submissions?.map(s => s.quest_id) || []
  const evaluatedQuestIds = submissions?.filter(s => s.status === 'evaluated').map(s => s.quest_id) || []

  // Filtrar quests pela fase atual
  const questsInCurrentPhase = quests.filter(q => q.phase_id === eventConfig?.current_phase);

  const sortedQuests = questsInCurrentPhase.sort((a, b) => a.order_index - b.order_index);

  // Encontra a primeira quest não entregue (essa é a única que deve aparecer)
  let firstIncompleteIndex = -1
  for (let i = 0; i < sortedQuests.length; i++) {
    if (!submittedQuestIds.includes(sortedQuests[i].id)) {
      firstIncompleteIndex = i
      break
    }
  }

  // Quests disponíveis: APENAS a primeira não entregue (sem histórico)
  // Se não há quest incompleta, nenhuma quest aparece (todas foram entregues)
  const availableQuests = sortedQuests.map((quest, index) => ({
    ...quest,
    isAvailable: index === firstIncompleteIndex, // Disponível: APENAS a primeira pendente
    isBlocked: index > firstIncompleteIndex, // Bloqueada: depois da primeira pendente
    isCompleted: evaluatedQuestIds.includes(quest.id), // Já foi entregue e avaliada
  }))

  return (
    <div className="min-h-screen gradient-startcup">
      <Header
        title="📝 Submeter Entregas"
        subtitle={`${team.name} - ${team.course}`}
        backHref="/dashboard"
        showLogout={true}
      />

      <div className="container mx-auto p-6">

        {/* Status do Evento */}
        {eventConfig?.event_started ? (
          <Card className="p-6 mb-6 bg-gradient-to-br from-[#0A3A5A]/80 to-[#001A4D]/80 border border-[#00D4FF]/40">
            <h2 className="text-2xl font-bold mb-2 text-[#00D4FF]">
              🟢 Evento em Andamento
            </h2>
            <p className="text-[#00E5FF]/70">
              {availableQuests.filter(q => q.isAvailable).length > 0
                ? `Há ${availableQuests.filter(q => q.isAvailable).length} quest(s) disponível(is) para submissão`
                : 'Nenhuma quest ativa no momento. Aguarde...'}
            </p>
          </Card>
        ) : (
          <Card className="p-6 mb-6 bg-gradient-to-br from-[#0A1E47]/80 to-[#001A4D]/80 border border-[#FF9800]/40">
            <p className="text-[#FF9800]">
              ⏸️ O evento ainda não começou. Aguarde o início!
            </p>
          </Card>
        )}

        {/* Quests Ativas */}
        {eventConfig?.event_started && sortedQuests.length > 0 ? (
          <SubmissionWrapper quests={quests} team={team} submissions={submissions || []} eventConfig={eventConfig} />
        ) : eventConfig?.event_started ? (
          <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/80 to-[#001A4D]/80 border border-[#00E5FF]/40">
            <p className="text-[#00E5FF]">
              Nenhuma quest ativa no momento. O admin iniciará as quests em breve...
            </p>
          </Card>
        ) : null}

      </div>
    </div>
  )
}
