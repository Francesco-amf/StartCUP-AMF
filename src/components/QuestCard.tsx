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
    <div className="bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40 rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 md:pb-4 border-b-2 border-[#00E5FF]/30">
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-bold text-[#00E5FF] mb-1">
            📝 Quest {questNumber}: {name}
          </h3>
          <p className="text-xs md:text-sm text-[#00E5FF]/70">{description}</p>
        </div>
        <div className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-lg p-2 md:p-3 whitespace-nowrap flex-shrink-0">
          <p className="text-xs md:text-sm text-[#00E5FF]/60 font-semibold">🪙 AMF Coins Máximos</p>
          <p className="text-xl md:text-2xl font-bold text-[#00FF88]">{maxPoints}</p>
        </div>
      </div>

      {/* Tipo de Entrega */}
      <div>
        <p className="text-sm md:text-base font-bold text-[#00E5FF] mb-2 flex items-center gap-1">
          📦 Tipo de Entrega
        </p>
        <div className="flex flex-wrap gap-2">
          {deliveryType.map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-2 bg-[#00E5FF]/20 text-[#00E5FF] text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full border border-[#00E5FF]/40 hover:bg-[#00E5FF]/30 transition"
            >
              {deliveryTypeEmojis[type] || '📦'}
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Requisitos */}
      <div>
        <p className="text-sm md:text-base font-bold text-[#00E5FF] mb-2 flex items-center gap-1">
          ✅ Requisitos
        </p>
        <ul className="space-y-2 md:space-y-2.5">
          {requirements.map((req, idx) => (
            <li key={idx} className="text-xs md:text-sm text-white/90 flex items-start gap-2">
              <span className="text-[#00FF88] font-bold min-w-fit flex-shrink-0 mt-0.5">•</span>
              <span className="break-words">{req}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Formatos Aceitos */}
      {acceptedFormats && acceptedFormats.length > 0 && (
        <div>
          <p className="text-sm md:text-base font-bold text-[#00E5FF] mb-2 flex items-center gap-1">
            📋 Formatos Aceitos
          </p>
          <div className="flex flex-wrap gap-2">
            {acceptedFormats.map((format) => (
              <span
                key={format}
                className="bg-[#00E5FF]/15 text-[#00E5FF] text-xs md:text-sm font-medium px-3 py-1.5 rounded-lg border border-[#00E5FF]/30 hover:bg-[#00E5FF]/25 transition"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Critérios de Avaliação */}
      <div>
        <p className="text-sm md:text-base font-bold text-[#00E5FF] mb-2 flex items-center gap-1">
          🎯 Critérios de Avaliação
        </p>
        <ul className="space-y-2 md:space-y-2.5">
          {evaluationCriteria.map((criterion, idx) => (
            <li key={idx} className="text-xs md:text-sm text-white/90 flex items-start gap-2">
              <span className="text-[#00FF88] font-bold min-w-fit flex-shrink-0 mt-0.5">✓</span>
              <span className="break-words">{criterion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Dicas */}
      <div className="bg-yellow-50/10 border-l-4 border-yellow-400/50 p-3 md:p-4 rounded-lg">
        <p className="text-sm md:text-base font-bold text-yellow-300 mb-2 flex items-center gap-1">
          💡 Dicas de Sucesso
        </p>
        <ul className="space-y-2 md:space-y-2.5">
          {tips.map((tip, idx) => (
            <li key={idx} className="text-xs md:text-sm text-yellow-200 flex items-start gap-2">
              <span className="text-yellow-300 font-bold min-w-fit flex-shrink-0 mt-0.5">→</span>
              <span className="break-words">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
