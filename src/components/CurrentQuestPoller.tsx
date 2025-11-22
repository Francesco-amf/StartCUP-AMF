'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * CurrentQuestPoller - Client component that polls for the current quest
 * Updates the page when a new quest is activated (e.g., after advancement)
 */
export default function CurrentQuestPoller({ 
  teamId, 
  initialQuestId 
}: { 
  teamId: string
  initialQuestId?: string 
}) {
  const [currentQuestId, setCurrentQuestId] = useState(initialQuestId)
  const supabase = createClient()

  useEffect(() => {
    const pollCurrentQuest = async () => {
      try {
        // Get event config to know current phase
        const { data: eventConfig } = await supabase
          .from('event_config')
          .select('current_phase')
          .single()

        if (!eventConfig?.current_phase) return

        // Get all quests in current phase for this team
        const { data: quests } = await supabase
          .from('quests')
          .select('id, started_at, planned_deadline_minutes, late_submission_window_minutes, order_index, phase_id')
          .eq('team_id', teamId)
          .eq('phase_id', eventConfig.current_phase)
          .order('order_index')

        if (!quests?.length) return

        // Get submissions to know which are completed
        const { data: submissions } = await supabase
          .from('submissions')
          .select('quest_id')
          .eq('team_id', teamId)

        const submittedQuestIds = submissions?.map((s: any) => s.quest_id) || []

        // Calculate current quest (same logic as dashboard/page.tsx)
        const getDate = (iso?: string | null) => {
          if (!iso) return null
          const str = iso.endsWith('Z') ? iso : iso.replace('+00:00', 'Z')
          const d = new Date(str)
          return isNaN(d.getTime()) ? null : d
        }

        const nowMs = Date.now()
        const epsilon = 500
        let currentIndex = -1

        // First pass: non-submitted quest within deadline window
        for (let i = 0; i < quests.length; i++) {
          const q = quests[i]
          if (submittedQuestIds.includes(q.id)) continue
          const start = getDate(q.started_at)
          if (!start) {
            currentIndex = i
            break
          }
          const planned = typeof q.planned_deadline_minutes === 'number' ? q.planned_deadline_minutes : null
          const late = typeof q.late_submission_window_minutes === 'number' ? q.late_submission_window_minutes : 0
          if (planned === null) {
            currentIndex = i
            break
          }
          const regularEndMs = start.getTime() + planned * 60_000
          const finalEndMs = regularEndMs + late * 60_000
          if (nowMs <= finalEndMs + epsilon) {
            currentIndex = i
            break
          }
        }

        // Second pass: first non-submitted (fallback for expired quests)
        if (currentIndex === -1) {
          for (let i = 0; i < quests.length; i++) {
            const q = quests[i]
            if (!submittedQuestIds.includes(q.id)) {
              currentIndex = i
              break
            }
          }
        }

        const newCurrentQuestId = currentIndex >= 0 ? quests[currentIndex].id : undefined

        // Update if changed
        if (newCurrentQuestId !== currentQuestId) {
          console.log(`📋 [CurrentQuestPoller] Quest changed: ${currentQuestId} → ${newCurrentQuestId}`)
          setCurrentQuestId(newCurrentQuestId)
          
          // Force page refresh to show new quest
          // Use router.refresh() which updates the server data while keeping the page in place
          if (typeof window !== 'undefined') {
            // Trigger a soft refresh by reloading the page component data
            window.location.reload()
          }
        }
      } catch (err) {
        console.error('❌ Error polling current quest:', err)
      }
    }

    // Poll every 1.5 seconds
    const interval = setInterval(pollCurrentQuest, 1500)

    return () => clearInterval(interval)
  }, [teamId, currentQuestId, supabase])

  // This component renders nothing - it's purely background polling
  return null
}
