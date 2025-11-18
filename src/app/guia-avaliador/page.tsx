'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

export default function GuiaAvaliadorPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const faqItems: FAQItem[] = [
    {
      question: 'Como funciona o sistema de avaliação?',
      answer:
        'Você avalia as entregas das equipes em suas submissões. Cada entrega recebe uma pontuação (de 0 até o máximo da quest) e um multiplicador de qualidade (de 1 a 2). A pontuação final é: pontos × multiplicador.'
    },
    {
      question: 'Qual é a diferença entre Pontos Base e Multiplicador?',
      answer:
        'Pontos Base é a avaliação do conteúdo (0 a máximo da quest). Multiplicador é um ajuste de qualidade/esforço (1 a 2). Se você dá 50 pontos com multiplicador 1.2, a pontuação final é 60 pontos.'
    },
    {
      question: 'Posso editar minhas avaliações depois de submeter?',
      answer: 'Sim! Você pode acessar suas avaliações a qualquer momento na seção "Minhas Avaliações" e fazer ajustes. Clique em "Editar" para reviser sua avaliação.'
    },
    {
      question: 'Como atribuir penalidades?',
      answer:
        'Use a seção "Atribuição de Penalidades" no seu dashboard. Selecione a equipe, o tipo de penalidade (plagio, desorganização, desrespeito, ausência, atraso) e confirme. As penalidades reduzem pontos imediatamente.'
    },
    {
      question: 'Quais são os tipos de penalidades?',
      answer:
        '• Plágio: -50 pontos\n• Desorganização: -20 pontos\n• Desrespeito: -30 pontos\n• Ausência: -40 pontos\n• Atraso: -10 pontos\n\nVocê pode atribuir múltiplas penalidades à mesma equipe.'
    },
    {
      question: 'Como funciona o sistema de fases?',
      answer:
        'O evento tem 6 fases: Preparação → Descoberta → Criação → Estratégia → Refinamento → Pitch Final. Cada fase tem quests específicas. Você avalia as entregas dentro da fase correspondente.'
    },
    {
      question: 'Sou mentor, como funciona isso?',
      answer:
        'Se seu role incluir "mentor", você verá uma seção de "Solicitações de Mentoria" no dashboard. As equipes podem pedir mentoria, você aceita/nega e fornece orientação. Cada mentoria consome AMF Coins da equipe.'
    },
    {
      question: 'Como as notas aparecem para as equipes?',
      answer: 'Suas avaliações são anônimas. As equipes veem o resultado final (pontos) mas não sabem quem avaliou. As penalidades aparecem em tempo real no ranking delas.'
    },
    {
      question: 'Posso ver todas as avaliações de uma equipe?',
      answer: 'Na aba "Equipes", você pode ver o status de cada equipe e suas avaliações consolidadas. Use para verificar duplicatas ou avaliar de forma consistente.'
    },
    {
      question: 'E se uma equipe tiver avaliações contraditórias?',
      answer: 'Se você acha que uma avaliação anterior está errada, você pode editar a sua. Se o problema for com outro avaliador, entre em contato com o administrador para revisar.'
    }
  ]

  const penaltyTypes = [
    { name: 'Plágio', points: 50, icon: '🚫', color: 'red' },
    { name: 'Desorganização', points: 20, icon: '🗂️', color: 'orange' },
    { name: 'Desrespeito', points: 30, icon: '⚠️', color: 'pink' },
    { name: 'Ausência', points: 40, icon: '😴', color: 'gray' },
    { name: 'Atraso', points: 10, icon: '⏰', color: 'yellow' }
  ]

  return (
    <div className="min-h-screen gradient-startcup">
      <div className="bg-gradient-to-r from-[#0A1E47] via-[#001A4D] to-[#0047AB] border-b-2 border-[#00E5FF]/30 text-white p-6 mb-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/login">
              <Button variant="ghost" className="text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:text-white">
                ← Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold gradient-text-startcup">Guia do Avaliador 📖</h1>
          <p className="text-[#00E5FF] mt-2">Aprenda como avaliar submissions, gerenciar penalidades e usar o sistema</p>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid gap-6">
          {/* Seção: Quick Start */}
          <Card className="p-8 bg-gradient-to-br from-[#00E5FF]/20 to-[#0A1E47]/60 border-2 border-[#00E5FF]/60">
            <h2 className="text-3xl font-bold mb-4 text-[#00E5FF]">⚡ Comece Rápido (3 minutos)</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <p className="text-[#00E5FF] font-bold text-lg mb-2">1️⃣ Acesse seu Dashboard</p>
                <p className="text-[#00E5FF]/80 text-sm">
                  Quando fizer login como avaliador, você vê suas entregas pendentes para avaliar.
                </p>
              </div>
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <p className="text-[#00E5FF] font-bold text-lg mb-2">2️⃣ Revise a Entrega</p>
                <p className="text-[#00E5FF]/80 text-sm">
                  Clique em "Ver Entrega" para baixar o arquivo ou visualizar o conteúdo submetido.
                </p>
              </div>
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <p className="text-[#00E5FF] font-bold text-lg mb-2">3️⃣ Avalie e Confirme</p>
                <p className="text-[#00E5FF]/80 text-sm">
                  Clique em "Avaliar", defina pontos (0 a máx) e multiplicador (1 a 2), depois confirme. Pronto!
                </p>
              </div>
            </div>
            <p className="text-[#00E5FF]/80 text-sm italic">
              💡 Dica: Você pode editar suas avaliações a qualquer momento. Não há pressa!
            </p>
          </Card>

          {/* Seção: Como Funciona o Workflow */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E676]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#00E676]">🔄 Fluxo de Avaliação</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00E676]/20 flex items-center justify-center border-2 border-[#00E676]/50 font-bold text-[#00E676]">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#00E676] mb-1">Entrega Submetida</h3>
                  <p className="text-[#00E676]/70 text-sm">
                    Uma equipe submete sua solução para uma quest. A entrega fica "pending" aguardando avaliação.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00E676]/20 flex items-center justify-center border-2 border-[#00E676]/50 font-bold text-[#00E676]">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#00E676] mb-1">Você Avalia</h3>
                  <p className="text-[#00E676]/70 text-sm">
                    Você clica em "Avaliar", revisa o conteúdo e atribui pontos (0 a máximo) + multiplicador (1 a 2). Os AMF Coins base também são definidos por quest; você pode aplicar um multiplicador (até 2x) sobre os AMF Coins após avaliação.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00E676]/20 flex items-center justify-center border-2 border-[#00E676]/50 font-bold text-[#00E676]">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#00E676] mb-1">Avaliação Confirmada</h3>
                  <p className="text-[#00E676]/70 text-sm">
                    A entrega agora está "evaluated". A equipe vê os pontos. Aparece em "Minhas Avaliações".
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00E676]/20 flex items-center justify-center border-2 border-[#00E676]/50 font-bold text-[#00E676]">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#00E676] mb-1">Editar se Necessário</h3>
                  <p className="text-[#00E676]/70 text-sm">
                    Clique em "Editar" em "Minhas Avaliações" para mudar pontos/multiplicador a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Seção: Sistema de Pontuação */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF9800]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#FF9800]">📊 Sistema de Pontuação</h2>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#FF9800] mb-4">Fórmula de Cálculo</h3>
              <div className="bg-[#0A1E47]/40 p-6 rounded-lg border border-[#FF9800]/30 mb-4">
                <p className="text-[#FF9800] font-mono text-lg text-center">
                  Pontuação Final = Pontos Base × Multiplicador
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0A1E47]/40 p-4 rounded-lg border border-[#FF9800]/30">
                  <h4 className="font-bold text-[#FF9800] mb-3">📝 Pontos Base</h4>
                  <ul className="text-[#FF9800]/70 text-sm space-y-2">
                    <li>• Vai de <span className="font-bold text-[#FF9800]">0 até o máximo da quest</span></li>
                    <li>• Avalia a <span className="font-bold text-[#FF9800]">qualidade do conteúdo</span></li>
                    <li>• Baseado na solução apresentada</li>
                    <li>• Exemplo: Quest máx 100 pontos → você pode dar 0 a 100</li>
                    <li>• Observação: o número de AMF Coins associados à quest é definido na configuração da quest. Após sua avaliação, o multiplicador (até 2x) pode ser aplicado sobre os AMF Coins base.</li>
                  </ul>
                </div>

                <div className="bg-[#0A1E47]/40 p-4 rounded-lg border border-[#FF9800]/30">
                  <h4 className="font-bold text-[#FF9800] mb-3">✨ Multiplicador</h4>
                  <ul className="text-[#FF9800]/70 text-sm space-y-2">
                    <li>• Vai de <span className="font-bold text-[#FF9800]">1.0 a 2.0</span></li>
                    <li>• Ajusta por <span className="font-bold text-[#FF9800]">esforço/qualidade</span></li>
                    <li>• <span className="text-[#FF9800]">1.0</span> = conforme esperado (padrão)</li>
                    <li>• <span className="text-[#FF9800]">1.5</span> = muito bom/qualidade alta</li>
                    <li>• <span className="text-[#FF9800]">2.0</span> = excelente/excepcional</li>
                    <li>• Observação: multiplicador aplica-se às AMF Coins das quests regulares; não se aplica a Boss Battles/Pitches.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#FF9800] mb-4">💡 Exemplos de Cálculo</h3>
              <div className="space-y-3">
                <div className="bg-[#0A1E47]/40 p-3 rounded border border-[#FF9800]/30">
                  <p className="text-[#FF9800] font-bold">Cenário 1: Trabalho conforme esperado</p>
                  <p className="text-[#FF9800]/70 text-sm">
                    70 pontos × 1.0 (padrão) = <span className="font-bold text-[#FF9800]">70 pontos finais</span>
                  </p>
                </div>
                <div className="bg-[#0A1E47]/40 p-3 rounded border border-[#FF9800]/30">
                  <p className="text-[#FF9800] font-bold">Cenário 2: Excelente execução</p>
                  <p className="text-[#FF9800]/70 text-sm">
                    70 pontos × 1.8 (qualidade excepcional) = <span className="font-bold text-[#FF9800]">126 pontos finais</span>
                  </p>
                </div>
                <div className="bg-[#0A1E47]/40 p-3 rounded border border-[#FF9800]/30">
                  <p className="text-[#FF9800] font-bold">Cenário 3: Muito bom</p>
                  <p className="text-[#FF9800]/70 text-sm">
                    80 pontos × 1.5 (qualidade muito boa) = <span className="font-bold text-[#FF9800]">120 pontos finais</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Seção: Penalidades */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF3D00]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#FF3D00]">🚫 Sistema de Penalidades</h2>

            <p className="text-[#FF3D00]/80 mb-6">
              Penalidades são deduções de pontos aplicadas quando uma equipe comete infrações. Todas as penalidades aparecem em tempo real no ranking.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {penaltyTypes.map((penalty, idx) => (
                <div
                  key={idx}
                  className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FF3D00]/50 hover:border-[#FF3D00]/80 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{penalty.icon}</span>
                    <h3 className="font-bold text-[#FF3D00]">{penalty.name}</h3>
                  </div>
                  <p className="text-[#FF3D00]/80 text-sm">
                    Dedução: <span className="font-bold text-[#FF3D00]">-{penalty.points} pontos</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FF3D00]/50">
              <h3 className="font-bold text-[#FF3D00] mb-3">Como Aplicar Penalidades</h3>
              <ol className="text-[#FF3D00]/80 text-sm space-y-2 list-decimal list-inside">
                <li>Acesse a seção "Atribuição de Penalidades" no seu dashboard</li>
                <li>Selecione a equipe que cometeu a infração</li>
                <li>Escolha o tipo de penalidade apropriado</li>
                <li>Confirme a ação</li>
                <li>A penalidade aparece imediatamente no ranking da equipe</li>
              </ol>
            </div>
          </Card>

          {/* Seção: Mentor */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF6B35]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#FF6B35]">👨‍🏫 Sistema de Mentoria</h2>

            <p className="text-[#FF6B35]/90 mb-6">
              Se você é um mentor, as equipes podem solicitar sua orientação. Aqui está como funciona:
            </p>

            <div className="space-y-4">
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FF6B35]/50">
                <h3 className="font-bold text-[#FF6B35] mb-2">📥 Receber Solicitações</h3>
                <p className="text-[#FF6B35]/90 text-sm">
                  Você verá as solicitações de mentoria na seção "Solicitações de Mentoria" do seu dashboard. Cada uma mostra a equipe e o assunto.
                </p>
              </div>

              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FF6B35]/50">
                <h3 className="font-bold text-[#FF6B35] mb-2">💰 Custo em AMF Coins</h3>
                <p className="text-[#FF6B35]/90 text-sm">
                  O custo de mentoria é variável e aumenta a cada chamada efetuada pela mesma equipe (ex.: 1ª = 5, 2ª = 10, 3ª = 20, ...). Confira o dashboard para o custo atual de cada solicitação.
                </p>
              </div>

              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FF6B35]/50">
                <h3 className="font-bold text-[#FF6B35] mb-2">✅ Aceitar/Negar</h3>
                <p className="text-[#FF6B35]/90 text-sm">
                  Você pode aceitar ou negar cada solicitação. Se aceitar, a equipe receberá sua resposta/orientação.
                </p>
              </div>
            </div>
          </Card>

          {/* Seção: FAQ */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#00E5FF]">❓ Perguntas Frequentes</h2>

            <div className="space-y-3">
              {faqItems.map((item, idx) => (
                <div key={idx} className="border-2 border-[#00E5FF]/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                  >
                    <span className="font-bold text-[#00E5FF]">{item.question}</span>
                    <span className="text-[#00E5FF] text-xl font-bold">{expandedFAQ === idx ? '−' : '+'}</span>
                  </button>
                  {expandedFAQ === idx && (
                    <div className="px-4 py-3 bg-[#0A1E47]/30 border-t-2 border-[#00E5FF]/40 text-[#00E5FF]/80 text-sm whitespace-pre-wrap">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Call to Action */}
          <Card className="p-8 bg-gradient-to-br from-[#00E5FF]/20 to-[#0A1E47]/60 border-2 border-[#00E5FF]/60">
            <h2 className="text-2xl font-bold mb-4 text-[#00E5FF]">🚀 Pronto para Começar?</h2>
            <p className="text-[#00E5FF]/70 mb-6">
              Faça login como avaliador para acessar o seu dashboard e comece a avaliar!
            </p>
            <Link href="/login">
              <Button className="bg-[#00E5FF] hover:bg-[#00D9FF] text-[#0A1E47] font-bold text-lg px-8 py-3">
                Ir para Login →
              </Button>
            </Link>
          </Card>

          {/* Footer Info */}
          <Card className="p-6 bg-[#0A1E47]/40 border border-[#00E5FF]/20">
            <p className="text-[#00E5FF]/60 text-sm text-center">
              💡 Esta é uma página de consulta rápida. Para dúvidas adicionais, entre em contato com os organizadores do StartCup.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
