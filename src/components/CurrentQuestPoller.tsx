'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * CurrentQuestPoller - Reloads page when quests table changes
 * Uses Supabase Realtime to detect changes and reload immediately
 */
export default function CurrentQuestPoller({ 
  teamId
}: { 
  teamId: string
}) {
  const supabase = createClient()

  useEffect(() => {
    console.log(`🔄 [CurrentQuestPoller] Subscribing to quest changes`)

    // Subscribe to changes in quests table (all quests, no team filter since quests don't have team_id)
    const questsSubscription = supabase
      .channel(`quests-global`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Only listen to updates (status, started_at, etc.)
          schema: 'public',
          table: 'quests',
        },
        (payload: any) => {
          console.log(`🔄 [CurrentQuestPoller] Quest changed:`, payload)
          // Reload page when any quest changes
          console.log(`🔄 [CurrentQuestPoller] Reloading page due to quest change...`)
          window.location.reload()
        }
      )
      .subscribe()

    // Also subscribe to submissions for this team (quest completion might be detected via submissions)
    const submissionsSubscription = supabase
      .channel(`submissions-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
          filter: `team_id=eq.${teamId}`,
        },
        (payload: any) => {
          console.log(`📦 [CurrentQuestPoller] Submission detected:`, payload)
          // Reload page when submission is made (quest might advance)
          setTimeout(() => {
            console.log(`🔄 [CurrentQuestPoller] Reloading page due to submission...`)
            window.location.reload()
          }, 500) // Wait 500ms for backend to process
        }
      )
      .subscribe()

    return () => {
      console.log(`🔄 [CurrentQuestPoller] Unsubscribing from quest changes`)
      supabase.removeChannel(questsSubscription)
      supabase.removeChannel(submissionsSubscription)
    }
  }, [teamId, supabase])

  // This component renders nothing - it's purely background monitoring
  return null
}
