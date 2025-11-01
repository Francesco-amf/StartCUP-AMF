'use client'

import { useRealtimeEvaluators } from '@/lib/hooks/useRealtime'

export default function EvaluatorCardsDisplay() {
  const { evaluators, loading } = useRealtimeEvaluators()

  if (loading) {
    return (
      <div className="text-center text-[#00E5FF]/60">
        ⏳ Carregando avaliadores...
      </div>
    )
  }

  if (!evaluators || evaluators.length === 0) {
    return (
      <div className="text-center text-[#00E5FF]/60">
        Nenhum avaliador cadastrado.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="region" aria-label="Evaluators status grid">
      {evaluators.map((evaluator) => (
        <div
          key={evaluator.id}
          className={`p-5 rounded-lg border-2 transition-all ${
            evaluator.is_online
              ? 'bg-[#00E676]/10 border-[#00E676]/50 hover:border-[#00E676]/80 hover:shadow-lg hover:shadow-[#00E676]/20'
              : 'bg-[#FF6B6B]/10 border-[#FF6B6B]/50 hover:border-[#FF6B6B]/80 hover:shadow-lg hover:shadow-[#FF6B6B]/20 opacity-75'
          }`}
          role="article"
          aria-label={`${evaluator.name} - ${evaluator.is_online ? 'Online' : 'Offline'}${evaluator.specialty ? ` - ${evaluator.specialty}` : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-base truncate ${
                evaluator.is_online ? 'text-[#00E676]' : 'text-[#FF6B6B]'
              }`}>
                {evaluator.name}
              </h4>
              {evaluator.specialty && (
                <p className={`text-xs truncate ${
                  evaluator.is_online ? 'text-[#00E676]/70' : 'text-[#FF6B6B]/70'
                }`}>
                  {evaluator.specialty}
                </p>
              )}
            </div>
            <span className="text-2xl ml-2">{evaluator.is_online ? '🟢' : '🔴'}</span>
          </div>

          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Status:</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                evaluator.is_online
                  ? 'bg-[#00E676]/30 text-[#00E676]'
                  : 'bg-[#FF6B6B]/30 text-[#FF6B6B]'
              }`}>
                {evaluator.is_online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
