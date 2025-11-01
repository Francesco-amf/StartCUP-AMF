import { Card } from '@/components/ui/card'

const POWERUPS_CONFIG = [
  {
    type: 'mentoria',
    name: 'Mentoria',
    icon: '👨‍🏫',
    description: 'Receba orientação personalizada de um avaliador especialista',
    effect: 'Feedback direcionado para melhorar sua solução',
    limit: '1 por fase',
    color: 'purple'
  },
  {
    type: 'dica',
    name: 'Dica',
    icon: '💡',
    description: 'Obtenha uma dica valiosa para resolver o desafio',
    effect: 'Pista estratégica para sua abordagem',
    limit: '1 por fase',
    color: 'yellow'
  },
  {
    type: 'validacao',
    name: 'Validação',
    icon: '✅',
    description: 'Tenha sua solução validada antes do envio final',
    effect: 'Verificação de conformidade com os requisitos',
    limit: '1 por fase',
    color: 'green'
  },
  {
    type: 'checkpoint',
    name: 'Checkpoint',
    icon: '🎯',
    description: 'Faça uma revisão intermediária do seu progresso',
    effect: 'Feedback sobre o progresso atual',
    limit: '1 por fase',
    color: 'blue'
  }
]

const colorClasses = {
  purple: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  yellow: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  green: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  blue: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40'
}

const textColorClasses = {
  purple: 'text-[#00E5FF]',
  yellow: 'text-[#00E5FF]',
  green: 'text-[#00E5FF]',
  blue: 'text-[#00E5FF]'
}

export default function PowerUpsGuide() {
  return (
    <div>
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-[#00E5FF] mb-0.5">⚡ Como Funcionam os Power-ups</h3>
        <p className="text-xs text-[#00E5FF]/70">
          Seu time tem direito a usar até 4 power-ups durante todo o evento, no máximo 1 por fase.
          Use-os estrategicamente para maximizar suas chances de sucesso!
        </p>
      </div>

      <div className="grid gap-2">
        {POWERUPS_CONFIG.map((powerup) => {
          const bgColor = colorClasses[powerup.color as keyof typeof colorClasses]
          const textColor = textColorClasses[powerup.color as keyof typeof textColorClasses]

          return (
            <Card
              key={powerup.type}
              className={`p-2 border-2 ${bgColor}`}
            >
              <div className="flex items-start gap-1">
                <span className="text-lg flex-shrink-0">{powerup.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col items-start justify-between mb-0.5 gap-0.5">
                    <h4 className={`font-bold text-sm ${textColor}`}>
                      {powerup.name}
                    </h4>
                    <span className="text-xs font-semibold bg-[#00E5FF]/20 text-[#00E5FF] px-2 py-0.5 rounded border border-[#00E5FF]/40 whitespace-nowrap">
                      {powerup.limit}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mb-0.5">{powerup.description}</p>
                  <div className="flex items-start gap-1">
                    <span className="text-xs font-semibold text-[#00E5FF]/60 min-w-fit flex-shrink-0">Efeito:</span>
                    <span className="text-xs text-white/70">{powerup.effect}</span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-2 p-2 bg-gradient-to-r from-[#0A1E47]/60 to-[#001A4D]/60 border-l-4 border-[#00E5FF]/60 rounded">
        <p className="text-xs font-semibold text-[#00E5FF] mb-1">💡 Dica Estratégica</p>
        <p className="text-xs text-white">
          Não use todos os power-ups na primeira fase. Reserve-os para quando realmente precisar de ajuda em desafios mais difíceis!
        </p>
      </div>
    </div>
  )
}
