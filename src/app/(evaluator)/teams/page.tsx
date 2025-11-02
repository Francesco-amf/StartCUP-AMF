'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Header from '@/components/Header'

interface TeamWithSubmissions {
  id: string
  name: string
  course: string
  pending_count: number
  total_submissions: number
}

export default function EvaluatorDashboard() {
  const [teams, setTeams] = useState<TeamWithSubmissions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchTeamsWithSubmissions = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          setError('Usuário não autenticado')
          return
        }
        setUser(currentUser)

        // Buscar todas as equipes
        const { data: allTeams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, course')
          .neq('email', currentUser.email) // Excluir equipe do avaliador, se houver

        if (teamsError) throw teamsError

        // Para cada equipe, contar submissões pendentes e totais
        const teamsWithCounts = await Promise.all(
          (allTeams || []).map(async (team) => {
            const { count: totalCount } = await supabase
              .from('submissions')
              .select('id', { count: 'exact' })
              .eq('team_id', team.id)

            const { count: pendingCount } = await supabase
              .from('submissions')
              .select('id', { count: 'exact' })
              .eq('team_id', team.id)
              .eq('status', 'pending')

            return {
              ...team,
              total_submissions: totalCount || 0,
              pending_count: pendingCount || 0
            }
          })
        )

        // Filtrar apenas equipes com submissões pendentes
        const teamsWithPending = teamsWithCounts.filter(t => t.pending_count > 0)
        setTeams(teamsWithPending)

        if (teamsWithPending.length === 0) {
          setError(null)
        }
      } catch (err) {
        console.error('Erro ao buscar equipes:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchTeamsWithSubmissions()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen gradient-startcup">
        <Header
          title="📋 Dashboard de Avaliação"
          subtitle="Carregando..."
          showLogout={true}
        />
        <div className="container mx-auto p-6">
          <Card className="p-6 text-center">
            <p className="text-[#00E5FF]">Carregando equipes...</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-startcup overflow-x-hidden">
      <Header
        title="📋 Dashboard de Avaliação"
        subtitle={user?.email || 'Avaliador'}
        showLogout={true}
      />

      <div className="w-screen px-2 py-2">
        <div className="grid gap-2 md:gap-3 p-3">
          {/* Resumo */}
          <Card className="p-1 md:p-2 lg:p-3 bg-gradient-to-r from-[#0A1E47] to-[#001A4D] border-2 border-[#00E5FF]/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm text-[#00E5FF] font-semibold mb-1">📊 RESUMO DE AVALIAÇÕES</p>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#00E5FF]">
                  {teams.length > 0 ? `${teams.length} equipe(s) com entregas pendentes` : 'Sem entregas pendentes'}
                </h2>
              </div>
            </div>
          </Card>

          {/* Lista de Equipes */}
          {error ? (
            <Card className="p-6 bg-red-500/10 border border-red-500">
              <p className="text-red-400">{error}</p>
            </Card>
          ) : teams.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg md:text-xl font-bold text-[#00E5FF] px-2">Equipes com Submissões Pendentes</h3>

              {teams.map((team, index) => (
                <Card
                  key={team.id}
                  className={`p-3 md:p-4 border-l-4 transition-all hover:shadow-lg ${
                    index % 3 === 0
                      ? 'bg-gradient-to-br from-[#1B4A7F] via-[#0F3860] to-[#0A1E47] border-l-[#0077FF]'
                      : index % 3 === 1
                      ? 'bg-gradient-to-br from-[#0B5A80] via-[#0A3A5A] to-[#0A1E47] border-l-[#00D4FF]'
                      : 'bg-gradient-to-br from-[#1B5A5A] via-[#0A4040] to-[#0A1E47] border-l-[#00FF88]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-bold text-white mb-1">
                        👥 {team.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-300 mb-2">
                        {team.course}
                      </p>
                      <div className="flex gap-4 flex-wrap">
                        <div>
                          <p className="text-xs text-[#00E5FF]/70">Pendentes:</p>
                          <p className="text-lg font-bold text-[#00FF88]">{team.pending_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#00E5FF]/70">Total:</p>
                          <p className="text-lg font-bold text-[#00D9FF]">{team.total_submissions}</p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/evaluator/evaluate/submissions?team_id=${team.id}&team_name=${encodeURIComponent(team.name)}`}
                    >
                      <Button className="bg-[#0077FF] hover:bg-[#0066FF] text-white font-bold px-6">
                        Avaliar 🚀
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 bg-gradient-to-br from-[#0A3A66] via-[#062850] to-[#0A1E47] border border-[#0066FF]/40 text-center">
              <p className="text-[#00E5FF] font-semibold mb-2">✅ Parabéns!</p>
              <p className="text-gray-300">
                Todas as submissões foram avaliadas. Aguarde novas entregas das equipes.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
