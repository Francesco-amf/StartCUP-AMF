'use client'

import { useRouter } from 'next/navigation'
import SubmissionForm from '@/components/forms/SubmissionForm'
import BossQuestCard from '@/components/quest/BossQuestCard'
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

  const now = new Date();

  // NOVA LÓGICA: Calcular quais quests devem aparecer
  const availableQuests = sortedQuests.map((quest, index) => {
    const alreadySubmitted = submittedQuestIds.includes(quest.id);
    const isEvaluated = evaluatedQuestIds.includes(quest.id);
    
    // Detectar se é BOSS (quest de apresentação)
    const isBoss = Array.isArray(quest.deliverable_type) 
      ? quest.deliverable_type.includes('presentation')
      : quest.deliverable_type === 'presentation';
    
    // Calcular deadlines se quest está ativa
    let regularDeadlinePassed = false;
    let lateWindowExpired = false;
    
    if (quest.status === 'active' && quest.started_at) {
      const startTime = new Date(quest.started_at + 'Z');
      const regularDeadline = new Date(startTime.getTime() + (quest.planned_deadline_minutes || 0) * 60 * 1000);
      const finalDeadline = new Date(startTime.getTime() + 
        ((quest.planned_deadline_minutes || 0) + (quest.late_submission_window_minutes || 0)) * 60 * 1000
      );
      
      regularDeadlinePassed = now > regularDeadline;
      lateWindowExpired = now > finalDeadline;
    }

    // Determinar visibilidade:
    // 1. Quest já submetida → NÃO mostrar (some da lista)
    // 2. Quest ativa, prazo regular passou, equipe NÃO submeteu, janela ainda aberta → MOSTRAR (modo atraso)
    // 3. Quest ativa, janela expirou → NÃO mostrar (bloqueada)
    // 4. Próxima quest depois de uma ativa com prazo regular passado → MOSTRAR (próxima disponível)
    
    let shouldShow = false;
    let isInLateWindow = false;
    let isNextAvailable = false;

    if (alreadySubmitted) {
      // Já submeteu → não mostra mais
      shouldShow = false;
    } else if (quest.status === 'active') {
      if (lateWindowExpired) {
        // Janela expirou → não mostra mais (bloqueada)
        shouldShow = false;
      } else if (regularDeadlinePassed) {
        // Prazo regular passou mas janela ainda aberta → mostra em modo atraso
        shouldShow = true;
        isInLateWindow = true;
      } else {
        // Dentro do prazo regular → mostra normalmente
        shouldShow = true;
      }
    } else if (quest.status === 'pending') {
      // Quest ainda não ativa
      // Verifica se é a próxima depois de uma quest ativa com prazo regular passado
      const previousQuest = sortedQuests[index - 1];
      if (previousQuest && previousQuest.status === 'active' && previousQuest.started_at) {
        const prevStartTime = new Date(previousQuest.started_at + 'Z');
        const prevRegularDeadline = new Date(prevStartTime.getTime() + (previousQuest.planned_deadline_minutes || 0) * 60 * 1000);
        
        if (now > prevRegularDeadline) {
          // Prazo regular da anterior passou → mostra próxima (bloqueada para submissão até anterior fechar)
          shouldShow = true;
          isNextAvailable = true;
        }
      }
    }

    return {
      ...quest,
      shouldShow,
      isInLateWindow,
      isNextAvailable,
      isCompleted: isEvaluated,
      alreadySubmitted,
      isBoss, // Nova propriedade
    };
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#00E5FF]">📋 Quests Disponíveis</h2>

      {availableQuests
        .filter(q => q.shouldShow)
        .map((quest) => {
          const submission = submissions?.find(s => s.quest_id === quest.id)

          return (
            <div key={quest.id}>
              {/* BOSS QUEST - Apresentação Presencial */}
              {quest.isBoss ? (
                <BossQuestCard
                  questName={quest.name}
                  description={quest.description}
                  maxPoints={quest.max_points}
                  startedAt={quest.started_at}
                  deadlineMinutes={quest.planned_deadline_minutes || 10}
                  isActive={quest.status === 'active'}
                />
              ) : quest.alreadySubmitted ? (
                <div className="p-6 bg-gradient-to-br from-[#0A1E47]/80 to-[#001A4D]/80 border border-[#00E5FF]/40">
                  <h3 className="text-xl font-bold mb-2 text-[#00E5FF]">{quest.name}</h3>
                  <p className="text-[#00E5FF]/70 mb-4">{quest.description}</p>

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
              ) : quest.isNextAvailable ? (
                /* Próxima quest (visível mas bloqueada até quest anterior fechar) */
                <div className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FFD700]/50 relative">
                  <div className="absolute top-2 right-2 bg-[#FFD700] text-[#0A1E47] px-3 py-1 rounded-full text-xs font-bold">
                    🔜 PRÓXIMA
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-[#FFD700]">{quest.name}</h3>
                  <p className="text-[#FFD700]/70 mb-4">{quest.description}</p>
                  <p className="text-sm text-[#FFD700]/90">
                    💎 Pontuação máxima: <span className="font-bold">{quest.max_points} pontos</span>
                  </p>
                  <div className="mt-4 bg-[#0A3A5A]/40 border border-[#00E5FF]/50 text-[#00E5FF] px-4 py-3 rounded-lg">
                    ⏳ Esta quest será liberada automaticamente quando a quest anterior for finalizada.
                  </div>
                </div>
              ) : quest.isInLateWindow ? (
                /* Quest em janela de atraso (ainda pode submeter com penalidade) */
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-[#5A0A0A]/80 to-[#3A0A0A]/80 border-2 border-[#FF6B6B] px-4 py-3 rounded-lg">
                    <p className="text-[#FF6B6B] font-bold text-lg">
                      ⚠️ ATENÇÃO: Você está na janela de atraso!
                    </p>
                    <p className="text-[#FF6B6B]/80 text-sm mt-1">
                      Submissões feitas agora receberão penalidade de pontos.
                    </p>
                  </div>
                  {quest.deliverable_type?.map(type => (
                    <SubmissionForm
                      key={type}
                      questId={quest.id}
                      teamId={team.id}
                      deliverableType={type as 'file' | 'text' | 'url'}
                      questName={quest.name}
                      maxPoints={quest.max_points}
                      onSuccess={handleSuccess}
                    />
                  ))}
                </div>
              ) : (
                /* Quest normal (dentro do prazo) */
                <div className="space-y-4">
                  {quest.deliverable_type?.map(type => (
                    <SubmissionForm
                      key={type}
                      questId={quest.id}
                      teamId={team.id}
                      deliverableType={type as 'file' | 'text' | 'url'}
                      questName={quest.name}
                      maxPoints={quest.max_points}
                      onSuccess={handleSuccess}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}