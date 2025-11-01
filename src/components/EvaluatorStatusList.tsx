'use client'

import { useRealtimeEvaluators } from '@/lib/hooks/useRealtime'
import { Badge } from '@/components/ui/badge'

interface EvaluatorStatusListProps {
  isDarkBg?: boolean
  isHorizontal?: boolean
}

export default function EvaluatorStatusList({ isDarkBg = false, isHorizontal = false }: EvaluatorStatusListProps) {
  const { evaluators, loading } = useRealtimeEvaluators()

  if (loading) {
    return (
      <div className={`${isDarkBg ? 'text-purple-200' : 'text-gray-500'} text-sm`}>
        ⏳ Carregando avaliadores...
      </div>
    )
  }

  if (!evaluators || evaluators.length === 0) {
    return (
      <div className={`${isDarkBg ? 'text-purple-200' : 'text-gray-500'} text-sm`}>
        Nenhum avaliador cadastrado.
      </div>
    )
  }

  const onlineEvaluators = evaluators.filter(e => e.is_online)
  const offlineEvaluators = evaluators.filter(e => !e.is_online)

  if (isDarkBg) {
    // Versão para fundo escuro (live-dashboard)
    if (isHorizontal) {
      // Layout retangular - todos os avaliadores em uma única linha/wrap
      return (
        <div className="flex flex-wrap gap-2">
          {/* Avaliadores Online */}
          {onlineEvaluators.map((evaluator) => (
            <div
              key={evaluator.id}
              className="px-3 py-2 bg-[#00E676]/20 rounded-lg border border-[#00E676]/50 hover:border-[#00E676]/80 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-lg flex-shrink-0">🟢</span>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-[#00E676] truncate">{evaluator.name}</p>
                {evaluator.specialty && (
                  <p className="text-xs text-[#00E676]/70 truncate">{evaluator.specialty}</p>
                )}
              </div>
            </div>
          ))}

          {/* Avaliadores Offline */}
          {offlineEvaluators.map((evaluator) => (
            <div
              key={evaluator.id}
              className="px-3 py-2 bg-[#FF6B6B]/20 rounded-lg border border-[#FF6B6B]/50 hover:border-[#FF6B6B]/80 transition-all flex items-center gap-2 whitespace-nowrap opacity-75"
            >
              <span className="text-lg flex-shrink-0">🔴</span>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-[#FF6B6B] truncate">{evaluator.name}</p>
                {evaluator.specialty && (
                  <p className="text-xs text-[#FF6B6B]/70 truncate">{evaluator.specialty}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Layout vertical padrão
    return (
      <div className="space-y-3">
        {/* Avaliadores Online */}
        {onlineEvaluators.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-300 text-sm mb-2">
              🟢 Online ({onlineEvaluators.length})
            </h4>
            <div className="space-y-1">
              {onlineEvaluators.map((evaluator) => (
                <div
                  key={evaluator.id}
                  className="flex items-center justify-between p-2 bg-green-500/20 rounded border border-green-500/30"
                >
                  <div>
                    <p className="font-medium text-sm text-green-100">{evaluator.name}</p>
                    {evaluator.specialty && (
                      <p className="text-xs text-green-200/70">{evaluator.specialty}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="bg-green-500/40 text-green-100 border-green-400/50 text-xs">
                    Online
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avaliadores Offline */}
        {offlineEvaluators.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-300 text-sm mb-2">
              🔴 Offline ({offlineEvaluators.length})
            </h4>
            <div className="space-y-1">
              {offlineEvaluators.map((evaluator) => (
                <div
                  key={evaluator.id}
                  className="flex items-center justify-between p-2 bg-red-500/20 rounded border border-red-500/30 opacity-75"
                >
                  <div>
                    <p className="font-medium text-sm text-red-100">{evaluator.name}</p>
                    {evaluator.specialty && (
                      <p className="text-xs text-red-200/70">{evaluator.specialty}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="bg-red-500/40 text-red-100 border-red-400/50 text-xs">
                    Offline
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Versão padrão para fundo claro (dashboards normais)
  return (
    <div className="space-y-4">
      {/* Avaliadores Online */}
      {onlineEvaluators.length > 0 && (
        <div>
          <h3 className="font-semibold text-[#00E676] mb-2">
            🟢 Online ({onlineEvaluators.length})
          </h3>
          <div className="space-y-2">
            {onlineEvaluators.map((evaluator) => (
              <div
                key={evaluator.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-[#0A1E47]/50 to-[#001A4D]/50 rounded-lg border border-[#00E5FF]/30"
              >
                <div>
                  <p className="font-semibold text-sm text-white">{evaluator.name}</p>
                  {evaluator.specialty && (
                    <p className="text-xs text-[#00E5FF]/70">{evaluator.specialty}</p>
                  )}
                </div>
                <Badge variant="outline" className="bg-[#00E676]/30 text-[#00E676] border-[#00E676]/60">
                  Disponível
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avaliadores Offline */}
      {offlineEvaluators.length > 0 && (
        <div>
          <h3 className="font-semibold text-[#FF6B6B] mb-2">
            🔴 Offline ({offlineEvaluators.length})
          </h3>
          <div className="space-y-2">
            {offlineEvaluators.map((evaluator) => (
              <div
                key={evaluator.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-[#0A1E47]/50 to-[#001A4D]/50 rounded-lg border border-[#00E5FF]/30 opacity-75"
              >
                <div>
                  <p className="font-semibold text-sm text-white">{evaluator.name}</p>
                  {evaluator.specialty && (
                    <p className="text-xs text-[#00E5FF]/70">{evaluator.specialty}</p>
                  )}
                </div>
                <Badge variant="outline" className="bg-[#FF6B6B]/30 text-[#FF6B6B] border-[#FF6B6B]/60">
                  Indisponível
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
