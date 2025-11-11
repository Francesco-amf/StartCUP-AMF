'use client'

import { useRealtimeRankingOptimized } from '@/lib/hooks/useRealtimeRankingOptimized'
import ErrorBoundary from '@/components/ErrorBoundary'

/**
 * Ranking Board usando SWR
 * Componente otimizado para exibir ranking em tempo real
 */
function RankingBoardContent() {
  const { ranking, loading, error, mutate } = useRealtimeRankingOptimized()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <div className="text-4xl">🏆</div>
        </div>
        <p className="ml-4 text-xl text-gray-300">Carregando ranking...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-950/50 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-300 mb-4">Erro ao carregar ranking</p>
        <button
          onClick={() => mutate()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (ranking.length === 0) {
    return (
      <div className="text-center text-gray-400 p-8">
        <p>Nenhuma equipe no ranking ainda</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-yellow-400">🏆 Ranking Ao Vivo</h2>
        <button
          onClick={() => mutate()}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-sm text-white rounded transition-colors"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Rankings */}
      <div className="space-y-3">
        {ranking.map((team: any, index: number) => (
          <div
            key={team.id}
            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
              index === 0
                ? 'bg-yellow-900/30 border-yellow-500 shadow-lg shadow-yellow-500/50'
                : index === 1
                  ? 'bg-gray-700/30 border-gray-400'
                  : index === 2
                    ? 'bg-orange-900/30 border-orange-400'
                    : 'bg-gray-800/30 border-gray-600'
            }`}
          >
            {/* Position Badge */}
            <div
              className={`text-3xl font-black w-12 h-12 flex items-center justify-center rounded-full ${
                index === 0
                  ? 'bg-yellow-500 text-black'
                  : index === 1
                    ? 'bg-gray-400 text-black'
                    : index === 2
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-600 text-white'
              }`}
            >
              {index + 1}
            </div>

            {/* Team Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{team.team_name}</h3>
              <p className="text-sm text-gray-400">Equipe #{team.id}</p>
            </div>

            {/* Points */}
            <div className="text-right">
              <p className="text-2xl font-black text-yellow-300">{team.total_points}</p>
              <p className="text-xs text-gray-400">pontos</p>
            </div>

            {/* Medal Icon */}
            <div className="text-2xl">
              {index === 0 && '🥇'}
              {index === 1 && '🥈'}
              {index === 2 && '🥉'}
              {index > 2 && '⭐'}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Atualizado automaticamente • {ranking.length} equipes
        </p>
      </div>
    </div>
  )
}

/**
 * Wrapper com Error Boundary
 * Garante que erro em um componente não quebra toda a página
 */
export default function RankingBoard() {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Erro no RankingBoard:', error)
      }}
    >
      <RankingBoardContent />
    </ErrorBoundary>
  )
}

/**
 * Exemplo de uso:
 *
 * import RankingBoard from '@/components/RankingBoardOptimized'
 *
 * export default function Dashboard() {
 *   return (
 *     <div>
 *       <RankingBoard />
 *     </div>
 *   )
 * }
 */
