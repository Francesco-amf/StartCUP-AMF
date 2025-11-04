'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAudioFiles } from '@/lib/hooks/useAudioFiles'
import { usePenalties } from '@/lib/hooks/usePenalties'

interface RankingItem {
  team_id: string
  team_name: string
  course: string
  total_points: number
  quests_completed: number
  power_ups_used: number
}

interface RankingBoardProps {
  ranking: RankingItem[]
}

export default function RankingBoard({ ranking }: RankingBoardProps) {
  const { play } = useAudioFiles()
  const { getPenalty } = usePenalties()
  const previousRankingRef = useRef<Record<string, number>>({})

  // Detectar mudanças de pontos e tocar som
  useEffect(() => {
    ranking.forEach((team: any) => {
      const previousPoints = previousRankingRef.current[team.team_id]
      if (previousPoints !== undefined && team.total_points > previousPoints) {
        // Pontos aumentaram!
        play('points-update')
      }
      previousRankingRef.current[team.team_id] = team.total_points
    })
  }, [ranking, play])
  const getPositionEmoji = (position: number) => {
    switch (position) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${position}`
    }
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'from-yellow-400 to-yellow-600'
      case 2: return 'from-gray-300 to-gray-500'
      case 3: return 'from-orange-400 to-orange-600'
      default: return 'from-[#0A1E47]/0 to-[#001A4D]/0'
    }
  }

  const getPointsColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-600'
      case 2: return 'text-[#00E5FF]/70'
      case 3: return 'text-orange-600'
      default: return 'text-[#00E5FF]/70'
    }
  }

  return (
    <div className="space-y-3" role="list" aria-label="Ranking board with team scores">
      <AnimatePresence mode="popLayout">
        {ranking.map((team: any, index: number) => (
          <motion.div
            key={team.team_id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              layout: { duration: 0.5, type: 'spring' },
              opacity: { duration: 0.3 },
            }}
            role="listitem"
          >
            <Card
              className={`
                relative overflow-hidden bg-gradient-to-br from-[#0A2540] to-[#001A4D]
                ${index < 3 ? 'border-2 shadow-lg' : 'border'}
                ${index === 0 ? 'border-yellow-400' : ''}
                ${index === 1 ? 'border-gray-400' : ''}
                ${index === 2 ? 'border-orange-400' : ''}
              `}
              aria-label={`${index + 1}. ${team.team_name} - ${team.total_points.toFixed(0)} points`}
            >
              {/* Gradient Background para Top 3 */}
              {index < 3 && (
                <div
                  className={`
                    absolute inset-0 opacity-20
                    bg-gradient-to-r ${getPositionColor(index + 1)}
                  `}
                />
              )}

              <div className="relative p-4 md:p-5">
                <div className="flex items-center gap-3 md:gap-4">

                  {/* Posição */}
                  <div className="flex-shrink-0">
                    <div
                      className={`
                        w-14 h-14 md:w-16 md:h-16
                        flex items-center justify-center
                        rounded-full font-black text-xl md:text-2xl
                        bg-gradient-to-br ${getPositionColor(index + 1)}
                        text-white shadow-lg
                      `}
                    >
                      {getPositionEmoji(index + 1)}
                    </div>
                  </div>

                  {/* Info da Equipe */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-white truncate">
                      {team.team_name}
                    </h3>
                    <p className="text-xs md:text-sm text-[#00E5FF] truncate">
                      {team.course}
                    </p>

                    {/* Estatísticas */}
                    <div className="flex gap-1 md:gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40">
                        📋 {team.quests_completed}
                      </Badge>
                      {team.power_ups_used > 0 && (
                        <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-200 border-purple-500/40">
                          ⚡ {team.power_ups_used}
                        </Badge>
                      )}
                      {getPenalty(team.team_id) > 0 && (
                        <Badge className="text-xs bg-[#FF3D00]/30 text-[#FFB74D] border border-[#FF3D00]/60">
                          ⚠️ -{getPenalty(team.team_id)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* AMF Coins */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-2xl md:text-4xl font-black ${getPointsColor(index + 1)}`}>
                      {team.total_points.toFixed(0)}
                    </div>
                    <div className="text-xs md:text-sm text-[#00E5FF]/50 font-medium">
                      🪙 AMF Coins
                    </div>
                  </div>

                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {ranking.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-xl text-[#00E5FF]/70">
            O ranking aparecerá quando as equipes começarem a pontuar!
          </p>
        </Card>
      )}
    </div>
  )
}
