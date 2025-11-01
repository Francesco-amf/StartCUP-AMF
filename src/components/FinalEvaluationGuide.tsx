import { Card } from '@/components/ui/card'

const EVALUATION_CRITERIA = [
  {
    criterion: 'Viabilidade',
    percentage: 30,
    description: 'Análise da viabilidade técnica, econômica e operacional da solução',
    icon: '✅'
  },
  {
    criterion: 'Inovação',
    percentage: 20,
    description: 'Grau de inovação e criatividade da solução apresentada',
    icon: '💡'
  },
  {
    criterion: 'Qualidade da Apresentação',
    percentage: 10,
    description: 'Clareza, profissionalismo e impacto do pitch final',
    icon: '🎯'
  }
]

const PHASE_POINTS = [
  { phase: 'Fase 1: Descoberta', questPoints: 200, bossPoints: '0-100', color: 'blue' },
  { phase: 'Fase 2: Criação', questPoints: 300, bossPoints: '0-100', color: 'purple' },
  { phase: 'Fase 3: Estratégia', questPoints: 200, bossPoints: '0-100', color: 'green' },
  { phase: 'Fase 4: Refinamento', questPoints: 150, bossPoints: '0-100', color: 'yellow' },
  { phase: 'Fase 5: Pitch Final', questPoints: 150, bossPoints: '0-200', color: 'red' }
]

const colorClasses = {
  blue: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40 text-[#00E5FF]',
  purple: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40 text-[#00E5FF]',
  green: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40 text-[#00E5FF]',
  yellow: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40 text-[#00E5FF]',
  red: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40 text-[#00E5FF]'
}

const progressColors = {
  blue: 'bg-[#00E5FF]',
  purple: 'bg-[#00E5FF]',
  green: 'bg-[#00E5FF]',
  yellow: 'bg-[#00E5FF]',
  red: 'bg-[#00E5FF]'
}

export default function FinalEvaluationGuide() {
  const totalQuestPoints = PHASE_POINTS.reduce((sum, phase) => sum + phase.questPoints, 0)
  const maxBossPoints = 100 + 100 + 100 + 100 + 200 // Fases 1-5
  const maxBasePoints = totalQuestPoints + maxBossPoints
  const maxWithMultiplier = maxBasePoints * 2

  return (
    <div>
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-[#00E5FF] mb-1">🏆 Avaliação Final e Pontuação</h3>
        <p className="text-xs text-[#00E5FF]/70">
          Entenda como sua solução será avaliada e o potencial máximo de pontos.
        </p>
      </div>

      {/* Total Score Summary */}
      <div className="grid gap-2 mb-2 grid-cols-1">
        <Card className="p-2 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-[#00E5FF]">Quests</p>
            <span className="text-lg">📝</span>
          </div>
          <p className="text-sm font-bold text-[#00E5FF]">{totalQuestPoints}</p>
          <p className="text-xs text-white/70">Entregas das fases</p>
        </Card>

        <Card className="p-2 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-[#00E5FF]">Boss Battles</p>
            <span className="text-lg">⚔️</span>
          </div>
          <p className="text-sm font-bold text-[#00E5FF]">0-{maxBossPoints}</p>
          <p className="text-xs text-white/70">Pitches de fase + Final</p>
        </Card>

        <Card className="p-2 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-[#00E5FF]">Com Multiplicador</p>
            <span className="text-lg">⚡</span>
          </div>
          <p className="text-sm font-bold text-[#00E5FF]">até {maxWithMultiplier}</p>
          <p className="text-xs text-white/70">Base × até 2x</p>
        </Card>
      </div>

      {/* Multiplicador */}
      <div className="mb-2 p-2 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0">⚡</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-1 text-xs">Multiplicador de Pontos (até 2x)</h4>
            <p className="text-xs text-gray-700 mb-1">
              Ao avaliar cada quest, o avaliador atribui os pontos e pode aplicar um multiplicador de até 2x conforme a qualidade da entrega:
            </p>
            <div className="space-y-1">
              <div className="text-xs">
                <p className="font-semibold text-gray-900 mb-1">Exemplos de aplicação:</p>
                <ul className="space-y-1 text-gray-700">
                  <li>• Quest de 100 pts avaliada com 1.0x = <strong>100 pontos</strong></li>
                  <li>• Quest de 100 pts avaliada com 1.5x = <strong>150 pontos</strong></li>
                  <li>• Quest de 100 pts avaliada com 2.0x = <strong>200 pontos</strong> (máximo)</li>
                  <li>• Quest de 50 pts avaliada com 2.0x = <strong>100 pontos</strong> (máximo)</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-0.5 italic">
              O multiplicador reflete a qualidade geral da entrega conforme critério do avaliador
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Criteria Weights */}
      <div className="mb-2">
        <h4 className="text-sm font-bold text-[#00E5FF] mb-2">⚖️ Peso dos Componentes na Avaliação Final</h4>
        <div className="space-y-2">
          {/* Fases */}
          <Card className="p-2 border-2 bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40">
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">🎮</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col items-start justify-between mb-1 gap-1">
                  <h5 className="font-semibold text-[#00E5FF] text-sm">Desempenho nas Fases</h5>
                  <span className="text-xs font-bold bg-[#00E5FF]/20 text-[#00E5FF] px-2 py-0.5 rounded-full border border-[#00E5FF]/40 whitespace-nowrap">
                    40% do peso
                  </span>
                </div>
                <p className="text-xs text-white/80">Quests + Boss Battles completadas durante as 5 fases</p>
              </div>
            </div>
          </Card>

          {/* Critérios */}
          {EVALUATION_CRITERIA.map((item) => (
            <Card key={item.criterion} className="p-2 border-2 bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40">
              <div className="flex items-start gap-2 mb-1">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col items-start justify-between mb-1 gap-1">
                    <h5 className="font-semibold text-[#00E5FF] text-sm">{item.criterion}</h5>
                    <span className="text-xs font-bold bg-[#00E5FF]/20 text-[#00E5FF] px-2 py-0.5 rounded-full border border-[#00E5FF]/40 whitespace-nowrap">
                      {item.percentage}% do peso
                    </span>
                  </div>
                  <p className="text-xs text-white/80">{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="grid gap-1">
        <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-xs font-semibold text-yellow-900 mb-1">⚠️ Cuidado com Penalidades</p>
          <ul className="text-xs text-yellow-800 space-y-1">
            <li>• Penalidades reduzem seus pontos totais</li>
            <li>• Plagio resulta em deduções severas (-50 a -100 pontos)</li>
            <li>• Atraso na entrega resulta em perdas (-5 a -20 pontos)</li>
            <li>• Respeite todas as regras para proteger sua pontuação</li>
          </ul>
        </div>

        <div className="p-2 bg-green-50 border-l-4 border-green-400 rounded">
          <p className="text-xs font-semibold text-green-900 mb-1">🎯 Estratégia para Maximizar Pontos</p>
          <ul className="text-xs text-green-800 space-y-1">
            <li>✓ Complete todas as quests de forma qualitativa para garantir os {totalQuestPoints} pts</li>
            <li>✓ Dedique tempo aos boss battles (pitches) para ganhar pontos extras</li>
            <li>✓ Foque em Viabilidade, Inovação e Qualidade da Apresentação</li>
            <li>✓ Use power-ups estrategicamente para recuperar pontos se necessário</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
