'use client'

import { useRouter } from 'next/navigation'
import SubmissionForm from '@/components/forms/SubmissionForm'
import { type Quest, type Team, type Submission, type EventConfig } from '@/lib/types'

interface SubmissionWrapperProps {
  quests: Quest[]
  team: Team
  submissions: Submission[]
  eventConfig: EventConfig
}

export default function SubmissionWrapper({ quests, team, submissions, eventConfig }: SubmissionWrapperProps) {
  const router = useRouter()

  const handleSuccess = () => {
    router.refresh()
  }

  const submittedQuestIds = submissions?.map(s => s.quest_id) || []
  const evaluatedQuestIds = submissions?.filter(s => s.status === 'evaluated').map(s => s.quest_id) || []

  // Filtrar quests pela fase atual
  const questsInCurrentPhase = quests.filter(q => q.phase_id === eventConfig?.current_phase);

  // Ordena quests por order_index para garantir a sequencia correta
  const sortedQuests = questsInCurrentPhase.sort((a, b) => a.order_index - b.order_index);

  // Encontra a primeira quest não entregue (essa é a única que deve aparecer)
  let firstIncompleteIndex = -1
  for (let i = 0; i < sortedQuests.length; i++) {
    if (!submittedQuestIds.includes(sortedQuests[i].id)) {
      firstIncompleteIndex = i
      break
    }
  }

  const availableQuests = sortedQuests.map((quest, index) => ({
    ...quest,
    isAvailable: index === firstIncompleteIndex,
    isBlocked: index > firstIncompleteIndex,
    isCompleted: evaluatedQuestIds.includes(quest.id),
  }))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#00E5FF]">📋 Quests Disponíveis</h2>

      {availableQuests
        .filter(q => q.isAvailable)
        .map((quest) => {
          const alreadySubmitted = submittedQuestIds.includes(quest.id)
          const submission = submissions?.find(s => s.quest_id === quest.id)

          return (
            <div key={quest.id}>
              {alreadySubmitted ? (
                <div className="p-6 bg-gradient-to-br from-[#0A1E47]/80 to-[#001A4D]/80 border border-[#00E5FF]/40">
                  <h3 className="text-xl font-bold mb-2 text-[#00E5FF]">{quest.name}</h3>
                  <p className="text-[#00E5FF]/70 mb-4">{quest.description}</p>
                  <div className="text-xs text-[#00E5FF]/60 mb-3">
                    {/* NOTA: quest.phase?.name pode dar erro se 'phase' não foi 
                      incluído no select do Supabase. Se der, remova esta linha. 
                    */}
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
                </div>
              ) : (
                // ****** INÍCIO DA CORREÇÃO ******
                // Iteramos sobre os tipos de entrega.
                // Se for ['file'], renderiza 1 form.
                // Se for ['file', 'url'], renderiza 2 forms.
                // Se for [], não renderiza nada.
                <div className="space-y-4">
                  {quest.deliverable_type.map(type => (
                    <SubmissionForm
                      key={type} // Usamos o tipo como key
                      questId={quest.id}
                      teamId={team.id}
                      // Usamos 'as' para forçar o TypeScript a aceitar:
                      deliverableType={type as 'file' | 'text' | 'url'}
                      questName={quest.name}
                      maxPoints={quest.max_points}
                      onSuccess={handleSuccess}
                    />
                  ))}
                </div>
                // ****** FIM DA CORREÇÃO ******
              )}
            </div>
          )
        })}
    </div>
  )
}