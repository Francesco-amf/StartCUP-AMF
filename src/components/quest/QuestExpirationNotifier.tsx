'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { type Quest } from '@/lib/types'

interface QuestExpirationNotifierProps {
  currentQuest?: Quest
}

/**
 * Componente que monitora quando a quest atual expira e mostra notificação visual
 */
export default function QuestExpirationNotifier({ currentQuest }: QuestExpirationNotifierProps) {
  const [showNotification, setShowNotification] = useState(false)
  const [expiredQuestName, setExpiredQuestName] = useState('')

  useEffect(() => {
    if (!currentQuest?.started_at || !currentQuest?.planned_deadline_minutes) {
      return
    }

    const checkExpiration = () => {
      const now = Date.now()
      const startedAt = new Date(currentQuest.started_at!).getTime()
      const plannedMinutes = currentQuest.planned_deadline_minutes || 0
      const lateMinutes = currentQuest.late_submission_window_minutes || 0
      const totalMinutes = plannedMinutes + lateMinutes
      const expiresAt = startedAt + (totalMinutes * 60 * 1000)
      
      const epsilon = 500 // 500ms de tolerância
      
      // Se expirou nos últimos 2 segundos, mostrar notificação
      if (now > expiresAt - epsilon && now < expiresAt + 2000) {
        setExpiredQuestName(currentQuest.name)
        setShowNotification(true)
        
        // Auto-esconder após 10 segundos
        setTimeout(() => {
          setShowNotification(false)
        }, 10000)
      }
    }

    // Verificar a cada 1 segundo
    const interval = setInterval(checkExpiration, 1000)
    
    return () => clearInterval(interval)
  }, [currentQuest])

  if (!showNotification) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-500">
      <Card className="p-4 bg-gradient-to-r from-red-600 to-orange-600 border-2 border-red-400 shadow-2xl max-w-sm">
        <div className="flex items-start gap-3">
          <span className="text-4xl">⏰</span>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">
              ⚠️ Prazo Expirado!
            </h3>
            <p className="text-white/90 text-sm">
              A quest <strong>"{expiredQuestName}"</strong> expirou. 
              A página será atualizada automaticamente.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
