import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import SubmissionForm from '@/components/forms/SubmissionForm'
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
  // NÃO usar mais current_phase - agora controlado manualmente pelo admin
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
    .eq('status', 'active')
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

  // No novo sistema, apenas quests com status='active' são visíveis
  // Não precisamos de lógica de timing - o admin controla manualmente qual quest está ativa
  const availableQuests = quests.map(quest => ({
    ...quest,
    isAvailable: !submittedQuestIds.includes(quest.id), // Disponível se não foi submetida ainda
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
              {quests.length > 0
                ? `Há ${quests.length} quest(s) disponível(is) para submissão`
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
        {eventConfig?.event_started && availableQuests.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#00E5FF]">📋 Quests Disponíveis</h2>

            {availableQuests.map((quest) => {
              const alreadySubmitted = submittedQuestIds.includes(quest.id)
              const submission = submissions?.find(s => s.quest_id === quest.id)

              return (
                <div key={quest.id}>
                  {alreadySubmitted ? (
                    // Quest já foi submetida - mostrar status
                    <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/80 to-[#001A4D]/80 border border-[#00E5FF]/40">
                      <h3 className="text-xl font-bold mb-2 text-[#00E5FF]">{quest.name}</h3>
                      <p className="text-[#00E5FF]/70 mb-4">{quest.description}</p>
                      <div className="text-xs text-[#00E5FF]/60 mb-3">
                        📍 {quest.phase?.name}
                      </div>

                      {submission?.status === 'pending' && (
                        <div className="bg-[#0A3A5A]/40 border border-[#FF9800]/50 text-[#FF9800] px-4 py-3 rounded-lg">
                          ⏳ Entrega em análise. Aguarde a avaliação.
                        </div>
                      )}

                      {submission?.status === 'evaluated' && (
                        <div className="bg-[#0A3A5A]/40 border border-[#00FF88]/50 text-[#00FF88] px-4 py-3 rounded-lg">
                          ✅ Avaliada! Pontuação: {submission.final_points} pontos
                        </div>
                      )}
                    </Card>
                  ) : (
                    // Quest disponível para submissão
                    <SubmissionForm
                      questId={quest.id}
                      teamId={team.id}
                      deliverableType={quest.deliverable_type}
                      questName={quest.name}
                      maxPoints={quest.max_points}
                    />
                  )}
                </div>
              )
            })}
          </div>
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