import QuestCard from '@/components/QuestCard'

const PHASES_DETAILED = {
  0: {
    name: 'Preparação',
    icon: '⏸️',
    description: 'Fase preparatória - evento ainda não começou',
    color: 'gray',
    duration: '',
    maxPoints: 0,
    quests: []
  },
  1: {
    name: 'DESCOBERTA',
    icon: '🧭',
    description: 'Entender o mercado e o cliente',
    color: 'blue',
    duration: '20h - 22h30 (2h30min)',
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
    duration: '22h30 - 01h30 (3h30min)',
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
    duration: '01h30 - 04h00 (2h30min)',
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
    duration: '04h00 - 06h00 (2h)',
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
    duration: '06h00 - 07h30 (1h30min)',
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

interface PhaseDetailsCardProps {
  currentPhase: number
  currentQuestNumber?: number
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

export default function PhaseDetailsCard({ currentPhase, currentQuestNumber }: PhaseDetailsCardProps) {
  const phase = PHASES_DETAILED[currentPhase as keyof typeof PHASES_DETAILED] || PHASES_DETAILED[0]
  const bgColor = colorClasses[phase.color as keyof typeof colorClasses]
  const textColor = textColorClasses[phase.color as keyof typeof textColorClasses]
  const gradient = headerGradients[phase.color as keyof typeof headerGradients]

  // Filtrar quests baseado no parâmetro currentQuestNumber
  const questsToShow = currentQuestNumber
    ? phase.quests.filter(quest => quest.questNumber === currentQuestNumber)
    : phase.quests

  if (!phase.quests || phase.quests.length === 0) {
    return (
      <div className={`p-1 rounded-lg border-2 ${bgColor}`}>
        <div className="flex flex-col items-start justify-between mb-1 gap-1">
          <div>
            <h2 className={`text-sm font-bold ${textColor}`}>
              {phase.icon} {phase.name}
            </h2>
            <p className={`text-xs ${textColor} opacity-75`}>{phase.description}</p>
          </div>
          <span className={`text-xs font-semibold ${textColor} bg-[#0A1E47]/60 px-2 py-0.5 rounded-full`}>
            Fase {currentPhase}
          </span>
        </div>
        <p className={`text-xs ${textColor} opacity-75`}>
          Nenhuma quest definida para esta fase ainda. Aguarde atualizações!
        </p>
      </div>
    )
  }

  return (
    <div className={`p-1 rounded-lg border-2 ${bgColor} space-y-1`}>
      {/* Cabeçalho da Fase */}
      <div className={`bg-gradient-to-r ${gradient} text-white rounded-lg p-1`}>
        <div className="flex flex-col items-start justify-between mb-1 gap-1">
          <div className="flex-1">
            <h2 className="text-sm font-bold mb-0.5">
              {phase.icon} FASE {currentPhase}: {phase.name}
            </h2>
            <p className="text-white/90 text-xs mb-0.5">{phase.description}</p>
            {phase.duration && (
              <p className="text-white/80 text-xs font-semibold">⏰ {phase.duration}</p>
            )}
          </div>
          <div className="text-right">
            {phase.maxPoints > 0 && (
              <div className="bg-[#0A1E47]/20 backdrop-blur p-1 rounded">
                <p className="text-white/80 text-xs font-semibold">Pontos Totais</p>
                <p className="text-sm font-bold text-white">{phase.maxPoints}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quests */}
      <div className="space-y-1">
        <h3 className={`text-sm font-bold ${textColor}`}>📋 Quest Atual</h3>
        {questsToShow.map((quest) => (
          <QuestCard key={quest.questNumber} {...quest} />
        ))}
      </div>

      {/* Boss da Fase */}
      {currentPhase > 0 && currentPhase < 5 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-1 rounded">
          <p className={`text-xs font-bold text-red-900 mb-0.5`}>🏆 BOSS DA FASE</p>
          <p className="text-xs text-red-800">
            {currentPhase === 1 && "Pitch de 2 minutos sobre 'Para quem você está resolvendo e por quê?' (0-100 pontos)"}
            {currentPhase === 2 && "Demo de 2 minutos do protótipo em funcionamento (0-100 pontos)"}
            {currentPhase === 3 && "Defender o modelo de negócio em 3 minutos (0-100 pontos)"}
            {currentPhase === 4 && "Simulação de pitch com jurado surpresa (0-100 pontos)"}
          </p>
        </div>
      )}

      {/* Ultimo Chefão */}
      {currentPhase === 5 && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-1 rounded">
          <p className="text-xs font-bold mb-0.5">🏁 ÚLTIMO CHEFÃO</p>
          <p className="text-xs">
            ARENA DOS PITCHES - Apresentação oficial para os jurados (0-200 pontos)
          </p>
        </div>
      )}

      {/* Checkpoint */}
      {currentPhase === 2 && (
        <div className="bg-blue-50 border-l-4 border-[#00E5FF]/30400 p-1 rounded">
          <p className="text-xs font-bold text-[#00E5FF]900">✅ CHECKPOINT DA MEIA-NOITE</p>
          <p className="text-xs text-[#00E5FF]800">(00h): Salve o progresso! Avaliação rápida + snacks ☕</p>
        </div>
      )}

      {currentPhase === 3 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-1 rounded">
          <p className="text-xs font-bold text-orange-900">☕ BREAK ESTRATÉGICO</p>
          <p className="text-xs text-orange-800">(03h30 - 04h00): Café + energéticos + música</p>
        </div>
      )}

      {/* Dicas Gerais */}
      <div className="bg-[#0A1E47]/50 p-1 rounded-lg border border-current border-opacity-20">
        <p className={`text-xs font-semibold ${textColor} mb-0.5`}>⚡ Reminders Importantes</p>
        <ul className={`text-xs ${textColor} opacity-85 space-y-0.5`}>
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
