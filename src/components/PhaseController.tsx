'use client'

import { Button } from '@/components/ui/button'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Quest, type EventConfig, type PhaseControllerProps } from '@/lib/types'

export default function PhaseController({ currentPhase, eventStarted }: PhaseControllerProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null)
  const [allQuests, setAllQuests] = useState<Quest[]>([])
  const supabase = createClient()
  const autoAdvancedPhaseRef = useRef<Set<number>>(new Set())
  const lastPhaseStateRef = useRef<string>('')
  const zeroTimeQuestDetectionRef = useRef<{ questId: string; detectedAt: number } | null>(null)
  const advancingQuestRef = useRef<string | null>(null) // Debounce para evitar múltiplos advances simultâneos

  // Usa currentPhase do servidor, que é atualizado a cada clique
  // Reflete sempre o estado real do banco de dados
  const activePhase = eventConfig?.current_phase ?? currentPhase;

  const phases = [
    { id: 0, name: 'Preparação', icon: '⏸️', color: 'bg-[#0A1E47] border-[#00E5FF]' },
    { id: 1, name: 'Fase 1: Descoberta', icon: '🔍', color: 'bg-[#0A3A5A] border-[#00D4FF]', duration: '2h30min', points: 200 },
    { id: 2, name: 'Fase 2: Criação', icon: '💡', color: 'bg-[#1B4A7F] border-[#0077FF]', duration: '3h30min', points: 300 },
    { id: 3, name: 'Fase 3: Estratégia', icon: '📊', color: 'bg-[#1B5A3F] border-[#00FF88]', duration: '2h30min', points: 200 },
    { id: 4, name: 'Fase 4: Refinamento', icon: '✨', color: 'bg-[#5A5A0A] border-[#FFD700]', duration: '2h', points: 150 },
    { id: 5, name: 'Fase 5: Pitch Final', icon: '🎯', color: 'bg-[#5A0A0A] border-[#FF6B6B]', duration: '1h30min', points: 150 },
  ]

  const fetchEventData = useCallback(async () => {
    // Fetch event_config
    const { data: configData, error: configError } = await supabase
      .from('event_config')
      .select('*, phase_1_start_time, phase_2_start_time, phase_3_start_time, phase_4_start_time, phase_5_start_time')
      .single()

    if (configError) {
      console.error("Error fetching event config:", configError);
    } else {
      setEventConfig(configData);
    }

    // Fetch all quests to get their durations
    const { data: questsData, error: questsError } = await supabase
      .from('quests')
      .select('id, phase_id, planned_deadline_minutes, late_submission_window_minutes, order_index, status, name, started_at');
    
    if (questsError) {
      console.error("Error fetching quests:", questsError);
    } else {
      setAllQuests(questsData as Quest[]);
    }
  }, [supabase]);

  const handleStartPhase = useCallback(async (phaseId: number) => {
    if (phaseId === 0 && eventConfig?.event_started) {
      const confirm = window.confirm(
        '⚠️ ATENÇÃO: Isso vai ENCERRAR o evento!\n\n' +
        'Deseja realmente voltar para o modo de Preparação?\n\n' +
        'Esta ação marca o evento como finalizado.'
      )
      if (!confirm) return
    }

    if (phaseId > 0 && !(eventConfig?.event_started)) {
      const confirm = window.confirm(
        `🚀 INICIAR STARTCUP AMF\n\n` +
        `Deseja iniciar o evento na ${phases[phaseId].name}?\n\n` +
        `O cronômetro oficial será iniciado agora!`
      )
      if (!confirm) return
    }

    setIsLoading(true)

    try {
      // Usar novo endpoint que ativa fases E quests automaticamente
      const response = await fetch('/api/admin/start-phase-with-quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: phaseId }),
      })

      // Verificar se sessão expirou (401/403)
      if (response.status === 401 || response.status === 403) {
        alert('⚠️ Sua sessão expirou. Redirecionando para login...')
        router.push('/login')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.details
            ? `${data.error}: ${data.details}`
            : data.error || 'Erro ao atualizar fase'
        )
      }

      // Mostrar mensagem com informações sobre quests ativadas
      const questMessage = data.questsActivated > 0
        ? `\n✨ ${data.questsActivated} quest(s) ativada(s) automaticamente!`
        : ''
      alert(`✅ ${data.message}${questMessage}`)

      // 🎵 NOTA: Som é tocado automaticamente pelo CurrentQuestTimer na live-dashboard
      // quando a primeira quest da fase é ativada. Não tocamos som aqui no admin
      // porque queremos que o som toque na tela do público (live-dashboard), não no painel admin.

      // ✅ FIX: Remover router.refresh() - causa refresh global em TODAS as abas
      // BroadcastChannel + Polling já detectam mudanças
      await fetchEventData(); // Re-fetch data immediately after successful phase change
      // Removed: router.refresh() caused unwanted refresh in other tabs

    } catch (error) {
      alert(`❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsLoading(false)
    }
  }, [eventConfig, fetchEventData, phases, router]);

  useEffect(() => {
    fetchEventData();
    const interval = setInterval(fetchEventData, 500); // 500ms - Sincronizado com CurrentQuestTimer para detecção instantânea de expiração de quests!
    return () => clearInterval(interval);
  }, [fetchEventData]);

  useEffect(() => {
    if (!eventConfig || !eventConfig.event_started || activePhase === 0) {
      return; // Not started, or a preparation phase
    }

    // Nota: Fase 5 agora é suportada para auto-advance (permite game over automático)

    // Check for individual quest expiry
    // ✅ FIX: If multiple quests are active (shouldn't happen but handle it), pick the FIRST one by order_index
    const questsInPhase = allQuests
      .filter(q => q.phase_id === activePhase && q.status !== 'closed')
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const activeQuest = questsInPhase[0]; // Get first non-closed quest (should be active or scheduled)
    console.log(`🎯 [PhaseController] Checking auto-advance: eventConfig=${!!eventConfig}, event_started=${eventConfig?.event_started}, activePhase=${activePhase}, questsInPhase=${questsInPhase.length}, activeQuest=${activeQuest?.order_index || 'none'}, activeQuestStatus=${activeQuest?.status}`);

    if (activeQuest) {
      if (!activeQuest.started_at) {
        // Silenciosamente ignora - é normal quests que ainda não iniciaram não terem started_at
        // Don't return - fall through to phase-level check
      } else {
        const questStartTime = new Date(activeQuest.started_at);
        const now = new Date(new Date().toISOString());

        // ✅ FIX: Use ONLY planned_deadline_minutes for auto-advance (same as CurrentQuestTimer)
        // The late_submission_window is for MANUAL submissions, not for auto-advance timing
        const plannedDeadlineMs = (activeQuest.planned_deadline_minutes || 0) * 60 * 1000;
        const finalDeadline = new Date(questStartTime.getTime() + plannedDeadlineMs);

        const timeElapsedMs = now.getTime() - questStartTime.getTime();
        const timeRemainingMs = finalDeadline.getTime() - now.getTime();
        const timeRemainingSec = Math.round(timeRemainingMs / 1000);

        // Debug log a cada 30 segundos apenas (para não poluir console)
        const currentState = `${activeQuest.id}|${timeRemainingSec}`;
        if (lastPhaseStateRef.current !== currentState && (timeRemainingSec < 30 || timeRemainingSec % 30 === 0)) {
          lastPhaseStateRef.current = currentState;
          console.log(`🎯 [PhaseController] Quest ${activeQuest.order_index} status:
            - started: ${questStartTime.toISOString()}
            - planned: ${activeQuest.planned_deadline_minutes}min
            - late_window: ${activeQuest.late_submission_window_minutes}min
            - deadline: ${finalDeadline.toISOString()}
            - now: ${now.toISOString()}
            - time_remaining: ${(timeRemainingMs / 1000 / 60).toFixed(2)}min (${timeRemainingSec}s)`);
        }

        // ✅ RÁPIDO: Se quest passou do deadline final, avançar IMEDIATAMENTE
        if (now > finalDeadline) {
          // ✅ DEBOUNCE: Evitar múltiplos advances da mesma quest
          if (advancingQuestRef.current === activeQuest.id) {
            console.log(`⏳ [PhaseController] Já tentando avançar quest ${activeQuest.id}, ignorando nova tentativa`);
            return;
          }

          advancingQuestRef.current = activeQuest.id; // Mark as in-progress
          console.warn(`⚠️ [PhaseController] Quest ${activeQuest.order_index} expirada! Avançando AGORA (expirou há ${Math.round(-timeRemainingMs / 1000)}s)`);
          console.log(`📤 Chamando /api/admin/advance-quest com questId: ${activeQuest.id}`);

          fetch('/api/admin/advance-quest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questId: activeQuest.id }),
          }).then(response => {
            console.log(`📥 Resposta recebida: status=${response.status}, ok=${response.ok}`);
            return response.json().then(data => {
              console.log(`📊 Dados da resposta:`, data);
              if (response.ok) {
                // Broadcast quest update to CurrentQuestTimer for immediate refresh
                try {
                  const channel = new BroadcastChannel('quest-updates');
                  channel.postMessage({ type: 'questAdvanced', timestamp: Date.now() });
                  channel.close();
                  console.log(`📢 [PhaseController] Broadcast enviado para quest-updates`);
                } catch (err) {
                  console.warn(`⚠️ [PhaseController] BroadcastChannel não suportado:`, err);
                }
                advancingQuestRef.current = null; // Clear advancing flag
                fetchEventData();
              } else {
                advancingQuestRef.current = null; // Clear advancing flag on error
                console.error(`❌ Erro na resposta: ${data.error}`);
              }
            });
          }).catch((err) => {
            advancingQuestRef.current = null; // Clear advancing flag on error
            console.error('❌ Erro ao forçar auto-advance:', err);
          });
          return;
        } else {
          // Quest não está expirada, resetar detecção
          zeroTimeQuestDetectionRef.current = null;
        }
      }
    }

    // Existing phase-level auto-advance logic (fallback if no active quest or all quests in phase are done)
    const phaseStartTimeKey = `phase_${activePhase}_start_time` as keyof EventConfig;
    const phaseStartTimeISO = eventConfig[phaseStartTimeKey];

    // CORREÇÃO: Verifique se é UMA STRING antes de usar
    if (typeof phaseStartTimeISO !== 'string' || !phaseStartTimeISO) {
      return;
    }

    // Agora é 100% seguro, 'phaseStartTimeISO' é uma string válida
    // IMPORTANTE: Adicionar 'Z' se não tiver timezone info para garantir UTC
    const phaseStartTimeStr = phaseStartTimeISO.includes('+') || phaseStartTimeISO.includes('Z')
      ? phaseStartTimeISO
      : phaseStartTimeISO + 'Z';
    const phaseStartTime = new Date(phaseStartTimeStr);

    // Calculate total duration for the current phase
    const questsInActivePhase = allQuests.filter(q => q.phase_id === activePhase);
    const totalPhaseDurationMinutes = questsInActivePhase.reduce((sum, quest) => {
      return sum + (quest.planned_deadline_minutes || 0) + (quest.late_submission_window_minutes || 0);
    }, 0);

    if (totalPhaseDurationMinutes === 0) {
      console.log(`Phase ${activePhase} has no defined quest durations, cannot auto-advance.`);
      return; // Prevent division by zero or incorrect calc
    }

    const phaseEndTime = new Date(phaseStartTime.getTime() + totalPhaseDurationMinutes * 60 * 1000);
    const now = new Date(new Date().toISOString());
    const timeRemaining = (phaseEndTime.getTime() - now.getTime()) / 1000 / 60;
    const shouldAdvance = now > phaseEndTime;

    // Log apenas quando há mudança ou quando está próximo de expirar (últimos 30 segundos)
    const currentState = `${activePhase}|${timeRemaining.toFixed(1)}|${shouldAdvance}`;
    if (lastPhaseStateRef.current !== currentState && (Math.abs(timeRemaining) < 1 || shouldAdvance)) {
      lastPhaseStateRef.current = currentState;
      console.log(`🎯 [PhaseController] Phase ${activePhase} auto-advance check:
      - phaseStartTime: ${phaseStartTime.toISOString()}
      - totalDurationMinutes: ${totalPhaseDurationMinutes}
      - phaseEndTime: ${phaseEndTime.toISOString()}
      - now: ${now.toISOString()}
      - time remaining: ${timeRemaining.toFixed(2)} minutes
      - should advance: ${shouldAdvance}`);
    }

    if (now > phaseEndTime) {
      // Proteger contra múltiplos auto-advances da mesma fase
      if (!autoAdvancedPhaseRef.current.has(activePhase)) {
        autoAdvancedPhaseRef.current.add(activePhase);

        if (activePhase < phases.length - 1) {
          // Avançar para próxima fase (Fase 1→2, 2→3, etc)
          console.log(`✅ [PhaseController] ADVANCING Phase ${activePhase} → ${activePhase + 1}`);
          handleStartPhase(activePhase + 1);
        } else if (activePhase === phases.length - 1) {
          // Última fase expirou - chamar advance-quest para disparar game over
          console.log(`🏁 [PhaseController] ÚLTIMA FASE EXPIROU! Disparando evento de fim (game over)`);
          const lastQuest = allQuests.find(q =>
            q.phase_id === activePhase &&
            q.status === 'active'
          );
          if (lastQuest) {
            fetch('/api/admin/advance-quest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ questId: lastQuest.id }),
            }).then(response => {
              if (response.ok) {
                fetchEventData();
                // ✅ FIX: Removed router.refresh() - causes refresh in other tabs
              }
            }).catch((err) => {
              console.error('Erro ao disparar game over:', err);
            });
          }
        }
      }
    } else if (now < phaseEndTime) {
      // Se a fase NÃO expirou mais, remover do rastreamento (para o caso de regressão manual)
      autoAdvancedPhaseRef.current.delete(activePhase);
    }
  }, [eventConfig, allQuests, activePhase, handleStartPhase, phases.length]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phases.map((p) => (
          <div
            key={p.id}
            className={`
              border-2 rounded-xl p-4 transition-all
              ${activePhase === p.id
                ? 'border-[#00FF88] bg-[#0A1E47]/80 shadow-lg shadow-[#00FF88]/40'
                : 'border-[#00E5FF]/40 bg-[#0A1E47]/40'}
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <h4 className="font-bold text-sm text-white">{p.name}</h4>
                  {p.duration && (
                    <p className="text-xs text-[#00E5FF]/70">⏱️ {p.duration}</p>
                  )}
                </div>
              </div>
              {activePhase === p.id && (
                <span className="bg-[#00FF88] text-[#0A1E47] text-xs px-2 py-1 rounded-full font-bold">
                  ✓ ATIVA
                </span>
              )}
            </div>

            {p.points && (
              <div className="text-xs text-[#FFD700] mb-3">
                💎 {p.points} AMF Coins totais
              </div>
            )}

            <Button
              onClick={() => handleStartPhase(p.id)}
              disabled={isLoading || (activePhase === p.id && eventConfig?.event_started)}
              className={`w-full text-white font-bold hover:opacity-90 ${p.color}`}
              size="sm"
            >
              {activePhase === p.id ? '✓ Fase Atual' : `Ativar ${p.icon}`}
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40 rounded-lg p-4 text-sm">
        <p className="font-semibold text-[#00E5FF] mb-3">🚀 Como Começar o Evento:</p>
        <ol className="list-decimal list-inside text-[#00E5FF]/80 space-y-2 mb-3">
          <li><span className="font-bold">Clique em "Ativar"</span> em qualquer fase (Fase 1, 2, 3, 4 ou 5)</li>
          <li>O evento começará imediatamente naquela fase</li>
          <li>O cronômetro oficial inicia quando você ativar a primeira fase</li>
          <li>Os times e avaliadores verão qual fase está ativa em tempo real</li>
        </ol>

        <p className="font-semibold text-[#FF9800] mb-2">⏸️ Como Navegar Entre Fases:</p>
        <ul className="list-disc list-inside text-[#FF9800]/80 space-y-1">
          <li>Clique em outra fase para mudar durante o evento</li>
          <li>Voltar para <span className="font-bold text-red-400">"Preparação"</span> encerra o evento completamente</li>
        </ul>
      </div>
    </div>
  )
}
