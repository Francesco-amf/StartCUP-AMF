'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
      default: return 'from-purple-500 to-blue-500'
    }
  }

  const getPointsColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-600'
      case 2: return 'text-gray-600'
      case 3: return 'text-orange-600'
      default: return 'text-purple-600'
    }
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {ranking.map((team, index) => (
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
          >
            <Card
              className={`
                relative overflow-hidden
                ${index < 3 ? 'border-2 shadow-lg' : 'border'}
                ${index === 0 ? 'border-yellow-400' : ''}
                ${index === 1 ? 'border-gray-400' : ''}
                ${index === 2 ? 'border-orange-400' : ''}
              `}
            >
              {/* Gradient Background para Top 3 */}
              {index < 3 && (
                <div 
                  className={`
                    absolute inset-0 opacity-5
                    bg-gradient-to-r ${getPositionColor(index + 1)}
                  `}
                />
              )}

              <div className="relative p-4 md:p-6">
                <div className="flex items-center gap-4">
                  
                  {/* Posição */}
                  <div className="flex-shrink-0">
                    <div
                      className={`
                        w-16 h-16 md:w-20 md:h-20
                        flex items-center justify-center
                        rounded-full font-black text-2xl md:text-3xl
                        bg-gradient-to-br ${getPositionColor(index + 1)}
                        text-white shadow-lg
                      `}
                    >
                      {getPositionEmoji(index + 1)}
                    </div>
                  </div>

                  {/* Info da Equipe */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl md:text-2xl font-bold truncate">
                      {team.team_name}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 truncate">
                      {team.course}
                    </p>

                    {/* Estatísticas */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        📋 {team.quests_completed} quests
                      </Badge>
                      {team.power_ups_used > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          ⚡ {team.power_ups_used} power-ups
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Pontos */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-3xl md:text-5xl font-black ${getPointsColor(index + 1)}`}>
                      {team.total_points.toFixed(0)}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 font-medium">
                      pontos
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
          <p className="text-xl text-gray-600">
            O ranking aparecerá quando as equipes começarem a pontuar!
          </p>
        </Card>
      )}
    </div>
  )
}