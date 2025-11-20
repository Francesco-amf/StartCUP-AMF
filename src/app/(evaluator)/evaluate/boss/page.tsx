'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import Header from '@/components/Header'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Team {
  id: string
  name: string
  logo_url?: string
}

interface BossQuest {
  id: string
  name: string
  max_points: number
  phase: {
    name: string
    order_index: number
  }
}

interface TeamEvaluation {
  team: Team
  points: number
  comments: string
  evaluated: boolean
}

export default function BossEvaluationPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [evaluator, setEvaluator] = useState<any>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [bossQuest, setBossQuest] = useState<BossQuest | null>(null)
  const [evaluations, setEvaluations] = useState<Map<string, TeamEvaluation>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClientComponentClient()
      
      // Buscar usuário e avaliador via Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        console.error('❌ [BossEvaluation] Usuário não autenticado')
        return
      }
      setUser(authUser)

      const evalRes = await fetch('/api/evaluator/me')
      const evalData = await evalRes.json()
      setEvaluator(evalData.evaluator)

      // Buscar Boss ativo atual
      const bossRes = await fetch('/api/quests/active-boss')
      const bossData = await bossRes.json()
      
      if (bossData.quest) {
        setBossQuest(bossData.quest)

        // Buscar todas as equipes
        const teamsRes = await fetch('/api/teams')
        const teamsData = await teamsRes.json()
        setTeams(teamsData.teams || [])

        // Buscar avaliações já existentes deste Boss
        const existingRes = await fetch(`/api/evaluate/boss/existing?quest_id=${bossData.quest.id}&evaluator_id=${evalData.evaluator.id}`)
        const existingData = await existingRes.json()

        // Inicializar map com avaliações existentes
        const evalMap = new Map<string, TeamEvaluation>()
        teamsData.teams?.forEach((team: Team) => {
          const existing = existingData.evaluations?.find((e: any) => e.team_id === team.id)
          evalMap.set(team.id, {
            team,
            points: existing?.points || 0,
            comments: existing?.comments || '',
            evaluated: !!existing
          })
        })
        setEvaluations(evalMap)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const handlePointsChange = (teamId: string, points: number) => {
    const current = evaluations.get(teamId)
    if (current) {
      setEvaluations(new Map(evaluations.set(teamId, {
        ...current,
        points
      })))
    }
  }

  const handleCommentsChange = (teamId: string, comments: string) => {
    const current = evaluations.get(teamId)
    if (current) {
      setEvaluations(new Map(evaluations.set(teamId, {
        ...current,
        comments
      })))
    }
  }

  const handleSave = async (teamId: string) => {
    const evaluation = evaluations.get(teamId)
    if (!evaluation || !bossQuest || !evaluator) return

    setSaving(teamId)

    try {
      const res = await fetch('/api/evaluate/boss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          quest_id: bossQuest.id,
          points: evaluation.points,
          comments: evaluation.comments,
          evaluator_id: evaluator.id
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Marcar como avaliado
        setEvaluations(new Map(evaluations.set(teamId, {
          ...evaluation,
          evaluated: true
        })))
        alert('✅ Boss avaliado com sucesso!')
      } else {
        alert(`❌ Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('❌ Erro ao salvar avaliação')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1E47] to-[#001A4D]">
        <Header
          title="🔥 Avaliação de Boss Battles"
          subtitle="Carregando..."
          showLogout={true}
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-[#00E5FF] text-lg">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (!bossQuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1E47] to-[#001A4D]">
        <Header
          title="🔥 Avaliação de Boss Battles"
          subtitle="Nenhum Boss ativo"
          showLogout={true}
        />
        <div className="max-w-4xl mx-auto p-6">
          <Card className="p-6 bg-[#0A1E47]/80 border border-[#FF9800]/40">
            <p className="text-[#FF9800] text-center">
              ⚠️ Não há Boss Battle ativo no momento.
            </p>
            <button
              onClick={() => router.push('/evaluate')}
              className="mt-4 w-full px-4 py-2 bg-[#00E5FF] text-[#0A1E47] rounded-lg font-bold hover:bg-[#00E5FF]/80"
            >
              ← Voltar para Dashboard
            </button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1E47] to-[#001A4D]">
      <Header
        title="🔥 Avaliação de Boss Battles"
        subtitle={user?.email || 'Avaliador'}
        showLogout={true}
      />

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Boss Info */}
        <Card className="p-4 md:p-6 mb-6 bg-gradient-to-br from-[#5A0A0A]/90 to-[#3A0A0A]/90 border-4 border-[#FF6B6B]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl md:text-2xl font-bold text-[#FF6B6B]">
              {bossQuest.name}
            </h2>
            <span className="bg-[#FF6B6B] text-white px-3 py-1 rounded-full text-sm font-bold">
              🔥 BOSS
            </span>
          </div>
          <p className="text-[#FF6B6B]/70 text-sm mb-2">
            {bossQuest.phase.name}
          </p>
          <p className="text-[#FFD700] font-bold">
            💰 {bossQuest.max_points} AMF Coins máximos
          </p>
        </Card>

        {/* Avaliações */}
        <div className="space-y-4">
          {teams.map((team) => {
            const evaluation = evaluations.get(team.id)
            if (!evaluation) return null

            return (
              <Card
                key={team.id}
                className={`p-4 md:p-6 border-2 ${
                  evaluation.evaluated
                    ? 'bg-[#0A3A5A]/60 border-[#00FF88]/40'
                    : 'bg-[#0A1E47]/60 border-[#00E5FF]/40'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  {team.logo_url && (
                    <img
                      src={team.logo_url}
                      alt={team.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#00E5FF]"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#00E5FF]">
                      {team.name}
                    </h3>
                    {evaluation.evaluated && (
                      <span className="text-xs text-[#00FF88]">
                        ✅ Já avaliado
                      </span>
                    )}
                  </div>
                </div>

                {/* Slider de pontos */}
                <div className="mb-4">
                  <label className="block text-sm text-[#00E5FF]/70 mb-2">
                    🪙 Pontos (0-100)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={evaluation.points}
                    onChange={(e) => handlePointsChange(team.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-[#00E5FF]/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #00E5FF 0%, #00E5FF ${evaluation.points}%, rgba(0,229,255,0.2) ${evaluation.points}%, rgba(0,229,255,0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-[#00E5FF]/50 mt-1">
                    <span>0</span>
                    <span className="text-2xl font-bold text-[#00E5FF]">
                      {evaluation.points}
                    </span>
                    <span>100</span>
                  </div>
                </div>

                {/* Comentários */}
                <div className="mb-4">
                  <label className="block text-sm text-[#00E5FF]/70 mb-2">
                    💬 Comentários (opcional)
                  </label>
                  <textarea
                    value={evaluation.comments}
                    onChange={(e) => handleCommentsChange(team.id, e.target.value)}
                    placeholder="Feedback sobre a apresentação..."
                    className="w-full px-3 py-2 bg-[#0A1E47]/80 border border-[#00E5FF]/30 rounded-lg text-[#00E5FF] placeholder-[#00E5FF]/30 text-sm"
                    rows={2}
                  />
                </div>

                {/* Botão Salvar */}
                <button
                  onClick={() => handleSave(team.id)}
                  disabled={saving === team.id}
                  className={`w-full px-4 py-3 rounded-lg font-bold transition-colors ${
                    evaluation.evaluated
                      ? 'bg-[#FF9800] hover:bg-[#FF9800]/80 text-white'
                      : 'bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A1E47]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving === team.id
                    ? '⏳ Salvando...'
                    : evaluation.evaluated
                    ? '🔄 Atualizar Avaliação'
                    : '✅ Salvar Avaliação'}
                </button>
              </Card>
            )
          })}
        </div>

        {/* Voltar */}
        <button
          onClick={() => router.push('/evaluate')}
          className="mt-6 w-full px-4 py-3 bg-[#0A1E47]/80 border border-[#00E5FF]/40 text-[#00E5FF] rounded-lg font-bold hover:bg-[#0A1E47]"
        >
          ← Voltar para Dashboard
        </button>
      </div>
    </div>
  )
}
