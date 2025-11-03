'use client'

import { Button } from '@/components/ui/button'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Quest } from '@/lib/types'

interface PhaseControllerProps {
  currentPhase: number
  eventStarted: boolean
}

interface EventConfig {
  id: string;
  current_phase: number;
  event_started: boolean;
  event_ended: boolean;
  event_start_time: string | null;
  phase_1_start_time: string | null;
  phase_2_start_time: string | null;
  phase_3_start_time: string | null;
  phase_4_start_time: string | null;
  phase_5_start_time: string | null;
}

export default function PhaseController({ currentPhase, eventStarted }: PhaseControllerProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null)
  const [allQuests, setAllQuests] = useState<Quest[]>([])
  const supabase = createClient()

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
      .select('id, phase_id, planned_deadline_minutes, late_submission_window_minutes, order_index, status');
    
    if (questsError) {
      console.error("Error fetching quests:", questsError);
    } else {
      setAllQuests(questsData as Quest[]);
    }
  }, [supabase]);

  const handleStartPhase = useCallback(async (phaseId: number) => {
    console.log(`🎯 handleStartPhase called with phaseId: ${phaseId}`)

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

    console.log(`📤 Sending fetch request to /api/admin/start-phase-with-quests with phase: ${phaseId}`)
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

      console.log(`✅ API Response received:`, {
        status: response.status,
        ok: response.ok,
        data: data
      })

      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          error: data.error,
          details: data.details,
          code: data.code,
          hint: data.hint
        })
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
      console.log(`🎉 Success! Showing alert with message:`, data.message)
      alert(`✅ ${data.message}${questMessage}`)

      // Refresh component's internal state and then the router
      await fetchEventData(); // Re-fetch data immediately after successful phase change
      router.refresh(); // Tells Next.js to re-render server components

    } catch (error) {
      console.error('Erro:', error)
      alert(`❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsLoading(false)
    }
  }, [eventConfig, fetchEventData, phases, router]);

  useEffect(() => {
    fetchEventData();
    const interval = setInterval(fetchEventData, 30000); // Refresh data every 30 seconds
    return () => clearInterval(interval);
  }, [fetchEventData]);

  useEffect(() => {
    if (!eventConfig || !eventConfig.event_started || activePhase === 0 || activePhase === 5) {
      return; // Not started, or a preparation/final phase
    }

    // Check for individual quest expiry
    const activeQuest = allQuests.find(q => q.status === 'active' && q.phase_id === activePhase);

    if (activeQuest) {
      if (!activeQuest.started_at) {
        console.log(`Quest ${activeQuest.id} has no started_at time, cannot calculate auto-advance.`);
        return;
      }
      const questStartTime = new Date(activeQuest.started_at + 'Z');
      const questEndTime = new Date(questStartTime.getTime() + 
        ((activeQuest.planned_deadline_minutes || 0) + (activeQuest.late_submission_window_minutes || 0)) * 60 * 1000
      );
      const now = new Date(new Date().toISOString());

      console.log(`Quest ${activeQuest.order_index} Auto-advance check:`);
      console.log(`  - Quest Start Time: ${questStartTime.toISOString()}`);
      console.log(`  - Quest End Time: ${questEndTime.toISOString()}`);
      console.log(`  - Current Time: ${now.toISOString()}`);
      console.log(`  - Should advance quest: ${now > questEndTime}`);

      if (now > questEndTime) {
        console.log(`🚀 Auto-advancing quest ${activeQuest.id}!`);
        // Call the new advance-quest API endpoint
        fetch('/api/admin/advance-quest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questId: activeQuest.id }),
        }).then(response => {
          if (response.ok) {
            console.log('Quest auto-advanced successfully.');
            fetchEventData(); // Re-fetch data to update UI
            router.refresh();
          } else {
            console.error('Failed to auto-advance quest.', response.status);
          }
        }).catch(error => {
          console.error('Error during quest auto-advance API call:', error);
        });
        return; // Prevent further checks until next interval
      }
    }

    // Existing phase-level auto-advance logic (fallback if no active quest or all quests in phase are done)
    const phaseStartTimeKey = `phase_${activePhase}_start_time` as keyof EventConfig;
    const phaseStartTimeISO = eventConfig[phaseStartTimeKey];

    if (!phaseStartTimeISO) {
      console.log(`Phase ${activePhase} start time not found, cannot calculate auto-advance.`);
      return;
    }

    const phaseStartTime = new Date(phaseStartTimeISO);

    // Calculate total duration for the current phase
    const questsInActivePhase = allQuests.filter(q => q.phase_id === activePhase);
    const totalPhaseDurationMinutes = questsInActivePhase.reduce((sum, quest) => {
      return sum + (quest.planned_deadline_minutes || 0) + (quest.late_submission_window_minutes || 0);
    }, 0);

    if (totalPhaseDurationMinutes === 0) {
      console.log(`Phase ${activePhase} has no defined quest durations, cannot auto-advance.`);
      return; // Prevent division by zero or incorrect calc
    }

    const phaseEndTime = new Date(phaseStartTime.getTime() + (totalPhaseDurationMinutes * 60 * 1000));
    const now = new Date(new Date().toISOString());

    console.log(`Phase ${activePhase} Auto-advance check:`);
    console.log(`  - Phase Start Time: ${phaseStartTime.toISOString()}`);
    console.log(`  - Total Phase Duration: ${totalPhaseDurationMinutes} minutes`);
    console.log(`  - Phase End Time: ${phaseEndTime.toISOString()}`);
    console.log(`  - Current Time: ${now.toISOString()}`);
    console.log(`  - Should auto-advance phase: ${now > phaseEndTime}`);

    if (now > phaseEndTime && activePhase < phases.length - 1) {
      console.log(`🚀 Auto-advancing to Phase ${activePhase + 1}!`);
      handleStartPhase(activePhase + 1); // Automatically start the next phase
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
                💎 {p.points} pontos totais
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
