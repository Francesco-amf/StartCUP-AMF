'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import SubmissionForm from '@/components/forms/SubmissionForm'
import BossQuestCard from '@/components/quest/BossQuestCard'
import SubmissionDeadlineStatus from '@/components/quest/SubmissionDeadlineStatus'
import QuestExpirationNotifier from '@/components/quest/QuestExpirationNotifier'
import AutoAdvanceCountdown from '@/components/quest/AutoAdvanceCountdown'
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

  // Auto-refresh a cada 30 segundos para detectar mudanças de fase/quest
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 30000) // 30 segundos
    
    return () => clearInterval(interval)
  }, [router])

  const submittedQuestIds = submissions?.map(s => s.quest_id) || []
  const evaluatedQuestIds = submissions?.filter(s => s.status === 'evaluated').map(s => s.quest_id) || []

  const hasNotice = (n: any): n is { fromName: string; toName: string } => {
    return !!n && typeof n.fromName === 'string' && typeof n.toName === 'string'
  }

  // As quests recebidas já vêm filtradas pela fase atual na página.
  // Apenas garanta a ordem por order_index aqui.
  const sortedQuests = [...quests].sort((a, b) => a.order_index - b.order_index)
  // Debug: visão geral das quests recebidas
  try {
    console.log('🔎 [SubmissionWrapper] Quests recebidas (fase atual):', sortedQuests.map(q => ({
      id: q.id, name: q.name, order: q.order_index, started_at: q.started_at,
      planned: q.planned_deadline_minutes, late: q.late_submission_window_minutes
    })))
  } catch {}

  // Usar "agora" em UTC (como no SubmissionDeadlineStatus) para evitar desvios de fuso
  const nowUtc = new Date(new Date().toISOString())

  // Encontrar a "quest corrente" única que deve ser exibida
  const getDate = (iso?: string | null) => {
    if (!iso) return null
    const str = iso.endsWith('Z') ? iso : iso.replace('+00:00', 'Z')
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
  }

  // Nova seleção determinística: 1) pegue a primeira não-submetida NÃO expirada; 2) senão nenhuma (todas expiraram)
  const notSubmittedIndexes: number[] = []
  for (let i = 0; i < sortedQuests.length; i++) {
    if (!submittedQuestIds.includes(sortedQuests[i].id)) notSubmittedIndexes.push(i)
  }

  const isFullyExpired = (q: Quest) => {
    const start = getDate(q.started_at)
    const planned = typeof q.planned_deadline_minutes === 'number' ? q.planned_deadline_minutes : null
    const late = typeof q.late_submission_window_minutes === 'number' ? q.late_submission_window_minutes : 0
    if (!start) return false // ainda não começou => não expira
    if (planned === null) return false // sem prazo => não expira
    const endMs = start.getTime() + planned * 60_000 + late * 60_000
    const epsilon = 500
    return Date.now() > endMs + epsilon
  }

  // ✅ NOVA FUNÇÃO: Verificar se o prazo REGULAR (sem janela de atraso) expirou
  const isRegularDeadlineExpired = (q: Quest) => {
    const start = getDate(q.started_at)
    const planned = typeof q.planned_deadline_minutes === 'number' ? q.planned_deadline_minutes : null
    if (!start) return false // ainda não começou
    if (planned === null) return false // sem prazo
    const regularEndMs = start.getTime() + planned * 60_000
    const epsilon = 500
    return Date.now() > regularEndMs + epsilon
  }

  let currentIndex = -1
  for (const idx of notSubmittedIndexes) {
    const q = sortedQuests[idx]
    if (!isFullyExpired(q)) { 
      // Verificar TODAS as quests anteriores em SEQUÊNCIA
      // Não pode pular nenhuma quest (deve ser sequencial)
      let canShowThisQuest = true
      for (let checkIdx = 0; checkIdx < idx; checkIdx++) {
        const prevQuest = sortedQuests[checkIdx]
        if (!prevQuest) continue
        
        const prevWasSubmitted = submittedQuestIds.includes(prevQuest.id)
        const prevHasExpired = isFullyExpired(prevQuest)
        
        // Se a quest anterior foi submetida mas ainda está no prazo, aguardar
        if (prevWasSubmitted && !isRegularDeadlineExpired(prevQuest)) {
          canShowThisQuest = false
          break
        }
        
        // Se a quest anterior NÃO foi submetida E NÃO expirou, não pode mostrar esta
        if (!prevWasSubmitted && !prevHasExpired) {
          canShowThisQuest = false
          break
        }
      }
      
      if (!canShowThisQuest) {
        continue
      }
      
      currentIndex = idx
      break
    }
  }
  
  // Se TODAS as quests não-submetidas expiraram, mostrar mensagem de finalização
  const allExpired = notSubmittedIndexes.length > 0 && 
    notSubmittedIndexes.every(idx => isFullyExpired(sortedQuests[idx]))

  try {
    console.log('🔎 [SubmissionWrapper] Não-submetidas:', notSubmittedIndexes.map(i => ({ idx: i, name: sortedQuests[i]?.name })))
    if (currentIndex >= 0) {
      console.log('✅ [SubmissionWrapper] Quest atual selecionada:', { idx: currentIndex, name: sortedQuests[currentIndex]?.name })
    } else {
      console.log('⚠️ [SubmissionWrapper] Nenhuma quest selecionada (lista vazia?)')
    }
  } catch {}

  // Calcular propriedades de exibição apenas da lista (marcando apenas a atual como shouldShow)
  let autoAdvancedFromExpired: { fromName: string, toName: string } | null = null
  const availableQuests = sortedQuests.map((quest, index) => {
    const alreadySubmitted = submittedQuestIds.includes(quest.id);
    const isEvaluated = evaluatedQuestIds.includes(quest.id);
    
    // Detectar se é BOSS (quest de apresentação)
    const isBossByType = Array.isArray(quest.deliverable_type) 
      ? quest.deliverable_type.includes('presentation')
      : quest.deliverable_type === 'presentation';
    const isBossByOrder = quest.order_index === 4;
    const isBoss = isBossByType || isBossByOrder;
    
    // Calcular deadlines se quest está ativa
  let regularDeadlinePassed = false;
  let lateWindowExpired = false;
  let isInLateWindow = false
    
    if (quest.started_at) {
      const startedAtString = quest.started_at.endsWith('Z')
        ? quest.started_at
        : quest.started_at.replace('+00:00', 'Z')
      const startTime = new Date(startedAtString)
      const planned = typeof quest.planned_deadline_minutes === 'number' ? quest.planned_deadline_minutes : null
      const late = typeof quest.late_submission_window_minutes === 'number' ? quest.late_submission_window_minutes : null

      if (planned !== null) {
        const regularDeadline = new Date(startTime.getTime() + planned * 60 * 1000)
        const finalDeadline = new Date(regularDeadline.getTime() + (late !== null ? late * 60 * 1000 : 0))
        regularDeadlinePassed = nowUtc > regularDeadline
        lateWindowExpired = nowUtc > finalDeadline
        isInLateWindow = regularDeadlinePassed && !lateWindowExpired && late !== null
      } else {
        // Sem prazo configurado: nunca marcar como expirado/atrasado
        regularDeadlinePassed = false
        lateWindowExpired = false
        isInLateWindow = false
      }
    }

    // Mostrar SOMENTE a quest corrente; nenhuma "prévia" das próximas
    let shouldShow = false
    let isNextAvailable = false
    let previewOnly = false
    let isExpired = false

    if (!alreadySubmitted && index === currentIndex) {
      if (lateWindowExpired) {
        // Mostra a atual com aviso de prazo expirado, mas sem formulário
        shouldShow = true
        isExpired = true
      } else if (isInLateWindow) {
        shouldShow = true
      } else {
        shouldShow = true
      }
    }

    // Aviso: se a quest anterior não foi submetida e expirou totalmente, informamos que avançou
    if (index === currentIndex && notSubmittedIndexes.length > 0) {
      // Avisar se havia uma anterior não-submetida expirada
      const currentPos = notSubmittedIndexes.indexOf(index)
      if (currentPos > 0) {
        const prevIdx = notSubmittedIndexes[currentPos - 1]
        const prev = sortedQuests[prevIdx]
        if (isFullyExpired(prev)) {
          autoAdvancedFromExpired = { fromName: prev.name, toName: quest.name }
        }
      }
    }

    return {
      ...quest,
      shouldShow,
      isInLateWindow,
      isNextAvailable,
      previewOnly,
      isExpired,
      isCompleted: isEvaluated,
      alreadySubmitted,
      isBoss,
    };
  })

  const advFrom = (autoAdvancedFromExpired as any)?.fromName ?? ''
  const advTo = (autoAdvancedFromExpired as any)?.toName ?? ''
  
  // Quest atual para notificação de expiração
  const currentQuest = currentIndex >= 0 ? sortedQuests[currentIndex] : undefined

  // ✅ NOVO: Verificar se há quest submetida aguardando prazo expirar
  let waitingForDeadline: { questName: string; minutesRemaining: number } | null = null
  if (currentIndex === -1 && notSubmittedIndexes.length > 0) {
    // Tem quests não-submetidas, mas currentIndex = -1 (nenhuma selecionada)
    // Verificar se é porque estamos aguardando prazo de quest submetida
    const firstNotSubmitted = sortedQuests[notSubmittedIndexes[0]]
    if (firstNotSubmitted && notSubmittedIndexes[0] > 0) {
      const prevQuest = sortedQuests[notSubmittedIndexes[0] - 1]
      if (submittedQuestIds.includes(prevQuest.id) && !isRegularDeadlineExpired(prevQuest)) {
        const start = getDate(prevQuest.started_at)
        const planned = typeof prevQuest.planned_deadline_minutes === 'number' ? prevQuest.planned_deadline_minutes : null
        if (start && planned !== null) {
          const regularEndMs = start.getTime() + planned * 60_000
          const remaining = Math.max(0, Math.ceil((regularEndMs - Date.now()) / 60_000))
          waitingForDeadline = {
            questName: prevQuest.name,
            minutesRemaining: remaining
          }
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <QuestExpirationNotifier currentQuest={currentQuest} />
      
      {autoAdvancedFromExpired && (
        <div className="bg-[#0A3A5A]/60 border border-[#FF6B6B]/60 text-[#FFB3B3] px-4 py-3 rounded-lg">
          🚦 Prazo finalizado em "{advFrom}". Agora você está na próxima quest: <span className="font-bold text-white">{advTo}</span>.
        </div>
      )}
      
      {waitingForDeadline && (
        <div className="bg-gradient-to-br from-[#0A3A5A]/90 to-[#001A4D]/90 border-2 border-[#00E5FF]/60 text-[#00E5FF] px-6 py-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⏳</span>
            <h3 className="text-xl font-bold">Quest Submetida com Sucesso!</h3>
          </div>
          <p className="text-[#00E5FF]/90 mb-2">
            Você completou <span className="font-bold text-white">"{waitingForDeadline.questName}"</span> dentro do prazo. Parabéns!
          </p>
          <p className="text-[#00E5FF]/80 text-sm">
            🕐 A próxima quest será liberada em aproximadamente <span className="font-bold text-[#FFD700]">{waitingForDeadline.minutesRemaining} minuto(s)</span>, quando o prazo atual expirar.
          </p>
          <p className="text-[#00E5FF]/60 text-xs mt-2">
            💡 Use esse tempo para se preparar para o próximo desafio!
          </p>
        </div>
      )}
      
      {allExpired && (
        <div className="space-y-4">
          <div className="bg-[#0A3A5A]/80 border-2 border-[#FFD700]/60 text-[#FFD700] px-6 py-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🏁</span>
              <h3 className="text-xl font-bold">Todas as quests desta fase foram finalizadas</h3>
            </div>
            <p className="text-[#FFD700]/80">
              Os prazos para submissão expiraram. Aguarde a próxima fase do evento ou entre em contato com a organização.
            </p>
          </div>
          <AutoAdvanceCountdown />
        </div>
      )}
      
      <h2 className="text-2xl font-bold text-[#00E5FF]">📋 Quests Disponíveis</h2>

      {!allExpired && availableQuests
        .filter(q => q.shouldShow)
        .map((quest) => {
          const submission = submissions?.find(s => s.quest_id === quest.id)

          return (
            <div key={quest.id}>
              {/* BOSS QUEST - Apresentação Presencial (Fases 1-4) */}
              {quest.isBoss ? (
                <BossQuestCard
                  questName={quest.name}
                  description={quest.description}
                  maxPoints={quest.max_points}
                  startedAt={quest.started_at}
                  deadlineMinutes={quest.planned_deadline_minutes || 10}
                  isActive={quest.status === 'active'}
                />
              ) : quest.isExpired ? (
                // Prazo totalmente expirado: mostrar banner e detalhes, sem formulário
                <div className="p-6 bg-gradient-to-br from-[#0A1E47]/80 to-[#001A4D]/80 border border-red-500/40">
                  <SubmissionDeadlineStatus questId={quest.id} teamId={team.id} />
                  <h3 className="text-xl font-bold mb-2 text-[#00E5FF]">{quest.name}</h3>
                  <p className="text-[#00E5FF]/70 mb-2">{quest.description}</p>
                  <p className="text-sm text-[#00E5FF]/60">AMF Coins máximos: <span className="font-bold text-[#00FF88]">{quest.max_points} coins</span></p>
                </div>
              ) : quest.previewOnly ? (
                /* Sempre bloqueado para submissão, apenas preview */
                <div className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FFD700]/50 relative">
                  <div className="absolute top-2 right-2 bg-[#FFD700] text-[#0A1E47] px-3 py-1 rounded-full text-xs font-bold">
                    🔜 PRÓXIMA
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-[#FFD700]">{quest.name}</h3>
                  <p className="text-[#FFD700]/70 mb-4">{quest.description}</p>
                  <p className="text-sm text-[#FFD700]/90">
                    💎 AMF Coins máximos: <span className="font-bold">{quest.max_points} coins</span>
                  </p>
                  <div className="mt-4 bg-[#0A3A5A]/40 border border-[#00E5FF]/50 text-[#00E5FF] px-4 py-3 rounded-lg">
                    ⏳ Esta quest abrirá após a conclusão/fechamento da anterior.
                  </div>
                </div>
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
                      ✅ Avaliada! AMF Coins: {submission.final_points} coins
                    </div>
                  )}
                </div>
              ) : quest.isInLateWindow ? (
                /* Quest em janela de atraso (ainda pode submeter com penalidade) */
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-[#5A0A0A]/80 to-[#3A0A0A]/80 border-2 border-[#FF6B6B] px-4 py-3 rounded-lg">
                    <p className="text-[#FF6B6B] font-bold text-lg">
                      ⚠️ ATENÇÃO: Você está na janela de atraso!
                    </p>
                    <p className="text-[#FF6B6B]/80 text-sm mt-1">
                      Submissões feitas agora receberão penalidade de AMF Coins.
                    </p>
                  </div>
                  {quest.deliverable_type?.map((type, index) => (
                    <div key={type}>
                      <SubmissionForm
                        questId={quest.id}
                        teamId={team.id}
                        deliverableType={type as 'file' | 'text' | 'url'}
                        questName={quest.name}
                        maxPoints={quest.max_points}
                        onSuccess={handleSuccess}
                      />
                      {/* Separador entre formulários - só se não for o último */}
                      {index < quest.deliverable_type.length - 1 && (
                        <div className="my-6 flex items-center justify-center">
                          <div className="flex-1 border-t border-[#00E5FF]/20"></div>
                          <span className="px-4 text-sm font-bold text-[#00E5FF]/60">OU</span>
                          <div className="flex-1 border-t border-[#00E5FF]/20"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Quest normal (dentro do prazo) */
                <div className="space-y-4">
                  {quest.deliverable_type?.map((type, index) => (
                    <div key={type}>
                      <SubmissionForm
                        questId={quest.id}
                        teamId={team.id}
                        deliverableType={type as 'file' | 'text' | 'url'}
                        questName={quest.name}
                        maxPoints={quest.max_points}
                        onSuccess={handleSuccess}
                      />
                      {/* Separador entre formulários - só se não for o último */}
                      {index < quest.deliverable_type.length - 1 && (
                        <div className="my-6 flex items-center justify-center">
                          <div className="flex-1 border-t border-[#00E5FF]/20"></div>
                          <span className="px-4 text-sm font-bold text-[#00E5FF]/60">OU</span>
                          <div className="flex-1 border-t border-[#00E5FF]/20"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}