import { Card } from '@/components/ui/card'

const PHASE_RULES = {
  0: {
    name: 'Preparação',
    icon: '⏸️',
    description: 'Fase preparatória - evento ainda não começou',
    rules: [
      'Estude as instruções e requisitos',
      'Prepare seu ambiente de trabalho',
      'Forme seu time e defina as responsabilidades',
      'Revise os recursos disponibilizados'
    ],
    tips: 'Use este tempo para planejar sua estratégia para as próximas fases!'
  },
  1: {
    name: 'Fase 1: Descoberta',
    icon: '🔍',
    description: 'Exploração e análise do problema',
    rules: [
      'Duração: 2 horas e 30 minutos',
      'AMF Coins máximos: 200',
      'Foco em compreender o contexto e requisitos',
      'Entrega: Análise detalhada ou documento de pesquisa'
    ],
    tips: 'Documente todas as suas descobertas para referência nas próximas fases.'
  },
  2: {
    name: 'Fase 2: Criação',
    icon: '💡',
    description: 'Desenvolvimento da solução',
    rules: [
      'Duração: 3 horas e 30 minutos',
      'AMF Coins máximos: 300',
      'Crie soluções inovadoras baseadas na Fase 1',
      'Entrega: Protótipo, código, design ou documento criativo'
    ],
    tips: 'Qualidade é mais importante que quantidade. Foque em soluções viáveis!'
  },
  3: {
    name: 'Fase 3: Estratégia',
    icon: '📊',
    description: 'Planejamento e estratégia de implementação',
    rules: [
      'Duração: 2 horas e 30 minutos',
      'AMF Coins máximos: 200',
      'Defina plano de implementação e estratégia',
      'Entrega: Documento estratégico ou plano de ação'
    ],
    tips: 'Considere os recursos disponíveis e a viabilidade do seu plano.'
  },
  4: {
    name: 'Fase 4: Refinamento',
    icon: '✨',
    description: 'Polimento e optimização da solução',
    rules: [
      'Duração: 2 horas',
      'AMF Coins máximos: 150',
      'Refine e otimize a solução criada',
      'Entrega: Versão final melhorada da solução'
    ],
    tips: 'Revise detalhes, corrija erros e melhore a apresentação!'
  },
  5: {
    name: 'Fase 5: Pitch Final',
    icon: '🎯',
    description: 'Apresentação final da solução',
    rules: [
      'Duração: 1 hora e 30 minutos',
      'AMF Coins máximos: 150',
      'Apresente sua solução de forma persuasiva',
      'Critérios: Viabilidade, Inovação, Qualidade da Apresentação'
    ],
    tips: 'Pratique sua apresentação e antecipe possíveis perguntas!'
  }
}

interface PhaseRulesCardProps {
  currentPhase: number
}

export default function PhaseRulesCard({ currentPhase }: PhaseRulesCardProps) {
  const phase = PHASE_RULES[currentPhase as keyof typeof PHASE_RULES] || PHASE_RULES[0]

  return (
    <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-purple-900">
            {phase.icon} {phase.name}
          </h2>
          <span className="text-sm font-semibold bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
            Fase {currentPhase}
          </span>
        </div>
        <p className="text-purple-700">{phase.description}</p>
      </div>

      <div className="space-y-4">
        {/* Regras */}
        <div>
          <h3 className="font-semibold text-purple-900 mb-2">📋 Regras desta Fase</h3>
          <ul className="space-y-2">
            {phase.rules.map((rule, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-2 bg-white/50 rounded border border-purple-100"
              >
                <span className="font-bold text-purple-600 min-w-fit">✓</span>
                <span className="text-purple-800 text-sm">{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dica */}
        <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-sm font-semibold text-blue-900 mb-1">💡 Dica</p>
          <p className="text-sm text-blue-800">{phase.tips}</p>
        </div>

        {/* Geral */}
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm font-semibold text-yellow-900 mb-2">⚡ Lembretes Importantes</p>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Respeite o prazo de entrega da fase</li>
            <li>• Verifique se sua entrega atende todos os requisitos</li>
            <li>• Use os power-ups estrategicamente se precisar de ajuda</li>
            <li>• Evite penalidades mantendo qualidade e organização</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
