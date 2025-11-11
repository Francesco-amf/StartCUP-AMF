'use client'

import { useRealtimeRanking } from '@/lib/hooks/useRealtime'
import RankingBoard from '@/components/dashboard/RankingBoard'
import LivePenaltiesStatus from '@/components/dashboard/LivePenaltiesStatus'
import { Card } from '@/components/ui/card'

interface AdminDashboardClientProps {
  teams: any[]
  evaluators: any[]
}

export default function AdminDashboardClient({ teams, evaluators }: AdminDashboardClientProps) {
  const { ranking } = useRealtimeRanking()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
      {/* Ranking e Penalidades em tempo real */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#00E5FF] mb-4">🏆 Ranking em Tempo Real</h2>
          {ranking && ranking.length > 0 ? (
            <RankingBoard ranking={ranking} />
          ) : (
            <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60">
              <p className="text-[#00E5FF]/60">Nenhuma equipe no ranking ainda.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Coluna lateral com penalidades */}
      <div className="space-y-4">
        <LivePenaltiesStatus />
      </div>
    </div>
  )
}
