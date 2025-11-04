import QuestCard from '@/components/QuestCard'
import { type Quest } from '@/lib/types' // Assuming you have a types file

interface PhaseDetailsCardProps {
  currentQuest: Quest | null
  currentPhaseNumber: number
}

const PHASES_DETAILED = {
  0: {
    name: 'Preparação',
    icon: '⏸️',
    description: 'Fase preparatória - evento ainda não começou',
    color: 'gray',
    maxPoints: 0,
    quests: []
  },
  1: {
    name: 'DESCOBERTA',
    icon: '🧭',
    description: 'Entender o mercado e o cliente',
    color: 'blue',
    maxPoints: 200,
    quests: [
      {
        questNumber: 1,
        name: 'Conhecendo o Terreno',
        description: 'Análise do mercado através da técnica TAM (Total Addressable Market), SAM (Serviceable Available Market) e SOM (Serviceable Obtainable Market)',
        maxPoints: 100,
        deliveryType: ['file'],
        requirements: [
          'Análise do mercado através de TAM/SAM/SOM',
          'Estimativas de tamanho do mercado em faturamento',
          'Mapa visual com potencial de mercado'
        ],
        acceptedFormats: ['PDF', 'PPTX', 'Mapa Visual'],
        tips: [
          'Use dados concretos e estatísticas de mercado',
          'Faça cálculos realistas de TAM',
          'Apresente de forma visual e clara'
        ],
        evaluationCriteria: [
          'Profundidade da análise de mercado',
          'Exatidão dos números apresentados',
          'Clareza da apresentação visual'
        ]
      },
      {
        questNumber: 2,
        name: 'A Persona Secreta',
        description: 'Definir o público-alvo da startup por meio da definição da persona',
        maxPoints: 50,
        deliveryType: ['file', 'text'],
        requirements: [
          'Definição clara da persona',
          'Identificação dos pain points (pontos de dor)',
          'Contatos de 10+ pessoas para validação',
          'Perfil detalhado do público-alvo'
        ],
        acceptedFormats: ['PDF', 'DOCX', 'Visual Card'],
        tips: [
          'Crie uma persona realista e detalhada',
          'Identifique ao menos 5 pain points principais',
          'Prepare lista de contatos reais para validação',
          'Use nome e características específicas'
        ],
        evaluationCriteria: [
          'Especificidade e realismo da persona',
          'Clareza dos pain points identificados',
          'Qualidade da lista de contatos para validação'
        ]
      },
      {
        questNumber: 3,
        name: 'Construindo Pontes',
        description: 'Estratégia de relacionamento com o público-alvo e canais de distribuição',
        maxPoints: 50,
        deliveryType: ['file'],
        requirements: [
          'Estratégia de relacionamento definida',
          'Canais de distribuição identificados',
          'Mapa da jornada do cliente',
          'Pontos de contato com o cliente'
        ],
        acceptedFormats: ['PDF', 'Journey Map Visual', 'PPTX'],
        tips: [
          'Mapeie todos os touchpoints com o cliente',
          'Identifique 2-3 canais principais de distribuição',
          'Visualize a jornada do problema à solução',
          'Considere diferentes fases da jornada'
        ],
        evaluationCriteria: [
          'Completude do mapa de jornada',
          'Viabilidade dos canais de distribuição',
          'Clareza dos pontos de contato'
        ]
      }
    ]
  },
  2: {
    name: 'CRIAÇÃO',
    icon: '💡',
    description: 'Desenvolver a solução',
    color: 'purple',
    maxPoints: 300,
    quests: [
      {
        questNumber: 1,
        name: 'A Grande Ideia',
        description: 'Proposta de valor única + Business Model Canvas preenchido',
        maxPoints: 100,
        deliveryType: ['file', 'text'],
        requirements: [
          'Proposta de valor única e clara',
          'Canvas completo (9 blocos preenchidos)',
          'Tagline memorável',
          'Diferenciação clara do mercado'
        ],
        acceptedFormats: ['Canvas PDF', 'PPTX', 'Canvas Visual'],
        tips: [
          'A proposta de valor deve ser uma frase simples',
          'Complete todos os 9 blocos do Canvas',
          'Crie um tagline único e memorável',
          'Deixe claro o diferencial da solução'
        ],
        evaluationCriteria: [
          'Clareza da proposta de valor',
          'Completude do Canvas',
          'Originalidade do tagline',
          'Diferenciação competitiva'
        ]
      },
      {
        questNumber: 2,
        name: 'Identidade Secreta',
        description: 'Nome e logotipo da startup',
        maxPoints: 50,
        deliveryType: ['file'],
        requirements: [
          'Nome único e memorável',
          'Logotipo profissional',
          'Justificativa do nome/logo',
          'Identidade visual consistente'
        ],
        acceptedFormats: ['Logo PNG/SVG', 'Design PPTX', 'PDF'],
        tips: [
          'O nome deve refletir a essência da startup',
          'Logo deve ser reconhecível e simples',
          'Considere domínios disponíveis',
          'Teste o nome com a persona'
        ],
        evaluationCriteria: [
          'Memorabilidade do nome',
          'Qualidade do design do logo',
          'Coerência com a proposta de valor'
        ]
      },
      {
        questNumber: 3,
        name: 'Prova de Conceito',
        description: 'Protótipo navegável da solução (Figma/slides/demo)',
        maxPoints: 150,
        deliveryType: ['url', 'file'],
        requirements: [
          'Protótipo funcional e navegável',
          'Fluxo principal de usuário completo',
          'Interface clara e profissional',
          'Compatível com a proposta de valor',
          'Documentação do protótipo'
        ],
        acceptedFormats: ['Figma Link', 'InVision', 'Video Demo', 'HTML/CSS'],
        tips: [
          'Foco no fluxo principal, não em tudo',
          'Interface deve ser intuitiva',
          'Use cores e design consistente',
          'Prepare para apresentar e iterar',
          'Documente as telas principais'
        ],
        evaluationCriteria: [
          'Funcionalidade do protótipo',
          'Usabilidade da interface',
          'Qualidade visual',
          'Alinhamento com proposta de valor'
        ]
      }
    ]
  },
  3: {
    name: 'ESTRATÉGIA',
    icon: '🎯',
    description: 'Planejar a operação',
    color: 'orange',
    maxPoints: 200,
    quests: [
      {
        questNumber: 1,
        name: 'Montando o Exército',
        description: 'Identificar as atividades-chave e recursos necessários',
        maxPoints: 50,
        deliveryType: ['file'],
        requirements: [
          'Mapa de operações detalhado',
          'Atividades-chave identificadas',
          'Recursos necessários listados',
          'Responsabilidades definidas'
        ],
        acceptedFormats: ['PDF Mapa', 'PPTX', 'Diagrama Visual'],
        tips: [
          'Mapeia cada processo de forma clara',
          'Identifique 5-7 atividades principais',
          'Defina quem faz o quê',
          'Liste recursos de forma específica'
        ],
        evaluationCriteria: [
          'Clareza das operações',
          'Completude do mapa',
          'Realismo da estrutura'
        ]
      },
      {
        questNumber: 2,
        name: 'Aliados Estratégicos',
        description: 'Definir 2 parceiros-chave',
        maxPoints: 50,
        deliveryType: ['file', 'text'],
        requirements: [
          '2 parceiros-chave identificados',
          'Proposta de valor para cada parceiro',
          'Estrutura de relacionamento',
          'Benefício mútuo definido'
        ],
        acceptedFormats: ['PDF', 'DOCX', 'PPTX'],
        tips: [
          'Escolha parceiros que complementam',
          'Explique por que cada parceria',
          'Defina o que cada parte ganha',
          'Seja realista sobre viabilidade'
        ],
        evaluationCriteria: [
          'Relevância dos parceiros',
          'Clareza do benefício mútuo',
          'Viabilidade da parceria'
        ]
      },
      {
        questNumber: 3,
        name: 'Show Me The Money',
        description: 'Estrutura de custos e receitas + Indicadores financeiros',
        maxPoints: 100,
        deliveryType: ['file'],
        requirements: [
          'Estrutura de custos detalhada',
          'Modelo de receitas definido',
          'Estratégia de precificação',
          'Indicadores financeiros (Burn Rate, CAC, LTV)',
          'Dashboard financeiro simplificado'
        ],
        acceptedFormats: ['Excel/Sheets', 'PDF', 'Dashboard Visual'],
        tips: [
          'Estruture custos por categoria',
          'Defina múltiplas fontes de receita',
          'Pesquise preços do mercado',
          'Calcule Burn Rate realista',
          'Mostre números em gráficos'
        ],
        evaluationCriteria: [
          'Realismo dos números',
          'Clareza do modelo financeiro',
          'Viabilidade econômica',
          'Qualidade dos indicadores'
        ]
      }
    ]
  },
  4: {
    name: 'REFINAMENTO',
    icon: '✨',
    description: 'Polir e validar',
    color: 'green',
    maxPoints: 150,
    quests: [
      {
        questNumber: 1,
        name: 'Teste de Fogo',
        description: 'Simular uso do produto + Identificar falhas e melhorar',
        maxPoints: 50,
        deliveryType: ['file'],
        requirements: [
          'Simulação de uso completa',
          'Falhas identificadas documentadas',
          'Melhorias propostas',
          'Versão 2.0 do protótipo',
          'Relatório de testes'
        ],
        acceptedFormats: ['PDF Relatório', 'Video Demo', 'PPTX'],
        tips: [
          'Teste com usuários reais se possível',
          'Documente cada problema encontrado',
          'Priorize melhorias de impacto',
          'Implemente as principais correções',
          'Compare antes e depois'
        ],
        evaluationCriteria: [
          'Qualidade dos testes realizados',
          'Relevância das melhorias',
          'Evidência de iteração'
        ]
      },
      {
        questNumber: 2,
        name: 'Validação de Mercado',
        description: 'Pesquisa rápida com 5+ pessoas',
        maxPoints: 50,
        deliveryType: ['file'],
        requirements: [
          'Contatos com 5+ pessoas validados',
          'Feedback coletado e documentado',
          'Insights de mercado',
          'Ajustes baseados em validação',
          'Relatório de validação'
        ],
        acceptedFormats: ['PDF Relatório', 'Pesquisa Documentada', 'PPTX'],
        tips: [
          'Fale com pessoas além do seu círculo',
          'Faça perguntas abertas',
          'Ouça mais do que fale',
          'Documente exatamente o que ouviu',
          'Identifique padrões nos feedbacks'
        ],
        evaluationCriteria: [
          'Quantidade de validações',
          'Qualidade dos insights',
          'Aplicação do feedback'
        ]
      },
      {
        questNumber: 3,
        name: 'Números que Convencem',
        description: 'Refinar projeções financeiras',
        maxPoints: 50,
        deliveryType: ['file'],
        requirements: [
          'Projeções financeiras refinadas',
          'Cenários (pessimista, realista, otimista)',
          'Planilha de viabilidade',
          'Break-even definido',
          'Plano de captação de recursos'
        ],
        acceptedFormats: ['Excel/Sheets', 'PDF', 'Dashboard'],
        tips: [
          'Atualize com dados de validação',
          'Crie 3 cenários diferentes',
          'Calcule when do break-even',
          'Defina quanto capital é necessário',
          'Mostre ROI esperado'
        ],
        evaluationCriteria: [
          'Realismo das projeções',
          'Qualidade da análise',
          'Viabilidade comprovada'
        ]
      }
    ]
  },
  5: {
    name: 'PITCH DEFINITIVO',
    icon: '🚀',
    description: 'Criar apresentação matadora',
    color: 'red',
    maxPoints: 150,
    quests: [
      {
        questNumber: 1,
        name: 'A História Épica',
        description: 'Estruturar narrativa do pitch (Pitch de 5 minutos)',
        maxPoints: 75,
        deliveryType: ['file'],
        requirements: [
          'Narrativa clara e envolvente',
          'Hook forte nos primeiros 30s',
          'Estrutura: Problema > Solução > Mercado > Time',
          'Pitch cronometrado em 5 minutos',
          'Storyline documentada'
        ],
        acceptedFormats: ['PDF Script', 'DOCX', 'Video'],
        tips: [
          'Comece com um problema real',
          'Use linguagem simples e direta',
          'Mostre paixão pelo projeto',
          'Termine com call to action',
          'Pratique o timing'
        ],
        evaluationCriteria: [
          'Clareza da narrativa',
          'Impacto emocional',
          'Estrutura lógica'
        ]
      },
      {
        questNumber: 2,
        name: 'Slides de Impacto',
        description: 'Criar apresentação visual',
        maxPoints: 50,
        deliveryType: ['file', 'url'],
        requirements: [
          'Deck completo (7-10 slides)',
          'Sequência: Capa > Problema > Solução > Mercado > Faturamento > Time > Livre',
          'Design profissional e consistente',
          'Dados visuais e gráficos',
          'Mensagem clara por slide'
        ],
        acceptedFormats: ['PPTX', 'Google Slides Link', 'PDF'],
        tips: [
          'Um conceito por slide',
          'Use imagens e dados visuais',
          'Fonts e cores consistentes',
          'Texto mínimo, máximo visual',
          'Pratique a transição entre slides'
        ],
        evaluationCriteria: [
          'Qualidade visual do deck',
          'Clareza das mensagens',
          'Profissionalismo'
        ]
      },
      {
        questNumber: 3,
        name: 'Ensaio Geral',
        description: 'Treinar pitch e ajustar timing',
        maxPoints: 25,
        deliveryType: ['file'],
        requirements: [
          'Pitch gravado (5 minutos exatos)',
          'Respostas a perguntas preparadas',
          'Timing ajustado',
          'Confiança e naturalidade',
          'Video ou relatório de ensaio'
        ],
        acceptedFormats: ['Video MP4', 'PDF Notas', 'Link Youtube'],
        tips: [
          'Grave várias vezes até perfeito',
          'Pratique com amigos/mentores',
          'Estude objeções comuns',
          'Prepare respostas curtas e assertivas',
          'Trabalhe linguagem corporal'
        ],
        evaluationCriteria: [
          'Segurança na apresentação',
          'Respeito ao timing',
          'Qualidade das respostas'
        ]
      }
    ]
  }
}

const colorClasses = {
  gray: 'bg-[#0A1E47]/40 border-[#00E5FF]/30',
  blue: 'bg-[#0A1E47]/40 border-[#00E5FF]/30',
  purple: 'bg-[#0A1E47]/40 border-[#00E5FF]/30',
  orange: 'bg-[#0A1E47]/40 border-[#00E5FF]/30',
  green: 'bg-[#0A1E47]/40 border-[#00E5FF]/30',
  red: 'bg-[#0A1E47]/40 border-[#00E5FF]/30'
}

const textColorClasses = {
  gray: 'text-[#00E5FF]',
  blue: 'text-[#00E5FF]',
  purple: 'text-[#00E5FF]',
  orange: 'text-[#00E5FF]',
  green: 'text-[#00E5FF]',
  red: 'text-[#00E5FF]'
}

const headerGradients = {
  gray: 'from-[#0A1E47] to-[#001A4D]',
  blue: 'from-[#0A1E47] to-[#0047AB]',
  purple: 'from-[#001A4D] to-[#0047AB]',
  orange: 'from-[#0A1E47] to-[#0047AB]',
  green: 'from-[#0A1E47] to-[#0047AB]',
  red: 'from-[#0A1E47] to-[#0047AB]'
}

export default function PhaseDetailsCard({ currentQuest, currentPhaseNumber }: PhaseDetailsCardProps) {
  const phase = PHASES_DETAILED[currentPhaseNumber as keyof typeof PHASES_DETAILED] || PHASES_DETAILED[0]
  const quest = phase.quests.find(q => q.questNumber === currentQuest?.order_index) || phase.quests[0];
  const bgColor = colorClasses[phase.color as keyof typeof colorClasses]
  const textColor = textColorClasses[phase.color as keyof typeof textColorClasses]
  const gradient = headerGradients[phase.color as keyof typeof headerGradients]

  if (!quest) {
    return (
      <div className={`p-3 md:p-4 rounded-lg border-2 ${bgColor}`}>
        <div className="flex flex-col items-start justify-between gap-3">
          <div>
            <h2 className={`text-base md:text-lg font-bold ${textColor}`}>
              {phase.icon} {phase.name}
            </h2>
            <p className={`text-xs md:text-sm ${textColor} opacity-75 mt-1`}>{phase.description}</p>
          </div>
          <span className={`text-xs md:text-sm font-semibold ${textColor} bg-[#0A1E47]/60 px-3 py-1 rounded-full`}>
            Fase {currentPhaseNumber}
          </span>
        </div>
        <p className={`text-sm md:text-base ${textColor} opacity-75 mt-3`}>
          🎯 Todas as quests foram concluídas ou nenhuma quest ativa no momento. Parabéns!
        </p>
      </div>
    )
  }

  return (
    <div className={`p-3 md:p-4 rounded-lg border-2 ${bgColor} space-y-3 md:space-y-4`}>
      {/* Cabeçalho da Fase */}
      <div className={`bg-gradient-to-r ${gradient} text-white rounded-lg p-3 md:p-4`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-bold mb-1">
              {phase.icon} FASE {currentPhaseNumber}: {phase.name}
            </h2>
          </div>
          <div className="bg-[#0A1E47]/20 backdrop-blur p-2 md:p-3 rounded-lg">
            {phase.maxPoints > 0 && (
              <>
                <p className="text-white/80 text-xs md:text-sm font-semibold">🪙 AMF Coins Totais da Fase</p>
                <p className="text-xl md:text-2xl font-bold text-white">{phase.maxPoints}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quest Atual */}
      <div className="space-y-3 md:space-y-4">
        <h3 className={`text-base md:text-lg font-bold ${textColor}`}>📋 Quest Atual</h3>
        <QuestCard {...quest} />
      </div>

      {/* Dicas Gerais */}
      <div className="bg-[#0A1E47]/50 p-3 md:p-4 rounded-lg border border-current border-opacity-20">
        <p className={`text-sm md:text-base font-semibold ${textColor} mb-2`}>⚡ Reminders Importantes</p>
        <ul className={`text-xs md:text-sm ${textColor} opacity-85 space-y-1.5 md:space-y-2`}>
          <li>• Respeite os prazos de entrega dessa fase</li>
          <li>• Qualidade é mais importante que quantidade</li>
          <li>• Colabore com seu time e divida responsabilidades</li>
          <li>• Procure feedback antes de finalizar</li>
          <li>• Documente seu processo e decisões</li>
        </ul>
      </div>
    </div>
  )
}