'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface FAQItem {
  question: string
  answer: string
}

export default function GuiaAvaliadorPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  // Senha fixa para acesso (compartilhada apenas com avaliadores)
  const GUIDE_PASSWORD = 'St@rtC@p2025!'

  // Verificar se já está desbloqueado no localStorage
  useEffect(() => {
    const unlocked = localStorage.getItem('guia_avaliador_unlocked')
    if (unlocked === 'true') {
      setIsUnlocked(true)
    }
  }, [])

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === GUIDE_PASSWORD) {
      setIsUnlocked(true)
      setError(false)
      localStorage.setItem('guia_avaliador_unlocked', 'true')
    } else {
      setError(true)
      setPassword('')
    }
  }

  // Tela de bloqueio
  if (!isUnlocked) {
    return (
      <div className="min-h-screen gradient-startcup flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full bg-gradient-to-br from-[#0A1E47]/90 to-[#001A4D]/90 border-2 border-[#00E5FF]/40">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold gradient-text-startcup mb-2">Guia do Avaliador</h1>
            <p className="text-[#00E5FF]/70 text-sm">Acesso restrito apenas para avaliadores</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#00E5FF] mb-2">
                Senha de Acesso
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(false)
                }}
                placeholder="Digite a senha"
                className={`w-full px-4 py-3 bg-[#0A1E47]/60 border-2 rounded-lg text-white placeholder-[#00E5FF]/30 focus:outline-none focus:border-[#00E5FF] transition-colors ${
                  error ? 'border-red-500' : 'border-[#00E5FF]/40'
                }`}
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">❌ Senha incorreta. Tente novamente.</p>
              )}
            </div>

            <Button 
              type="submit"
              className="w-full bg-[#00E5FF] hover:bg-[#00D9FF] text-[#0A1E47] font-bold py-3 text-lg"
            >
              🔓 Desbloquear Guia
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#00E5FF]/20">
            <p className="text-[#00E5FF]/50 text-xs text-center">
              Se você é avaliador e não possui a senha, entre em contato com a organização.
            </p>
            <Link href="/login" className="block mt-3">
              <Button variant="outline" className="w-full border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/10">
                ← Voltar ao Login
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

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
            <Button 
              onClick={() => {
                localStorage.removeItem('guia_avaliador_unlocked')
                setIsUnlocked(false)
                setPassword('')
              }}
              variant="outline"
              className="border-red-400/40 text-red-400 hover:bg-red-400/10 text-sm"
            >
              🔒 Bloquear Guia
            </Button>
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

          {/* Seção: Detalhes das Quests por Fase */}
          <Card className="p-8 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
            <h2 className="text-2xl font-bold mb-6 text-[#00E5FF]">🎯 Critérios de Avaliação por Quest</h2>
            <p className="text-[#00E5FF]/90 mb-6 text-sm">
              Clique em cada fase para expandir e ver todas as quests com seus critérios de avaliação detalhados.
            </p>

            <div className="space-y-3">
              {/* FASE 1: DESCOBERTA */}
              <div className="border-2 border-[#00E5FF]/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedPhase(expandedPhase === 1 ? null : 1)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#667eea]/90 hover:to-[#764ba2]/90 transition-colors text-left flex items-center justify-between"
                >
                  <span className="font-bold text-white text-lg">🧭 FASE 1: DESCOBERTA (2h30min)</span>
                  <span className="text-white text-2xl font-bold">{expandedPhase === 1 ? '−' : '+'}</span>
                </button>
                {expandedPhase === 1 && (
                  <div className="p-6 bg-[#0A1E47]/30 space-y-4">
                    <p className="text-[#00E5FF] mb-4">🎯 <span className="font-bold">Objetivo:</span> Entender o mercado e o cliente</p>
                    
                    {/* Quest 1.1 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '1.1' ? null : '1.1')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 1.1 - 'Conhecendo o Terreno'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">100 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 60 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '1.1' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '1.1' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Análise do mercado através da técnica TAM (Total Addressable Market), SAM (Serviceable Available Market) e SOM (Serviceable Obtainable Market)</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Mapa visual com o mercado potencial e as estimativas de tamanho do mercado em faturamento</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Definição clara de TAM, SAM e SOM com dados realistas</li>
                            <li>Estimativas de faturamento fundamentadas</li>
                            <li>Visualização clara e profissional do mapa de mercado</li>
                            <li>Fontes de dados citadas</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quest 1.2 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '1.2' ? null : '1.2')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 1.2 - 'A Persona Secreta'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">50 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 50 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '1.2' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '1.2' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Definir o público-alvo da startup por meio da definição da persona</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Card visual da persona com pain points (pontos de dor) + Contatos de 10 pessoas a serem acionadas na fase de validação</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Persona bem definida com dados demográficos e comportamentais</li>
                            <li>Pain points identificados e relevantes</li>
                            <li>Lista de 10 contatos reais fornecida</li>
                            <li>Card visual atrativo e informativo</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quest 1.3 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '1.3' ? null : '1.3')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 1.3 - 'Construindo Pontes'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">50 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 30 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '1.3' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '1.3' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Desenvolver a estratégia de relacionamento com o público-alvo e estabelecimento dos canais de distribuição</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Mapa da jornada do cliente</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Jornada do cliente bem mapeada (awareness → purchase → loyalty)</li>
                            <li>Touchpoints identificados em cada etapa</li>
                            <li>Canais de distribuição definidos e justificados</li>
                            <li>Estratégia de relacionamento clara</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* BOSS 1 */}
                    <div className="border-2 border-[#FF3D00] rounded-lg overflow-hidden bg-gradient-to-r from-[#FF3D00]/20 to-[#DC2626]/20">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === 'boss1' ? null : 'boss1')}
                        className="w-full px-4 py-3 bg-[#FF3D00]/60 hover:bg-[#FF3D00]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">🏆 BOSS DA FASE - Pitch de Descoberta</span>
                          <span className="text-xs bg-white text-[#FF3D00] px-2 py-1 rounded-full font-bold">100 pts</span>
                          <span className="text-xs bg-white text-[#FF3D00] px-2 py-1 rounded-full">⏱️ 10 min</span>
                        </div>
                        <span className="text-white text-xl font-bold">{expandedQuest === 'boss1' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === 'boss1' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-white text-sm space-y-2">
                          <p><span className="font-bold">Tarefa:</span> Pitch de 2 minutos sobre "Para quem você está resolvendo e por quê?"</p>
                          <p className="font-bold text-[#FFD700]">⚠️ IMPORTANTE: Boss Battles não usam multiplicador! (0-100 pontos fixos)</p>
                          <p className="pt-2"><span className="font-bold">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Clareza na definição do público-alvo</li>
                            <li>Argumentação convincente sobre o "por quê"</li>
                            <li>Uso de dados e insights da pesquisa</li>
                            <li>Apresentação profissional e dentro do tempo</li>
                            <li>Capacidade de convencer sobre a relevância do problema</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* FASE 2: CRIAÇÃO */}
              <div className="border-2 border-[#00E5FF]/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedPhase(expandedPhase === 2 ? null : 2)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#a855f7] to-[#ec4899] hover:from-[#a855f7]/90 hover:to-[#ec4899]/90 transition-colors text-left flex items-center justify-between"
                >
                  <span className="font-bold text-white text-lg">💡 FASE 2: CRIAÇÃO (3h30min)</span>
                  <span className="text-white text-2xl font-bold">{expandedPhase === 2 ? '−' : '+'}</span>
                </button>
                {expandedPhase === 2 && (
                  <div className="p-6 bg-[#0A1E47]/30 space-y-4">
                    <p className="text-[#00E5FF] mb-4">🎯 <span className="font-bold">Objetivo:</span> Desenvolver a solução</p>
                    
                    {/* Quest 2.1 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '2.1' ? null : '2.1')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 2.1 - 'A Grande Ideia'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">100 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 50 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '2.1' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '2.1' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Proposta de valor única + Canvas preenchido</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Canvas completo + tagline</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Business Model Canvas completamente preenchido</li>
                            <li>Proposta de valor clara e diferenciada</li>
                            <li>Tagline memorável e alinhado com a proposta</li>
                            <li>Coerência entre todos os blocos do canvas</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quest 2.2 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '2.2' ? null : '2.2')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 2.2 - 'Identidade Secreta'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">50 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 30 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '2.2' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '2.2' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Nome e logotipo da startup</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Identidade visual básica</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Nome da startup relevante e memorável</li>
                            <li>Logotipo profissional e adequado ao negócio</li>
                            <li>Identidade visual coerente (cores, tipografia)</li>
                            <li>Aplicabilidade em diferentes contextos</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quest 2.3 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '2.3' ? null : '2.3')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 2.3 - 'Prova de Conceito'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">150 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 120 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '2.3' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '2.3' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Desenvolver o protótipo navegável da solução (Figma/slides/demo)</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Protótipo funcional</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Protótipo navegável e funcional</li>
                            <li>Features principais implementadas</li>
                            <li>UX/UI intuitivo e profissional</li>
                            <li>Demonstra claramente a proposta de valor</li>
                            <li>Qualidade visual e atenção aos detalhes</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* BOSS 2 */}
                    <div className="border-2 border-[#FF3D00] rounded-lg overflow-hidden bg-gradient-to-r from-[#FF3D00]/20 to-[#DC2626]/20">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === 'boss2' ? null : 'boss2')}
                        className="w-full px-4 py-3 bg-[#FF3D00]/60 hover:bg-[#FF3D00]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">🏆 BOSS DA FASE - Demo do Protótipo</span>
                          <span className="text-xs bg-white text-[#FF3D00] px-2 py-1 rounded-full font-bold">100 pts</span>
                          <span className="text-xs bg-white text-[#FF3D00] px-2 py-1 rounded-full">⏱️ 10 min</span>
                        </div>
                        <span className="text-white text-xl font-bold">{expandedQuest === 'boss2' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === 'boss2' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-white text-sm space-y-2">
                          <p><span className="font-bold">Tarefa:</span> Demo de 2 minutos do protótipo em funcionamento</p>
                          <p className="font-bold text-[#FFD700]">⚠️ IMPORTANTE: Boss Battles não usam multiplicador! (0-100 pontos fixos)</p>
                          <p className="pt-2"><span className="font-bold">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Demonstração clara das funcionalidades principais</li>
                            <li>Fluidez na navegação do protótipo</li>
                            <li>Explicação concisa e objetiva</li>
                            <li>Protótipo realmente funciona conforme demonstrado</li>
                            <li>Impacto visual e profissionalismo</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* FASE 3: ESTRATÉGIA */}
              <div className="border-2 border-[#00E5FF]/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedPhase(expandedPhase === 3 ? null : 3)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#f97316] to-[#ef4444] hover:from-[#f97316]/90 hover:to-[#ef4444]/90 transition-colors text-left flex items-center justify-between"
                >
                  <span className="font-bold text-white text-lg">🎯 FASE 3: ESTRATÉGIA (2h30min)</span>
                  <span className="text-white text-2xl font-bold">{expandedPhase === 3 ? '−' : '+'}</span>
                </button>
                {expandedPhase === 3 && (
                  <div className="p-6 bg-[#0A1E47]/30 space-y-4">
                    <p className="text-[#00E5FF] mb-4">🎯 <span className="font-bold">Objetivo:</span> Planejar a operação</p>
                    
                    {/* Quest 3.1 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '3.1' ? null : '3.1')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 3.1 - 'Montando o Exército'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">50 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 40 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '3.1' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '3.1' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Identificar as atividades-chave e os recursos necessários para operação da startup</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Mapa de operações</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Atividades-chave bem identificadas e justificadas</li>
                            <li>Recursos necessários mapeados (humanos, físicos, tecnológicos)</li>
                            <li>Fluxo operacional claro</li>
                            <li>Viabilidade operacional demonstrada</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quest 3.2 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '3.2' ? null : '3.2')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 3.2 - 'Aliados Estratégicos'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">50 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 30 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '3.2' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '3.2' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Definir 2 parceiros-chave</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Proposta de valor para parceiros</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Dois parceiros-chave identificados e relevantes</li>
                            <li>Proposta de valor win-win para cada parceiro</li>
                            <li>Justificativa estratégica das parcerias</li>
                            <li>Benefícios mútuos claramente articulados</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quest 3.3 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '3.3' ? null : '3.3')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 3.3 - 'Show Me The Money'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">100 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 70 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '3.3' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '3.3' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Estrutura de custos e receitas + Indicadores financeiros + Estratégia de precificação</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Dashboard financeiro simplificado</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Estrutura de custos detalhada e realista</li>
                            <li>Fluxos de receita bem definidos</li>
                            <li>Estratégia de precificação fundamentada</li>
                            <li>Indicadores financeiros (break-even, margem, etc.)</li>
                            <li>Dashboard visual e compreensível</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* BOSS 3 */}
                    <div className="border-2 border-[#FF3D00] rounded-lg overflow-hidden bg-gradient-to-r from-[#FF3D00]/20 to-[#DC2626]/20">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === 'boss3' ? null : 'boss3')}
                        className="w-full px-4 py-3 bg-[#FF3D00]/60 hover:bg-[#FF3D00]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">🏆 BOSS DA FASE - Defesa do Modelo de Negócio</span>
                          <span className="text-xs bg-white text-[#FF3D00] px-2 py-1 rounded-full font-bold">100 pts</span>
                          <span className="text-xs bg-white text-[#FF3D00] px-2 py-1 rounded-full">⏱️ 10 min</span>
                        </div>
                        <span className="text-white text-xl font-bold">{expandedQuest === 'boss3' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === 'boss3' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-white text-sm space-y-2">
                          <p><span className="font-bold">Tarefa:</span> Defender o modelo de negócio em 3 minutos</p>
                          <p className="font-bold text-[#FFD700]">⚠️ IMPORTANTE: Boss Battles não usam multiplicador! (0-100 pontos fixos)</p>
                          <p className="pt-2"><span className="font-bold">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Explicação clara do modelo de negócio</li>
                            <li>Viabilidade financeira demonstrada</li>
                            <li>Argumentação convincente sobre escalabilidade</li>
                            <li>Capacidade de defender números e projeções</li>
                            <li>Confiança e profissionalismo na apresentação</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* FASE 4: REFINAMENTO */}
              <div className="border-2 border-[#00E5FF]/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedPhase(expandedPhase === 4 ? null : 4)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#10b981] to-[#14b8a6] hover:from-[#10b981]/90 hover:to-[#14b8a6]/90 transition-colors text-left flex items-center justify-between"
                >
                  <span className="font-bold text-white text-lg">✨ FASE 4: REFINAMENTO (2h)</span>
                  <span className="text-white text-2xl font-bold">{expandedPhase === 4 ? '−' : '+'}</span>
                </button>
                {expandedPhase === 4 && (
                  <div className="p-6 bg-[#0A1E47]/30 space-y-4">
                    <p className="text-[#00E5FF] mb-4">🎯 <span className="font-bold">Objetivo:</span> Polir e validar</p>
                    
                    {/* Quest 4.1 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '4.1' ? null : '4.1')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 4.1 - 'Teste de Fogo'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">50 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 40 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '4.1' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '4.1' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Simular o uso do produto + Identificar falhas e melhorar</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Versão 2.0 do protótipo</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Melhorias visíveis em relação à versão anterior</li>
                            <li>Falhas identificadas e corrigidas</li>
                            <li>Simulação de uso documentada</li>
                            <li>Refinamento de UX/UI</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quest 4.2 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '4.2' ? null : '4.2')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 4.2 - 'Validação de Mercado'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">50 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 40 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '4.2' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '4.2' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Pesquisa rápida (Validar com 5+ pessoas)</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Relatório de validação</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Validação realizada com pelo menos 5 pessoas</li>
                            <li>Metodologia de pesquisa aplicada</li>
                            <li>Feedback documentado e analisado</li>
                            <li>Insights e ajustes propostos</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quest 4.3 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '4.3' ? null : '4.3')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 4.3 - 'Números que Convencem'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">50 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 30 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '4.3' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '4.3' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Refinar projeções financeiras</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Planilha de viabilidade</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Projeções financeiras refinadas e realistas</li>
                            <li>Cenários otimista, realista e pessimista</li>
                            <li>Indicadores de viabilidade claros</li>
                            <li>Planilha bem estruturada e profissional</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* BOSS 4 */}
                    <div className="border-2 border-[#FF3D00] rounded-lg overflow-hidden bg-gradient-to-r from-[#FF3D00]/20 to-[#DC2626]/20">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === 'boss4' ? null : 'boss4')}
                        className="w-full px-4 py-3 bg-[#FF3D00]/60 hover:bg-[#FF3D00]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">🏆 BOSS DA FASE - Simulação de Pitch</span>
                          <span className="text-xs bg-white text-[#FF3D00] px-2 py-1 rounded-full font-bold">100 pts</span>
                          <span className="text-xs bg-white text-[#FF3D00] px-2 py-1 rounded-full">⏱️ 10 min</span>
                        </div>
                        <span className="text-white text-xl font-bold">{expandedQuest === 'boss4' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === 'boss4' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-white text-sm space-y-2">
                          <p><span className="font-bold">Tarefa:</span> Simulação de pitch com jurado surpresa</p>
                          <p className="font-bold text-[#FFD700]">⚠️ IMPORTANTE: Boss Battles não usam multiplicador! (0-100 pontos fixos)</p>
                          <p className="pt-2"><span className="font-bold">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Estrutura do pitch bem organizada</li>
                            <li>Clareza e objetividade na comunicação</li>
                            <li>Capacidade de responder perguntas</li>
                            <li>Demonstração de confiança e preparação</li>
                            <li>Impacto e persuasão da apresentação</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* FASE 5: O PITCH */}
              <div className="border-2 border-[#00E5FF]/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedPhase(expandedPhase === 5 ? null : 5)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#ec4899] to-[#f43f5e] hover:from-[#ec4899]/90 hover:to-[#f43f5e]/90 transition-colors text-left flex items-center justify-between"
                >
                  <span className="font-bold text-white text-lg">🚀 FASE 5: O PITCH DEFINITIVO (1h30min)</span>
                  <span className="text-white text-2xl font-bold">{expandedPhase === 5 ? '−' : '+'}</span>
                </button>
                {expandedPhase === 5 && (
                  <div className="p-6 bg-[#0A1E47]/30 space-y-4">
                    <p className="text-[#00E5FF] mb-4">🎯 <span className="font-bold">Objetivo:</span> Criar apresentação matadora</p>
                    
                    {/* Quest 5.1 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '5.1' ? null : '5.1')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 5.1 - 'A História Épica'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">75 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 20 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '5.1' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '5.1' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Estruturar narrativa do pitch + storytelling da solução (Pitch de 5 minutos)</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Storyline do pitch</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Narrativa envolvente e bem estruturada</li>
                            <li>Storytelling aplicado de forma efetiva</li>
                            <li>Sequência lógica e convincente</li>
                            <li>Conexão emocional com a audiência</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quest 5.2 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '5.2' ? null : '5.2')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 5.2 - 'Slides de Impacto'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">50 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 40 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '5.2' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '5.2' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Criar apresentação visual, sequência de slides: Capa → Dor/Necessidade → Solução → Mercado → Faturamento → Livre</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Deck completo</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Deck com todos os slides obrigatórios</li>
                            <li>Design visual profissional e impactante</li>
                            <li>Informações claras e objetivas</li>
                            <li>Identidade visual consistente</li>
                            <li>Slides adicionais relevantes e bem pensados</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quest 5.3 */}
                    <div className="border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedQuest(expandedQuest === '5.3' ? null : '5.3')}
                        className="w-full px-4 py-3 bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#00E5FF]">Quest 5.3 - 'Ensaio Geral'</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">25 pts</span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">⏱️ 30 min</span>
                        </div>
                        <span className="text-[#00E5FF] text-xl font-bold">{expandedQuest === '5.3' ? '−' : '+'}</span>
                      </button>
                      {expandedQuest === '5.3' && (
                        <div className="px-4 py-3 bg-[#0A1E47]/20 text-[#00E5FF]/90 text-sm space-y-2">
                          <p><span className="font-bold text-[#00E5FF]">Tarefa:</span> Treinar pitch + ajustar timing (5 minutos)</p>
                          <p><span className="font-bold text-[#00E5FF]">Entrega:</span> Pitch cronometrado</p>
                          <p className="pt-2"><span className="font-bold text-[#00E5FF]">Critérios de Avaliação:</span></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Pitch ensaiado e cronometrado</li>
                            <li>Timing respeitado (5 minutos)</li>
                            <li>Fluidez na apresentação</li>
                            <li>Preparação visível da equipe</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-[#0A1E47]/60 p-4 rounded-lg border-2 border-[#00E5FF]/50">
              <p className="text-[#00E5FF]/90 text-sm">
                <span className="font-bold text-[#00E5FF]">💡 Dica de Avaliação:</span> Use estes critérios como guia, mas considere também criatividade, esforço e contexto da equipe. O multiplicador (1.0 a 2.0) permite reconhecer trabalhos excepcionais - APENAS para quests regulares. Boss Battles recebem pontuação fixa de 0 a 100 sem multiplicador.
              </p>
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
