'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

export default function GuiaEquipePage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)

  const faqItems: FAQItem[] = [
    {
      question: 'Como funciona o sistema de pontuação?',
      answer:
        'Quando sua equipe submete uma quest, um avaliador atribui uma pontuação de 0 até o máximo da quest. O sistema também aplica um multiplicador (1 a 2) baseado na qualidade/esforço. Sua pontuação final = Pontos × Multiplicador.'
    },
    {
      question: 'Qual é a diferença entre as Fases?',
      answer:
        'O evento tem 6 fases: Preparação → Descoberta → Criação → Estratégia → Refinamento → Pitch Final. Cada fase representa um estágio da competição com quests e desafios diferentes. Você progride através das fases conforme completa as quests.'
    },
    {
      question: 'Como submeter uma quest?',
      answer:
        'Vá para a aba "Submissões" no seu dashboard. Escolha a quest que deseja submeter, faça upload do arquivo (ou envie texto) e clique em "Enviar". A entrega fica "pending" até ser avaliada.'
    },
    {
      question: 'Posso editar minha submissão após enviar?',
      answer: 'Depende do status da quest. Se a quest ainda está "ativa", você pode reenviar. Se já está "fechada" ou "finalizada", não pode mais editar. Verifique o status da quest no seu dashboard.'
    },
    {
      question: 'O que são Power-ups?',
      answer:
        'Power-ups são itens especiais que sua equipe pode usar para obter vantagens: Mentoria (receba orientação), Dica (ganhe insight sobre a solução), Validação (tenha sua resposta confirmada), Checkpoint (economia de pontos). Você tem 4 power-ups no total, máximo 1 por fase.'
    },
    {
      question: 'Como usar um Power-up?',
      answer:
        'Vá para a seção "Power-ups" no seu dashboard. Escolha qual power-up deseja usar, selecione a quest e confirme. O power-up será consumido e seus efeitos aplicados imediatamente.'
    },
    {
      question: 'O que são AMF Coins?',
      answer:
        'AMF Coins é a moeda interna do sistema. Você ganha coins completando quests e participando de atividades. Usa coins para solicitar mentoria (custa 10 coins) ou outros recursos especiais.'
    },
    {
      question: 'Como solicitar mentoria?',
      answer:
        'Vá para "Solicitar Mentoria" no seu dashboard. Escolha um mentor disponível, descreva sua pergunta/dúvida e confirme. A solicitação consome 10 AMF Coins. Um mentor responderá em breve.'
    },
    {
      question: 'Como vejo o ranking em tempo real?',
      answer:
        'Acesse "Live Dashboard" para ver o ranking atualizado em tempo real de todas as equipes. A classificação muda conforme os avaliadores atribuem notas e penalidades.'
    },
    {
      question: 'O que são penalidades e como afetam minha equipe?',
      answer:
        'Penalidades são deduções de pontos aplicadas por infrações: Plágio (-50), Desorganização (-20), Desrespeito (-30), Ausência (-40), Atraso (-10). Aparecem imediatamente no seu ranking. Tente evitá-las seguindo as regras!'
    },
    {
      question: 'Posso ver as comentários dos avaliadores?',
      answer:
        'As avaliações são anônimas. Você vê apenas a pontuação final (pontos × multiplicador). Se tiver dúvidas sobre a avaliação, entre em contato com os organizadores.'
    },
    {
      question: 'Como funciona o Pitch Final?',
      answer:
        'O Pitch Final é a última fase onde sua equipe apresenta o projeto final. Avaliadores assistem à apresentação (ao vivo ou vídeo) e atribuem pontos com base na qualidade da apresentação, inovação e execução.'
    },
    {
      question: 'O que acontece após a última fase?',
      answer:
        'Após o Pitch Final, o sistema encerra o evento. O ranking final é divulgado e a equipe com mais pontos é declarada vencedora. Prêmios podem ser distribuídos conforme regras do evento.'
    },
    {
      question: 'Posso ver o histórico de meus pontos?',
      answer:
        'Sim! Na seção "Histórico de Coins" você pode ver todas as transações e mudanças de pontos. Use para acompanhar seu progresso na competição.'
    },
    {
      question: 'E se houver discrepância nas minhas avaliações?',
      answer:
        'Se achar que sua nota está incorreta ou injusta, entre em contato com os organizadores fornecendo a quest e explicação. Eles podem revisar com múltiplos avaliadores.'
    }
  ]

  const phases = [
    {
      name: 'Preparação',
      icon: '⏸️',
      description: 'Antes do evento começar. Prepare suas ideias e recursos.',
      tips: [
        'Organize sua equipe',
        'Prepare ferramentas que usará',
        'Revise as regras e fases',
        'Converse com potenciais mentores'
      ]
    },
    {
      name: 'Fase 1: Descoberta',
      icon: '🔍',
      description: 'Identifique o problema e pesquise soluções.',
      tips: [
        'Faça pesquisa de mercado',
        'Valide se o problema é real',
        'Explore soluções existentes',
        'Defina seu público-alvo'
      ]
    },
    {
      name: 'Fase 2: Criação',
      icon: '💡',
      description: 'Desenvolva seu MVP e primeiras funcionalidades.',
      tips: [
        'Crie um protótipo ou MVP',
        'Comece a codificação/desenvolvimento',
        'Teste conceitos principais',
        'Obtenha feedback inicial'
      ]
    },
    {
      name: 'Fase 3: Estratégia',
      icon: '📊',
      description: 'Defina modelo de negócio e go-to-market.',
      tips: [
        'Defina modelo de receita',
        'Crie um plano de marketing',
        'Analise concorrência',
        'Prepare métricas de sucesso'
      ]
    },
    {
      name: 'Fase 4: Refinamento',
      icon: '✨',
      description: 'Melhore o produto e prepare a apresentação.',
      tips: [
        'Refine a solução baseado em feedback',
        'Melhore UX/usabilidade',
        'Prepare materiais visuais',
        'Ensaie sua apresentação'
      ]
    },
    {
      name: 'Fase 5: Pitch Final',
      icon: '🎯',
      description: 'Apresente seu projeto para avaliadores e público.',
      tips: [
        'Faça última revisão',
        'Teste seu vídeo/apresentação',
        'Chegue cedo para testes técnicos',
        'Mostre paixão e confiança!'
      ]
    }
  ]

  const powerUps = [
    {
      name: 'Mentoria',
      icon: '👨‍🏫',
      cost: 'Custo variável',
      description:
        'Receba orientação direta de um mentor experiente sobre sua solução. O custo de mentoria cresce a cada chamada (ex.: 1ª = 5, 2ª = 10, 3ª = 20, 4ª = 35, 5ª = 55) — ver no dashboard para valores atuais.',
      benefit: 'Melhora na qualidade e direção do projeto'
    },
    {
      name: 'Dica',
      icon: '💡',
      cost: 'Custo variável',
      description: 'Obtenha uma dica valiosa sobre como resolver um desafio específico (custo configurável).',
      benefit: 'Insight para evitar caminhos errados'
    },
    {
      name: 'Validação',
      icon: '✅',
      cost: 'Custo variável',
      description: 'Tenha seu conceito ou solução validado por um especialista (custo configurável).',
      benefit: 'Confiança de que está no caminho certo'
    },
    {
      name: 'Checkpoint',
      icon: '🏁',
      cost: 'Custo variável',
      description: 'Salve um checkpoint. Se sua avaliação cair, volta a este ponto (uso limitado; custo configurável).',
      benefit: 'Proteção contra avaliações injustas (uso limitado)'
    }
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
          <h1 className="text-4xl font-bold gradient-text-startcup">Guia da Equipe 📖</h1>
          <p className="text-[#00E5FF] mt-2">Aprenda como navegar no sistema, submeter quests, usar power-ups e competir</p>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid gap-6">
          {/* Seção: Quick Start */}
          <Card className="p-8 bg-gradient-to-br from-[#00E5FF]/20 to-[#0A1E47]/60 border-2 border-[#00E5FF]/60">
            <h2 className="text-3xl font-bold mb-4 text-[#00E5FF]">⚡ Comece em 5 Minutos</h2>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <p className="text-[#00E5FF] font-bold text-lg mb-2">1️⃣ Login</p>
                <p className="text-[#00E5FF]/80 text-sm">
                  Acesse com seu email e senha da equipe.
                </p>
              </div>
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <p className="text-[#00E5FF] font-bold text-lg mb-2">2️⃣ Dashboard</p>
                <p className="text-[#00E5FF]/80 text-sm">
                  Veja fase atual e quests disponíveis.
                </p>
              </div>
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <p className="text-[#00E5FF] font-bold text-lg mb-2">3️⃣ Submeta</p>
                <p className="text-[#00E5FF]/80 text-sm">
                  Upload arquivo ou envie texto da solução.
                </p>
              </div>
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <p className="text-[#00E5FF] font-bold text-lg mb-2">4️⃣ Compete</p>
                <p className="text-[#00E5FF]/80 text-sm">
                  Veja seu ranking em tempo real!
                </p>
              </div>
            </div>
            <p className="text-[#00E5FF]/80 text-sm italic">
              💡 Dica: Seu progresso é salvo automaticamente. Você não perde dados!
            </p>
          </Card>

          {/* Seção: Como Submeter */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E676]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#00E676]">📤 Como Submeter uma Quest</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#00E676]">Passo a Passo</h3>
                <div className="space-y-3">
                  {[
                    { num: 1, text: 'Acesse seu Dashboard' },
                    { num: 2, text: 'Vá para a seção "Ações Rápidas"' },
                    { num: 3, text: 'Clique em "Submeter Quest"' },
                    { num: 4, text: 'Escolha a quest que deseja submeter' },
                    { num: 5, text: 'Cole o link da sua solução' },
                    { num: 6, text: 'Adicione descrição (opcional)' },
                    { num: 7, text: 'Clique em "Enviar Solução"' }
                  ].map((step) => (
                    <div key={step.num} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00E676]/20 flex items-center justify-center border-2 border-[#00E676]/50 font-bold text-[#00E676] text-sm">
                        {step.num}
                      </div>
                      <div className="flex-1 text-[#00E676]/70 text-sm py-1">{step.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#00E676]">✅ Antes de Submeter</h3>
                <div className="bg-[#0A1E47]/40 p-4 rounded-lg border border-[#00E676]/30 space-y-2">
                  <p className="text-[#00E676]/70 text-sm">• Revise seu trabalho cuidadosamente</p>
                  <p className="text-[#00E676]/70 text-sm">• Certifique-se de que o link funciona corretamente</p>
                  <p className="text-[#00E676]/70 text-sm">• Verifique se atende aos critérios da quest</p>
                  <p className="text-[#00E676]/70 text-sm">• Tenha backup do seu trabalho</p>
                  <p className="text-[#00E676]/70 text-sm">• Respeite prazos (não entregue atrasado!)</p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-[#0A1E47]/40 p-4 rounded-lg border border-[#00E676]/30">
              <p className="text-[#00E676]/70 text-sm">
                <span className="font-bold text-[#00E676]">💡 Dica:</span> Você pode submeter várias vezes se a quest ainda está ativa. Apenas a última submissão será avaliada!
              </p>
            </div>
          </Card>

          {/* Seção: Power-ups */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF6B35]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#FF6B35]">⚡ Power-ups - Ganhe Vantagem</h2>

            <p className="text-[#FF6B35]/90 mb-6 text-base">
              Você tem <span className="font-bold text-[#FF6B35]">4 power-ups</span> disponíveis no total, máximo 1 por fase. Use-os estrategicamente!
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {powerUps.map((powerUp, idx) => (
                <div key={idx} className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FF6B35]/50 hover:border-[#FF6B35]/80 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{powerUp.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#FF6B35]">{powerUp.name}</h3>
                      <p className="text-[#FF6B35]/80 text-xs font-semibold">{powerUp.cost}</p>
                    </div>
                  </div>
                  <p className="text-[#FF6B35]/90 text-sm mb-2">{powerUp.description}</p>
                  <div className="bg-[#0A1E47]/60 p-2 rounded border-2 border-[#FF6B35]/50">
                    <p className="text-[#FF6B35]/90 text-sm">
                      <span className="font-bold text-[#FF6B35]">Benefício:</span> {powerUp.benefit}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FF6B35]/50">
              <h3 className="font-bold text-[#FF6B35] mb-3">🎯 Estratégia de Power-ups</h3>
              <ul className="text-[#FF6B35]/85 text-sm space-y-2">
                <li>• <span className="font-bold text-[#FF6B35]">Mentoria:</span> Use na fase onde tem maior dúvida</li>
              </ul>
            </div>
          </Card>

          {/* Seção: AMF Coins */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FFEB3B]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#FFEB3B]">💰 AMF Coins - Moeda do Sistema</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FFEB3B]/50">
                <h3 className="font-bold text-[#FFEB3B] mb-3">Como Ganhar</h3>
                <ul className="text-[#FFEB3B]/80 text-sm space-y-2">
                  <li>✅ Completar quests: valor variável por quest (definido na configuração da quest)</li>
                  <li>✅ Avaliação: o avaliador atribui os AMF Coins base e pode aplicar um multiplicador (até 2x) após avaliação</li>
                </ul>
              </div>

              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FFEB3B]/50">
                <h3 className="font-bold text-[#FFEB3B] mb-3">Como Gastar</h3>
                <ul className="text-[#FFEB3B]/80 text-sm space-y-2">
                  <li>🎯 Solicitar Mentoria: custo variável e cresce a cada chamada (ver exemplo no card de mentoria)</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FFEB3B]/50">
              <h3 className="font-bold text-[#FFEB3B] mb-2">💡 Gerenciamento Inteligente</h3>
              <p className="text-[#FFEB3B]/70 text-sm">
                Coins são limitados. Gaste com sabedoria! Priorize mentoria nas fases mais desafiadoras e use checkpoints quando tiver certeza de seu trabalho.
              </p>
            </div>
          </Card>

          {/* Seção: Ranking e Penalidades */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF3D00]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#FF3D00]">📊 Ranking e Penalidades</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FF3D00]/50">
                <h3 className="font-bold text-[#FF3D00] mb-3">🏆 Como Subir no Ranking</h3>
                <ul className="text-[#FF3D00]/80 text-sm space-y-2">
                  <li>✅ Submeter soluções bem feitas</li>
                  <li>✅ Ganhar pontos máximos com bons multiplicadores</li>
                  <li>✅ Evitar penalidades</li>
                  <li>✅ Participar em todas as fases</li>
                  <li>✅ Melhorar continuamente</li>
                </ul>
              </div>

              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#FF3D00]/50">
                <h3 className="font-bold text-[#FF3D00] mb-3">🚫 Evite Penalidades</h3>
                <ul className="text-[#FF3D00]/80 text-sm space-y-2">
                  <li>⚠️ Plágio: -50 pontos (GRAVE!)</li>
                  <li>⚠️ Desorganização: -20 pontos</li>
                  <li>⚠️ Desrespeito: -30 pontos</li>
                  <li>⚠️ Ausência: -40 pontos</li>
                  <li>⚠️ Atraso: -10 pontos</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Seção: Dashboard - O que significa */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#00E5FF]">📊 Entenda Seu Dashboard</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <h3 className="font-bold text-[#00E5FF] mb-2">Fase Atual</h3>
                <p className="text-[#00E5FF]/80 text-sm">
                  Mostra em qual fase do evento você está. Quests disponíveis correspondem à fase atual.
                </p>
              </div>

              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <h3 className="font-bold text-[#00E5FF] mb-2">Quests Ativas</h3>
                <p className="text-[#00E5FF]/80 text-sm">
                  Lista de quests que você pode submeter agora. Clique para ver detalhes e enviar solução.
                </p>
              </div>

              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <h3 className="font-bold text-[#00E5FF] mb-2">Pontuação Atual</h3>
                <p className="text-[#00E5FF]/80 text-sm">
                  Total de pontos que sua equipe acumulou até agora. Atualiza quando novas avaliações chegam.
                </p>
              </div>

              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <h3 className="font-bold text-[#00E5FF] mb-2">Power-ups Restantes</h3>
                <p className="text-[#00E5FF]/80 text-sm">
                  Quantos power-ups você ainda tem disponíveis. Máximo 1 por fase!
                </p>
              </div>

              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <h3 className="font-bold text-[#00E5FF] mb-2">Histórico de Submissões</h3>
                <p className="text-[#00E5FF]/80 text-sm">
                  Todas suas submissões com status (pending/evaluated) e pontuação final.
                </p>
              </div>

              <div className="bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
                <h3 className="font-bold text-[#00E5FF] mb-2">Penalidades Aplicadas</h3>
                <p className="text-[#00E5FF]/80 text-sm">
                  Todas penalidades recebidas com datas. Tente manter essa lista vazia!
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
            <h2 className="text-2xl font-bold mb-4 text-[#00E5FF]">🚀 Pronto para Competir?</h2>
            <p className="text-[#00E5FF]/70 mb-6">
              Faça login como equipe e comece a submeter suas soluções. Boa sorte! 🎉
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
              💡 Esta é uma página de consulta rápida. Para dúvidas técnicas, contate os organizadores no Discord ou via email.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
