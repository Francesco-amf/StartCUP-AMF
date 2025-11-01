interface QuestCardProps {
  questNumber: number
  name: string
  description: string
  maxPoints: number
  deliveryType: string[]
  requirements: string[]
  acceptedFormats?: string[]
  tips: string[]
  evaluationCriteria: string[]
}

export default function QuestCard({
  questNumber,
  name,
  description,
  maxPoints,
  deliveryType,
  requirements,
  acceptedFormats,
  tips,
  evaluationCriteria
}: QuestCardProps) {
  const deliveryTypeEmojis: { [key: string]: string } = {
    'file': '📄',
    'text': '📝',
    'url': '🔗'
  }

  return (
    <div className="bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-2 border-[#00E5FF]/40 rounded-lg p-1 space-y-1">
      {/* Cabeçalho */}
      <div className="flex flex-col items-start justify-between pb-1 border-b-2 border-[#00E5FF]/30 gap-1">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#00E5FF]">
            Quest {questNumber}: {name}
          </h3>
          <p className="text-xs text-[#00E5FF]/70 mt-0.5">{description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-[#00E5FF]/60 font-semibold">Pontos</p>
          <p className="text-sm font-bold text-[#00E5FF]">{maxPoints}</p>
        </div>
      </div>

      {/* Tipo de Entrega */}
      <div>
        <p className="text-xs font-semibold text-[#00E5FF] mb-0.5">📦 Tipo de Entrega</p>
        <div className="flex flex-wrap gap-1">
          {deliveryType.map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-1 bg-[#00E5FF]/20 text-[#00E5FF] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#00E5FF]/40"
            >
              {deliveryTypeEmojis[type] || '📦'} {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {/* Requisitos */}
      <div>
        <p className="text-xs font-semibold text-[#00E5FF] mb-0.5">✅ Requisitos</p>
        <ul className="space-y-0.5">
          {requirements.map((req, idx) => (
            <li key={idx} className="text-xs text-white flex items-start gap-1">
              <span className="text-[#00E5FF] font-bold min-w-fit flex-shrink-0">•</span>
              <span className="break-words">{req}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Formatos Aceitos */}
      {acceptedFormats && acceptedFormats.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#00E5FF] mb-0.5">📋 Formatos Aceitos</p>
          <div className="flex flex-wrap gap-1">
            {acceptedFormats.map((format) => (
              <span
                key={format}
                className="bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-medium px-2 py-0.5 rounded-full border border-[#00E5FF]/30"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Critérios de Avaliação */}
      <div>
        <p className="text-xs font-semibold text-[#00E5FF] mb-0.5">🎯 Critérios de Avaliação</p>
        <ul className="space-y-0.5">
          {evaluationCriteria.map((criterion, idx) => (
            <li key={idx} className="text-xs text-white flex items-start gap-1">
              <span className="text-[#00E676] font-bold min-w-fit flex-shrink-0">✓</span>
              <span className="break-words">{criterion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Dicas */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-1 rounded">
        <p className="text-xs font-semibold text-yellow-900 mb-0.5">💡 Dicas de Sucesso</p>
        <ul className="space-y-0.5">
          {tips.map((tip, idx) => (
            <li key={idx} className="text-xs text-yellow-800 flex items-start gap-1">
              <span className="min-w-fit flex-shrink-0">→</span>
              <span className="break-words">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
