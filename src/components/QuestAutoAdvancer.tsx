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
  const supabase = createClient()
  const zeroTimeQuestDetectionRef = useRef<{ questId: string; detectedAt: number } | null>(null)

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
  }, [supabase])

  // Initial fetch and polling
  useEffect(() => {
    fetchEventData()
    const interval = setInterval(fetchEventData, 500) // 500ms polling
    return () => clearInterval(interval)
  }, [fetchEventData])

  // Auto-advance logic
  useEffect(() => {
    if (!eventConfig || !eventConfig.event_started) {
      return
    }

    const activePhase = eventConfig.current_phase || 0
    if (activePhase === 0) {
      return // Preparação phase
    }

    // Find active quest in current phase
    const activeQuest = allQuests.find(q => q.status === 'active' && q.phase_id === activePhase)

    if (!activeQuest || !activeQuest.started_at) {
      return
    }

    const questStartTime = new Date(activeQuest.started_at + 'Z')
    const now = new Date(new Date().toISOString())

    // Calculate final deadline (quest duration + late submission window)
    const finalDeadline = new Date(questStartTime.getTime() +
      ((activeQuest.planned_deadline_minutes || 0) + (activeQuest.late_submission_window_minutes || 0)) * 60 * 1000
    )

    // Protection: If quest has been active for more than 1 hour, auto-advance
    const timeElapsedMinutes = (now.getTime() - questStartTime.getTime()) / 1000 / 60
    if (timeElapsedMinutes > 60) {
      console.warn(`⚠️ [QuestAutoAdvancer] Quest ${activeQuest.order_index} has been active for ${Math.round(timeElapsedMinutes)}min! Force advancing...`)
      fetch('/api/admin/advance-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: activeQuest.id }),
      }).then(response => {
        if (response.ok) {
          fetchEventData()
          router.refresh()
        }
      }).catch(err => {
        console.error('❌ Error auto-advancing stuck quest:', err)
      })
      return
    }

    // If quest passed final deadline, auto-advance after 5 second detection window
    if (now > finalDeadline) {
      console.log(`🔴 [QuestAutoAdvancer] Quest ${activeQuest.order_index} expired (deadline: ${(finalDeadline.getTime() - now.getTime())/1000}s ago)`)

      if (zeroTimeQuestDetectionRef.current?.questId !== activeQuest.id) {
        // First detection of this quest expiration
        zeroTimeQuestDetectionRef.current = {
          questId: activeQuest.id,
          detectedAt: now.getTime()
        }
        console.warn(`⚠️ [QuestAutoAdvancer] Quest ${activeQuest.order_index} expired! Will force advance in 5s if not already advanced...`)
      } else {
        // Already detected - check if 5 seconds have passed
        const timeSinceDetection = (now.getTime() - zeroTimeQuestDetectionRef.current.detectedAt) / 1000
        if (timeSinceDetection > 5) {
          console.warn(`⚠️ [QuestAutoAdvancer] FORCING auto-advance of Quest ${activeQuest.order_index} (waited ${Math.round(timeSinceDetection)}s)`)
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
                zeroTimeQuestDetectionRef.current = null // Reset
                // Broadcast quest update to CurrentQuestTimer for immediate refresh
                try {
                  const channel = new BroadcastChannel('quest-updates')
                  channel.postMessage({ type: 'questAdvanced', timestamp: Date.now() })
                  channel.close()
                  console.log(`📢 [QuestAutoAdvancer] Broadcast sent to quest-updates`)
                } catch (err) {
                  console.warn(`⚠️ [QuestAutoAdvancer] BroadcastChannel not supported:`, err)
                }
                fetchEventData()
                router.refresh()
              } else {
                console.error(`❌ Error in response: ${data.error}`)
              }
            })
          }).catch(err => {
            console.error('❌ Error forcing auto-advance:', err)
          })
          return
        }
      }
    } else {
      // Quest not expired anymore, reset detection
      zeroTimeQuestDetectionRef.current = null
    }

  }, [eventConfig, allQuests, fetchEventData, router])

  // This component renders nothing - it's purely background logic
  return null
}
