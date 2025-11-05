interface CurrentQuestCardProps {
  quest?: {
    name: string
    description: string
    max_points: number
  }
  phase: {
    name: string
    icon: string
  }
  isEventStarted: boolean
}

export default function CurrentQuestCard({
  quest,
  phase,
  isEventStarted
}: CurrentQuestCardProps) {
  if (!isEventStarted) {
    return (
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-6 rounded-lg border-2 border-[#00E5FF]/20300">
        <h2 className="text-2xl font-bold mb-4 text-[#00E5FF]/70">
          {phase.icon} {phase.name}
        </h2>
        <p className="text-[#00E5FF]/70">
          O evento ainda não começou. Aguarde o início para ver as quests disponíveis!
        </p>
      </div>
    )
  }

  if (!quest) {
    return (
      <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
        <h2 className="text-2xl font-bold mb-4 text-yellow-800">
          {phase.icon} {phase.name}
        </h2>
        <p className="text-yellow-700">
          Nenhuma quest definida para esta fase ainda. Aguarde atualizações do admin!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-100 to-[#001A4D] p-6 rounded-lg border-2 border-[#00E5FF]/30300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#00E5FF]900 mb-2">
            {phase.icon} {phase.name}
          </h2>
          <h3 className="text-xl font-bold text-[#00E5FF]700">
            📋 {quest.name}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-[#00E5FF]600 font-semibold">AMF Coins Máximos</p>
          <p className="text-3xl font-bold text-[#00E5FF]900">{quest.max_points}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-[#00E5FF]600 font-semibold mb-1">Descrição</p>
          <p className="text-[#00E5FF]800">{quest.description}</p>
        </div>

        <div className="bg-[#0A1E47]/50 p-3 rounded border border-[#00E5FF]/30200">
          <p className="text-xs text-[#00E5FF]600 font-semibold mb-2">📌 Dicas</p>
          <ul className="text-sm text-[#00E5FF]700 space-y-1">
            <li>• Concentre-se em qualidade ao invés de quantidade</li>
            <li>• Siga rigorosamente as especificações</li>
            <li>• Revise seu trabalho antes de enviar</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
