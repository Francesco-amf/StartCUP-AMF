'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Team {
  id: string
  name: string
  course: string
}

interface TeamPoints {
  team_id: string
  total_points: number
}

export default function AMFCoinsManager() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamPoints, setTeamPoints] = useState<{ [key: string]: number }>({})
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [coinsAmount, setCoinsAmount] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // Atualizar a cada 5s
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    // Buscar equipes
    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, name, course')
      .order('name')

    if (teamsData) {
      setTeams(teamsData)
    }

    // Buscar pontuação atual de cada equipe
    const { data: rankingData } = await supabase
      .from('live_ranking')
      .select('team_id, total_points')

    if (rankingData) {
      const points: { [key: string]: number } = {}
      rankingData.forEach((r: TeamPoints) => {
        points[r.team_id] = r.total_points || 0
      })
      setTeamPoints(points)
    }
  }

  async function addCoins() {
    if (!selectedTeam) {
      setMessage({ text: 'Selecione uma equipe', type: 'error' })
      return
    }

    const amount = parseInt(coinsAmount)
    if (isNaN(amount) || amount === 0) {
      setMessage({ text: 'Digite um valor válido (positivo ou negativo)', type: 'error' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const team = teams.find(t => t.id === selectedTeam)
      if (!team) throw new Error('Equipe não encontrada')

      // Inserir ajuste na tabela coin_adjustments
      const { error } = await supabase
        .from('coin_adjustments')
        .insert({
          team_id: selectedTeam,
          amount: amount,
          reason: reason.trim() || 'Ajuste manual'
        })

      if (error) throw error

      setMessage({ 
        text: `${amount > 0 ? '+' : ''}${amount} AMF Coins ${amount > 0 ? 'adicionados a' : 'removidos de'} ${team.name}!`, 
        type: 'success' 
      })
      
      // Limpar campos
      setSelectedTeam('')
      setCoinsAmount('')
      setReason('')
      
      await loadData()
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 md:p-6 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 border-[#00E5FF]/30 backdrop-blur">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🪙</span>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#00E5FF]">
            Gerenciar AMF Coins
          </h2>
          <p className="text-xs md:text-sm text-gray-400">
            Adicionar ou remover coins de equipes manualmente
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
            : 'bg-red-500/20 border border-red-500/50 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* Seleção de Equipe */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Equipe
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 bg-[#0A1E47]/60 border border-[#00E5FF]/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50"
          >
            <option value="" className="bg-[#0A1E47] text-gray-400">Selecione uma equipe...</option>
            {teams.map(team => (
              <option key={team.id} value={team.id} className="bg-[#0A1E47] text-white">
                {team.name} - {team.course} ({teamPoints[team.id] || 0} coins)
              </option>
            ))}
          </select>
        </div>

        {/* Quantidade de Coins */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quantidade (use - para remover)
          </label>
          <Input
            type="number"
            value={coinsAmount}
            onChange={(e) => setCoinsAmount(e.target.value)}
            placeholder="Ex: 50 ou -20"
            className="bg-[#0A1E47]/60 border-[#00E5FF]/30 text-white"
          />
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Motivo (opcional)
          </label>
          <Input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Ajuste manual, bônus especial... (padrão: 'Ajuste manual')"
            className="bg-[#0A1E47]/60 border-[#00E5FF]/30 text-white"
          />
        </div>

        {/* Botão */}
        <Button
          onClick={addCoins}
          disabled={loading || !selectedTeam || !coinsAmount}
          className="w-full bg-gradient-to-r from-[#00E5FF] to-[#0091EA] hover:from-[#00B8D4] hover:to-[#00838F] text-[#0A0F1E] font-bold"
        >
          {loading ? '⏳ Processando...' : '💰 Aplicar Ajuste'}
        </Button>
      </div>

      {/* Preview de Coins Atual */}
      {selectedTeam && (
        <div className="mt-4 p-3 bg-[#0A1E47]/40 border border-[#00E5FF]/20 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Coins atuais:</span>
            <span className="text-[#00E5FF] font-bold text-lg">
              {teamPoints[selectedTeam] || 0}
            </span>
          </div>
          {coinsAmount && !isNaN(parseInt(coinsAmount)) && (
            <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-[#00E5FF]/20">
              <span className="text-gray-400">Após ajuste:</span>
              <span className="text-green-400 font-bold text-lg">
                {(teamPoints[selectedTeam] || 0) + parseInt(coinsAmount)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Lista de Equipes com Pontuação */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Ranking Atual</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {teams
            .sort((a, b) => (teamPoints[b.id] || 0) - (teamPoints[a.id] || 0))
            .map((team, index) => (
              <div
                key={team.id}
                className="flex justify-between items-center p-2 bg-[#0A1E47]/40 rounded-lg hover:bg-[#0A1E47]/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-sm text-white">{team.name}</span>
                </div>
                <span className="text-sm font-bold text-[#00E5FF]">
                  {teamPoints[team.id] || 0} 🪙
                </span>
              </div>
            ))}
        </div>
      </div>
    </Card>
  )
}
