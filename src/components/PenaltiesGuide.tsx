import { Card } from '@/components/ui/card'

const PENALTIES_CONFIG = [
  {
    type: 'plagio',
    name: 'Plágio',
    icon: '⚠️',
    description: 'Uso de conteúdo de terceiros sem devida atribuição',
    deduction: '-50 a -100 pontos',
    when: 'Detectado durante avaliação',
    color: 'red'
  },
  {
    type: 'desorganizacao',
    name: 'Desorganização',
    icon: '📌',
    description: 'Entrega desorganizada ou com formatação inadequada',
    deduction: '-10 a -30 pontos',
    when: 'Identificado na submissão',
    color: 'orange'
  },
  {
    type: 'desrespeito',
    name: 'Desrespeito às Regras',
    icon: '🚫',
    description: 'Violação das regras do evento ou protocolo inadequado',
    deduction: '-20 a -50 pontos',
    when: 'Constatado pelos avaliadores',
    color: 'red'
  },
  {
    type: 'ausencia',
    name: 'Ausência',
    icon: '❌',
    description: 'Não comparecimento a atividades obrigatórias',
    deduction: '-30 a -100 pontos',
    when: 'Quando aplicável',
    color: 'red'
  },
  {
    type: 'atraso',
    name: 'Atraso na Entrega',
    icon: '⏰',
    description: 'Submissão após o prazo estabelecido',
    deduction: '-5 a -20 pontos',
    when: 'Submissão fora do horário',
    color: 'yellow'
  }
]

const colorClasses = {
  red: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  orange: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  yellow: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40'
}

const textColorClasses = {
  red: 'text-[#00E5FF]',
  orange: 'text-[#00E5FF]',
  yellow: 'text-[#00E5FF]'
}

const iconBgClasses = {
  red: 'bg-[#00E5FF]/20',
  orange: 'bg-[#00E5FF]/20',
  yellow: 'bg-[#00E5FF]/20'
}

export default function PenaltiesGuide() {
  return (
    <div>
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-[#00E5FF] mb-0.5">⚖️ Penalidades e Deduções</h3>
        <p className="text-xs text-[#00E5FF]/70">
          Conheça as possíveis penalidades que podem ser aplicadas às equipes.
          Evite-as seguindo rigorosamente as regras do evento!
        </p>
      </div>

      <div className="grid gap-2">
        {PENALTIES_CONFIG.map((penalty) => {
          const bgColor = colorClasses[penalty.color as keyof typeof colorClasses]
          const textColor = textColorClasses[penalty.color as keyof typeof textColorClasses]
          const iconBg = iconBgClasses[penalty.color as keyof typeof iconBgClasses]

          return (
            <Card
              key={penalty.type}
              className={`p-2 border-2 ${bgColor}`}
            >
              <div className="flex items-start gap-1">
                <div className={`text-lg ${iconBg} p-0.5 rounded-lg text-[#00E5FF] flex-shrink-0`}>
                  {penalty.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col items-start justify-between mb-0.5 gap-0.5">
                    <h4 className={`font-bold text-sm ${textColor}`}>
                      {penalty.name}
                    </h4>
                    <span className="text-xs font-bold text-[#FF3D00] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#FF3D00]/40 whitespace-nowrap">
                      {penalty.deduction}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mb-0.5">{penalty.description}</p>
                  <div className="flex items-start gap-1 text-xs">
                    <span className="font-semibold text-[#00E5FF]/60 min-w-fit flex-shrink-0">Quando:</span>
                    <span className="text-white/70">{penalty.when}</span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-2 p-2 bg-gradient-to-r from-[#0A1E47]/60 to-[#001A4D]/60 border-l-4 border-[#00E676]/60 rounded">
        <p className="text-xs font-semibold text-[#00E676] mb-1">✅ Como Evitar Penalidades</p>
        <ul className="text-xs text-white space-y-1">
          <li>✓ Sempre cite suas fontes e atribua créditos</li>
          <li>✓ Organize seu trabalho de forma clara e profissional</li>
          <li>✓ Respeite todos os prazos estabelecidos</li>
          <li>✓ Siga as orientações e protocolos do evento</li>
          <li>✓ Participe de todas as atividades obrigatórias</li>
        </ul>
      </div>
    </div>
  )
}
