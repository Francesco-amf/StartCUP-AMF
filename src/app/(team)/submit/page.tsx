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
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-2">Equipe não encontrada</h2>
          <p className="text-gray-600">
            Não encontramos uma equipe cadastrada com o email: <strong>{user.email}</strong>
          </p>
          <p className="text-gray-600 mt-2">
            Entre em contato com a organização para cadastrar sua equipe.
          </p>
          {teamError && (
            <p className="text-red-600 mt-2 text-sm">
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
    .select('*, phases(*)')
    .single()

  // Buscar quests da fase atual
  const currentPhaseId = eventConfig?.current_phase_id
  
  let quests: any[] = []
  if (currentPhaseId) {
    const { data: questsData } = await supabase
      .from('quests')
      .select('*')
      .eq('phase_id', currentPhaseId)
      .order('order_index')
    
    if (questsData) quests = questsData
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="📝 Submeter Entregas"
        subtitle={`${team.name} - ${team.course}`}
        backHref="/dashboard"
        showLogout={true}
      />

      <div className="container mx-auto p-6">
        
        {/* Fase Atual */}
        {eventConfig?.current_phase_id ? (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {eventConfig.phases?.name}
            </h2>
            <p className="text-gray-600">
              Duração: {eventConfig.phases?.duration_minutes} minutos | 
              Pontuação máxima da fase: {eventConfig.phases?.max_points} pontos
            </p>
          </Card>
        ) : (
          <Card className="p-6 mb-6">
            <p className="text-gray-600">
              O evento ainda não começou. Aguarde o início da primeira fase!
            </p>
          </Card>
        )}

        {/* Quests */}
        {quests.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Quests Disponíveis</h2>
            
            {quests.map((quest) => {
              const alreadySubmitted = submittedQuestIds.includes(quest.id)
              const submission = submissions?.find(s => s.quest_id === quest.id)

              return (
                <div key={quest.id}>
                  {alreadySubmitted ? (
                    <Card className="p-6 bg-gray-50">
                      <h3 className="text-xl font-bold mb-2">{quest.name}</h3>
                      <p className="text-gray-600 mb-4">{quest.description}</p>
                      
                      {submission?.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                          ⏳ Entrega em análise. Aguarde a avaliação.
                        </div>
                      )}
                      
                      {submission?.status === 'evaluated' && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                          ✅ Avaliada! Pontuação: {submission.final_points} pontos
                        </div>
                      )}
                    </Card>
                  ) : (
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
        ) : (
          <Card className="p-6">
            <p className="text-gray-600">
              Nenhuma quest disponível no momento.
            </p>
          </Card>
        )}

      </div>
    </div>
  )
}