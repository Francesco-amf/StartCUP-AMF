import { Card } from '@/components/ui/card'

const MENTORS_DATA = [
  {
    category: 'Administração',
    emoji: '💼',
    color: 'blue',
    description: 'Orientação em gestão empresarial, planejamento estratégico e operações',
    mentors: ['Prof. Carlos Silva', 'Dra. Amanda Costa']
  },
  {
    category: 'Ciências Contábeis',
    emoji: '📊',
    color: 'green',
    description: 'Consultoria em finanças, fluxo de caixa e viabilidade econômica',
    mentors: ['Prof. Roberto Mendes', 'Dra. Fernanda Rocha']
  },
  {
    category: 'Direito',
    emoji: '⚖️',
    color: 'purple',
    description: 'Assessoria jurídica, compliance e questões legais',
    mentors: ['Prof. Bruno Santos', 'Dra. Mariana Gomes']
  },
  {
    category: 'Sistemas de Informação',
    emoji: '💻',
    color: 'indigo',
    description: 'Desenvolvimento técnico, arquitetura de sistemas e inovação tecnológica',
    mentors: ['Prof. Lucas Ferreira', 'Dra. Juliana Pereira']
  },
  {
    category: 'Ontopsicologia',
    emoji: '🧠',
    color: 'pink',
    description: 'Desenvolvimento pessoal, liderança e consciência comportamental',
    mentors: ['Prof. Rafael Oliveira', 'Dra. Beatriz Lima']
  },
  {
    category: 'Gastronomia',
    emoji: '🍽️',
    color: 'orange',
    description: 'Consultoria em negócios alimentares e experiência gastronômica',
    mentors: ['Prof. Wagner Costa', 'Chef Marcela Souza']
  },
  {
    category: 'Hotelaria',
    emoji: '🏨',
    color: 'cyan',
    description: 'Gestão hoteleira, experiência do cliente e operações hospitaleiras',
    mentors: ['Prof. André Machado', 'Dra. Cristina Barbosa']
  },
  {
    category: 'Pedagogia',
    emoji: '📚',
    color: 'teal',
    description: 'Educação, metodologias de aprendizagem e desenvolvimento instrucional',
    mentors: ['Prof. Patricia Goulart', 'Dra. Simone Ribeiro']
  }
]

const colorClasses = {
  blue: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  green: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  purple: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  indigo: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  pink: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  orange: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  cyan: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40',
  teal: 'bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-[#00E5FF]/40'
}

const textColorClasses = {
  blue: 'text-[#00E5FF]',
  green: 'text-[#00E5FF]',
  purple: 'text-[#00E5FF]',
  indigo: 'text-[#00E5FF]',
  pink: 'text-[#00E5FF]',
  orange: 'text-[#00E5FF]',
  cyan: 'text-[#00E5FF]',
  teal: 'text-[#00E5FF]'
}

const badgeColorClasses = {
  blue: 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40',
  green: 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40',
  purple: 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40',
  indigo: 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40',
  pink: 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40',
  orange: 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40',
  cyan: 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40',
  teal: 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40'
}

export default function MentorsGuide() {
  return (
    <div>
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-[#00E5FF] mb-0.5">👥 Mentores Disponíveis</h3>
        <p className="text-xs text-[#00E5FF]/70">
          Equipe multidisciplinar pronta para orientar sua jornada durante o evento.
        </p>
      </div>

      {/* Horizontal scrollable mentors grid */}
      <div className="flex gap-0.5 overflow-x-auto pb-0.5 mb-1">
        {MENTORS_DATA.map((mentorGroup) => {
          const bgColor = colorClasses[mentorGroup.color as keyof typeof colorClasses]
          const textColor = textColorClasses[mentorGroup.color as keyof typeof textColorClasses]

          return (
            <div
              key={mentorGroup.category}
              className={`flex-shrink-0 w-32 p-1 border-2 rounded-lg ${bgColor}`}
            >
              {/* Category header */}
              <div className="flex items-center gap-0.5 mb-0.5">
                <span className="text-lg flex-shrink-0">{mentorGroup.emoji}</span>
                <h4 className={`font-bold text-xs ${textColor} break-words`}>
                  {mentorGroup.category}
                </h4>
              </div>

              {/* Short description */}
              <p className="text-xs text-white/70 mb-0.5 line-clamp-2">
                {mentorGroup.description}
              </p>

              {/* Mentors list - compact */}
              <div className="space-y-0.5">
                {mentorGroup.mentors.map((mentor) => (
                  <div
                    key={mentor}
                    className="text-xs font-semibold px-1 py-0.5 rounded bg-[#00E5FF]/40 border-2 border-[#00E5FF]/70 text-[#0A1E47] hover:bg-[#00E5FF]/50 transition-all shadow-md truncate"
                    title={mentor}
                  >
                    {mentor}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info box */}
      <div className="p-1 bg-gradient-to-r from-[#0A1E47]/60 to-[#001A4D]/60 border-l-4 border-[#00E5FF]/60 rounded">
        <p className="text-xs font-semibold text-[#00E5FF] mb-0.5">💡 Como Usar os Mentores</p>
        <ul className="text-xs text-white space-y-0.5">
          <li>✓ Escolha mentores relevantes para sua solução</li>
          <li>✓ Tire dúvidas técnicas, legais, financeiras e de gestão</li>
          <li>✓ Utilize o power-up "Mentoria" para orientação especializada</li>
          <li>✓ Aproveite a visão multidisciplinar para aprimorar seu trabalho</li>
        </ul>
      </div>
    </div>
  )
}
