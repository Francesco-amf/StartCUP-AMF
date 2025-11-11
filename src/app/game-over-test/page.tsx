'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import EventEndCountdown from '@/components/EventEndCountdown'

interface Team {
  id: string
  name: string
  course: string
}

interface WinnerTeam {
  team_id: string
  team_name: string
  total_points: number
}

export default function GameOverTestPage() {
  const supabase = createClient()
  const [teams, setTeams] = useState<Team[]>([])
  const [ranking, setRanking] = useState<WinnerTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null)
  const [showGameOver, setShowGameOver] = useState(false)
  const [gameOverTime, setGameOverTime] = useState<string | null>(null)

  // Carregar times e ranking
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Buscar times
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, course')
          .order('name')

        if (!teamsError && teamsData) {
          setTeams(teamsData)
        }

        // Buscar ranking
        const { data: rankingData, error: rankingError } = await supabase
          .from('live_ranking')
          .select('team_id, team_name, total_points')
          .order('total_points', { ascending: false })

        if (!rankingError && rankingData) {
          setRanking(rankingData)
          if (rankingData.length > 0) {
            setSelectedWinner(rankingData[0].team_id)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Ativar game over com tempo definido
  const activateGameOver = () => {
    // Usa tempo atual + 10 segundos para simular a contagem regressiva
    const endTime = new Date(Date.now() + 10000).toISOString()
    setGameOverTime(endTime)
    setShowGameOver(true)
  }

  // Mostrar countdown imediato (5 segundos)
  const showCountdownNow = () => {
    // Usa tempo atual + 5 segundos
    const endTime = new Date(Date.now() + 5000).toISOString()
    setGameOverTime(endTime)
    setShowGameOver(true)
  }

  // Mostrar game over imediato (0 segundos)
  const showGameOverNow = () => {
    // Usa tempo já passado para ativar imediatamente o game over
    const endTime = new Date(Date.now() - 1000).toISOString()
    setGameOverTime(endTime)
    setShowGameOver(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1E47] to-[#001A4D] flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-2xl mb-4">⏳ Carregando dados...</p>
        </div>
      </div>
    )
  }

  // Se game over está ativo, mostrar o componente EventEndCountdown
  if (showGameOver && gameOverTime) {
    return <EventEndCountdown eventEndTime={gameOverTime} onEventEnd={() => {}} />
  }

  // Interface de teste
  return (
    <div className="h-screen bg-gradient-to-br from-[#0A1E47] to-[#001A4D] p-3 md:p-4 flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        {/* Header ultra compacto */}
        <div className="mb-2 flex-shrink-0">
          <h1 className="text-2xl md:text-3xl font-black text-[#00E5FF] leading-tight">
            🎮 Game Over Test
          </h1>
        </div>

        {/* Conteúdo principal - ocupa resto do espaço */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1 overflow-hidden">
          {/* Painel de Controle - Coluna 1 */}
          <Card className="p-3 bg-gradient-to-br from-[#0A2540] to-[#001A4D] border-[#00E5FF]/30 overflow-hidden">
            <div className="space-y-2 h-full flex flex-col">
              <h2 className="text-sm font-bold text-[#00E5FF] flex-shrink-0">
                ⚙️ Controles
              </h2>

              {/* Opções de ativação */}
              <div className="space-y-1.5 flex-1 flex flex-col">
                <Button
                  onClick={showCountdownNow}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xs h-9 flex-1"
                >
                  ⏰ 5s
                </Button>
                <Button
                  onClick={activateGameOver}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-9 flex-1"
                >
                  🎯 10s
                </Button>
                <Button
                  onClick={showGameOverNow}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 flex-1"
                >
                  💥 Go
                </Button>
              </div>

              {/* Reset */}
              <Button
                onClick={() => setShowGameOver(false)}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold text-xs h-8 flex-shrink-0"
              >
                ↻ Voltar
              </Button>
            </div>
          </Card>

          {/* Painel de Ranking - Coluna 2-4 */}
          <Card className="p-3 bg-gradient-to-br from-[#0A2540] to-[#001A4D] border-[#00E5FF]/30 md:col-span-3 overflow-hidden flex flex-col">
            <h2 className="text-sm font-bold text-[#00E5FF] mb-1.5 flex-shrink-0">
              🏆 Ranking
            </h2>

            {/* Lista de ranking em grade responsiva */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 flex-1 overflow-y-auto pr-1">
              {ranking.length === 0 ? (
                <p className="text-gray-400 text-center text-xs col-span-full py-2">
                  📊 Sem pontos
                </p>
              ) : (
                ranking.slice(0, 9).map((team, index) => (
                  <div
                    key={team.team_id}
                    className={`p-1.5 rounded border-2 cursor-pointer transition-all text-xs ${
                      selectedWinner === team.team_id
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF]'
                        : 'bg-white/5 border-white/10 hover:border-[#00E5FF]/50'
                    }`}
                    onClick={() => setSelectedWinner(team.team_id)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-lg flex-shrink-0">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold truncate text-xs">{team.team_name}</p>
                        <p className="text-gray-400 text-xs">💰 {team.total_points}</p>
                      </div>
                      {selectedWinner === team.team_id && (
                        <span className="text-[#00E5FF] text-lg flex-shrink-0">✓</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Info do vencedor selecionado */}
            {selectedWinner && ranking.length > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-[#00E5FF]/20 bg-[#00E5FF]/10 p-1.5 rounded border border-[#00E5FF]/30 flex-shrink-0">
                {ranking
                  .filter((t) => t.team_id === selectedWinner)
                  .map((team) => (
                    <div key={team.team_id}>
                      <p className="text-white font-bold text-xs truncate">{team.team_name}</p>
                      <p className="text-[#00E5FF] font-semibold text-xs">💰 {team.total_points}</p>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>

        {/* Informações - Minimalista */}
        <Card className="mt-2 p-2 bg-blue-900/30 border-[#00E5FF]/20 flex-shrink-0 text-xs">
          <div className="text-gray-300 grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-0.5">
            <span>🟡 5s = countdown</span>
            <span>🟠 10s = delay</span>
            <span>🔴 Go = instant</span>
            <span>✓ click rank</span>
            <span>↩️ back</span>
            <span>realtime data</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
