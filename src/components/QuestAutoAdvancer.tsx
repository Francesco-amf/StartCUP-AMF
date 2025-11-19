'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Quest, type EventConfig } from '@/lib/types'

/**
 * QuestAutoAdvancer - Background component that automatically advances quests
 * when they expire. Renders nothing - only monitors quest timers.
 *
 * This component is designed to be placed in the live-dashboard (public view)
 * without any visible UI elements.
 */
export default function QuestAutoAdvancer() {
  const router = useRouter()
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null)
  const [allQuests, setAllQuests] = useState<Quest[]>([])
  const [isLoading, setIsLoading] = useState(true) // ✅ ADDED: Loading state
  const supabase = createClient()
  const zeroTimeQuestDetectionRef = useRef<{ questId: string; detectedAt: number } | null>(null)

  // ✅ NEW: Client-side deduplication tracking
  // Prevents multiple advance attempts for the same quest within 5 seconds
  const lastAdvanceAttemptRef = useRef<Map<string, number>>(new Map())

  const fetchEventData = useCallback(async () => {
    // Fetch event_config
    const { data: configData, error: configError } = await supabase
      .from('event_config')
      .select('*, phase_1_start_time, phase_2_start_time, phase_3_start_time, phase_4_start_time, phase_5_start_time')
      .single()

    if (!configError && configData) {
      setEventConfig(configData)
    }

    // Fetch all quests
    const { data: questsData, error: questsError } = await supabase
      .from('quests')
      .select('id, phase_id, planned_deadline_minutes, late_submission_window_minutes, order_index, status, name, started_at')

    if (!questsError && questsData) {
      setAllQuests(questsData as Quest[])
    }

    // ✅ ADDED: Turn off loading state after first successful fetch
    if (!configError && !questsError) {
      setIsLoading(false)
    }
  }, [supabase])

  // ✅ NEW: Helper function for exponential backoff retry
  // Retries advancing a quest with increasing delays: 1s, 2s, 4s
  const retryAdvanceQuest = useCallback(async (questId: string, questOrder: number, retryCount = 0) => {
    const MAX_RETRIES = 3
    const BASE_DELAY_MS = 1000 // 1 second
    const BACKOFF_MULTIPLIER = 2 // Exponential: 1s -> 2s -> 4s

    // Calculate delay: 1s, 2s, 4s
    const delayMs = BASE_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, retryCount - 1)

    console.log(`⏳ [QuestAutoAdvancer] Retrying quest ${questOrder} advance (attempt ${retryCount}/${MAX_RETRIES}, waiting ${delayMs}ms)...`)

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delayMs))

    try {
      const response = await fetch('/api/admin/advance-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId }),
      })

      console.log(`📥 Retry response: status=${response.status}, ok=${response.ok}`)
      const data = await response.json()

      if (response.ok) {
        console.log(`✅ [QuestAutoAdvancer] Quest ${questOrder} advanced successfully on retry ${retryCount}`)
        fetchEventData()
        return true
      } else if (response.status === 429 && retryCount < MAX_RETRIES) {
        // Still locked, retry with exponential backoff
        console.warn(`⚠️ [QuestAutoAdvancer] Quest ${questOrder} still locked (429), scheduling retry ${retryCount + 1}...`)
        return retryAdvanceQuest(questId, questOrder, retryCount + 1)
      } else if (response.status === 429) {
        // Max retries exceeded
        console.error(`❌ [QuestAutoAdvancer] Quest ${questOrder} failed after ${MAX_RETRIES} retries: ${data.error}`)
        return false
      } else {
        console.error(`❌ [QuestAutoAdvancer] Unexpected error for quest ${questOrder}: ${data.error}`)
        return false
      }
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        console.error(`⚠️ [QuestAutoAdvancer] Network error on retry ${retryCount}, will retry: ${err}`)
        return retryAdvanceQuest(questId, questOrder, retryCount + 1)
      } else {
        console.error(`❌ [QuestAutoAdvancer] Quest ${questOrder} failed after ${MAX_RETRIES} retries (network error):`, err)
        return false
      }
    }
  }, [fetchEventData])

  // Initial fetch and polling
  useEffect(() => {
    fetchEventData()
    const interval = setInterval(fetchEventData, 500) // 500ms polling
    return () => clearInterval(interval)
  }, [fetchEventData])

  // Auto-advance logic
  useEffect(() => {
    if (isLoading || !eventConfig || !eventConfig.event_started) {
      return
    }

    const activePhase = eventConfig.current_phase || 0
    if (activePhase === 0) {
      return // Preparação phase
    }

    // Find active quest in current phase
    // ✅ FIX: If multiple quests are active (shouldn't happen but handle it), pick the FIRST one by order_index
    const questsInPhase = allQuests
      .filter(q => q.phase_id === activePhase && q.status !== 'closed')
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const activeQuest = questsInPhase[0]; // Get first non-closed quest (should be active or scheduled)
    console.log(`🎯 [QuestAutoAdvancer] Checking auto-advance: eventConfig=${!!eventConfig}, event_started=${eventConfig?.event_started}, activePhase=${activePhase}, questsInPhase=${questsInPhase.length}, activeQuest=${activeQuest?.order_index || 'none'}, activeQuestStatus=${activeQuest?.status}`);

    if (!activeQuest || !activeQuest.started_at) {
      return
    }

    const questStartTime = new Date(activeQuest.started_at)
    const now = new Date(new Date().toISOString())

    // ✅ FIX: Use ONLY planned_deadline_minutes for auto-advance (same as CurrentQuestTimer)
    // The late_submission_window is for MANUAL submissions, not for auto-advance timing
    const finalDeadline = new Date(questStartTime.getTime() +
      (activeQuest.planned_deadline_minutes || 0) * 60 * 1000
    )

    // Debug: Log status (only when deadline is close or expired)
    const timeRemainingMs = finalDeadline.getTime() - now.getTime()
    const timeRemainingSec = Math.round(timeRemainingMs / 1000)
    if (timeRemainingSec < 30 || (now > finalDeadline)) {
      console.log(`🎯 [QuestAutoAdvancer] Quest ${activeQuest.order_index} status:
        - planned: ${activeQuest.planned_deadline_minutes}min
        - late_window: ${activeQuest.late_submission_window_minutes}min
        - deadline: ${finalDeadline.toISOString()}
        - time_remaining: ${(timeRemainingMs / 1000 / 60).toFixed(2)}min (${timeRemainingSec}s)`)
    }

    // ✅ RÁPIDO: Se quest passou do deadline final, avançar IMEDIATAMENTE
    // Sem delay de espera - a quest expirou, avança agora!
    if (now > finalDeadline) {
      console.warn(`⚠️ [QuestAutoAdvancer] Quest ${activeQuest.order_index} expired! Advancing NOW (expirou há ${Math.round(-timeRemainingMs / 1000)}s)`)

      // ✅ NEW: Client-side deduplication check
      // Skip if we tried to advance this same quest within the last 5 seconds
      const lastAttemptTime = lastAdvanceAttemptRef.current.get(activeQuest.id)
      const now_ms = Date.now()
      const DEDUP_COOLDOWN_MS = 5000 // 5 second cooldown

      if (lastAttemptTime && (now_ms - lastAttemptTime) < DEDUP_COOLDOWN_MS) {
        const remainingCooldownMs = DEDUP_COOLDOWN_MS - (now_ms - lastAttemptTime)
        console.log(`⏳ [QuestAutoAdvancer] Quest ${activeQuest.order_index} already attempted ${((now_ms - lastAttemptTime) / 1000).toFixed(1)}s ago, skipping (${(remainingCooldownMs / 1000).toFixed(1)}s cooldown remaining)`)
        return
      }

      // Record this attempt
      lastAdvanceAttemptRef.current.set(activeQuest.id, now_ms)

      // Initial API call
      console.log(`📤 Calling /api/admin/advance-quest with questId: ${activeQuest.id}`)

      fetch('/api/admin/advance-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: activeQuest.id }),
      }).then(response => {
        console.log(`📥 Response: status=${response.status}, ok=${response.ok}`)
        return response.json().then(data => {
          console.log(`📊 Response data:`, data)
          if (response.ok) {
            // ✅ FIX: Removed duplicate BroadcastChannel sender
            // PhaseController already sends this message, causing double fetches
            // Keeping only the sender in PhaseController to avoid duplication
            console.log(`✅ [QuestAutoAdvancer] Quest ${activeQuest.order_index} advanced successfully on first attempt`)
            fetchEventData()
            // ✅ FIX: Removed router.refresh() - causes refresh in other tabs
          } else if (response.status === 429) {
            // ✅ NEW: 429 error means quest is locked, trigger exponential backoff retry
            console.warn(`⚠️ [QuestAutoAdvancer] Quest ${activeQuest.order_index} locked (429), starting exponential backoff retries...`)
            retryAdvanceQuest(activeQuest.id, activeQuest.order_index || 0, 1)
          } else {
            console.error(`❌ Error in response: ${data.error}`)
          }
        })
      }).catch(err => {
        console.error('❌ Error forcing auto-advance:', err)
      })
      return
    } else {
      // Quest not expired anymore, reset detection
      zeroTimeQuestDetectionRef.current = null
    }

  }, [isLoading, eventConfig, allQuests, fetchEventData, retryAdvanceQuest, router])

  // This component renders nothing - it's purely background logic
  return null
}
