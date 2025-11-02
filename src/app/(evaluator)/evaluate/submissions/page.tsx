'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Header from '@/components/Header'

interface Submission {
  id: string
  quest_id: string
  status: string
  submitted_at: string
  file_url: string
  quest: {
    name: string
    max_points: number
    status: string
  }
  team: {
    name: string
    course: string
  }
}

function TeamSubmissionsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const teamId = searchParams.get('team_id')
  const teamName = searchParams.get('team_name')

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [evaluatedIds, setEvaluatedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [evaluator, setEvaluator] = useState<any>(null)

  useEffect(() => {
    if (!teamId) {
      setError('ID da equipe não fornecido')
      return
    }

    const fetchSubmissions = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Get evaluator info
        const { data: evaluatorData } = await supabase
          .from('evaluators')
          .select('*')
          .eq('email', user.email)
          .single()

        if (evaluatorData) {
          setEvaluator(evaluatorData)
        }

        // Fetch submissions for this team with pending status
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select(`
            id,
            quest_id,
            status,
            submitted_at,
            file_url,
            quest:quest_id (
              name,
              max_points,
              status
            ),
            team:team_id (
              name,
              course
            )
          `)
          .eq('team_id', teamId)
          .eq('status', 'pending')
          .in('quest.status', ['active', 'closed', 'completed'])
          .order('submitted_at', { ascending: true })

        if (submissionsError) throw submissionsError

        setSubmissions((submissionsData as unknown as Submission[]) || [])

        // Get evaluated submissions by this evaluator
        if (evaluatorData) {
          const { data: evaluatedData } = await supabase
            .from('evaluations')
            .select('submission_id')
            .eq('evaluator_id', evaluatorData.id)

          setEvaluatedIds(evaluatedData?.map(e => e.submission_id) || [])
        }
      } catch (err) {
        console.error('Erro ao buscar submissões:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [teamId, router])

  if (loading) {
    return (
      <div className="min-h-screen gradient-startcup">
        <Header
          title="📋 Submissões da Equipe"
          subtitle="Carregando..."
          backHref="/evaluator/teams"
          showLogout={true}
        />
        <div className="container mx-auto p-6">
          <Card className="p-6 text-center">
            <p className="text-[#00E5FF]">Carregando submissões...</p>
          </Card>
        </div>
      </div>
    )
  }

  const pendingSubmissions = submissions.filter(s => !evaluatedIds.includes(s.id))

  return (
    <div className="min-h-screen gradient-startcup">
      <Header
        title={`📋 ${decodeURIComponent(teamName || 'Equipe')}`}
        subtitle={`${submissions[0]?.team?.course || ''} • ${submissions.length} entrega(s)`}
        backHref="/evaluator/teams"
        showLogout={true}
      />

      <div className="container mx-auto p-6">
        <div className="grid gap-6">
          {/* Resumo */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 bg-gradient-to-br from-[#1B4A7F] via-[#0F3860] to-[#0A1E47] border-l-4 border-[#0077FF]">
              <h3 className="text-sm text-[#00E5FF]/70 font-semibold mb-1">Total</h3>
              <p className="text-2xl font-bold text-white">{submissions.length}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-[#1B5A5A] via-[#0A4040] to-[#0A1E47] border-l-4 border-[#00FF88]">
              <h3 className="text-sm text-[#00E5FF]/70 font-semibold mb-1">Pendentes</h3>
              <p className="text-2xl font-bold text-[#00FF88]">{pendingSubmissions.length}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-[#0B5A80] via-[#0A3A5A] to-[#0A1E47] border-l-4 border-[#00D4FF]">
              <h3 className="text-sm text-[#00E5FF]/70 font-semibold mb-1">Avaliadas</h3>
              <p className="text-2xl font-bold text-[#00D4FF]">{evaluatedIds.filter(id => submissions.some(s => s.id === id)).length}</p>
            </Card>
          </div>

          {/* Submissões Pendentes */}
          {error ? (
            <Card className="p-6 bg-red-500/10 border border-red-500">
              <p className="text-red-400">{error}</p>
            </Card>
          ) : pendingSubmissions.length > 0 ? (
            <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF9800]/40">
              <h2 className="text-2xl font-bold mb-4 text-[#FF9800]">⏳ Submissões Pendentes de Avaliação</h2>
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 bg-[#0A1E47]/40 border border-[#FF9800]/30 rounded-lg hover:bg-[#0A1E47]/60 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white">{submission.quest?.name}</h3>
                      <p className="text-[#FF9800] text-sm mt-1">Max: {submission.quest?.max_points} pontos</p>
                      <p className="text-xs text-[#FF9800]/60 mt-1">
                        Enviado em: {new Date(submission.submitted_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {submission.file_url ? (
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Button className="bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 border-2 border-[#00E5FF]/60 text-[#00E5FF] font-semibold">
                            📄 Ver PDF
                          </Button>
                        </a>
                      ) : (
                        <Button className="bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 border-2 border-[#00E5FF]/60 text-[#00E5FF]/50 font-semibold" disabled>
                          📄 Sem arquivo
                        </Button>
                      )}
                      <Link href={`/evaluator/evaluate/${submission.id}`}>
                        <Button className="bg-[#FF9800] hover:bg-[#F57C00] text-white font-semibold w-full">
                          ⭐ Avaliar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : submissions.length > 0 ? (
            <Card className="p-6 bg-gradient-to-br from-[#0A3A66] via-[#062850] to-[#0A1E47] border border-[#0066FF]/40 text-center">
              <p className="text-[#00E5FF] font-semibold mb-2">✅ Parabéns!</p>
              <p className="text-gray-300">
                Você já avaliou todas as submissões desta equipe.
              </p>
            </Card>
          ) : (
            <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border border-[#00E5FF]/40 text-center">
              <p className="text-[#00E5FF]">
                Esta equipe ainda não tem submissões.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeamSubmissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen gradient-startcup">
          <Header
            title="📋 Submissões da Equipe"
            subtitle="Carregando..."
            backHref="/evaluator/teams"
            showLogout={true}
          />
          <div className="container mx-auto p-6">
            <Card className="p-6 text-center">
              <p className="text-[#00E5FF]">Carregando submissões...</p>
            </Card>
          </div>
        </div>
      }
    >
      <TeamSubmissionsContent />
    </Suspense>
  )
}
