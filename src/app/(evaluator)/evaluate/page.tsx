import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Header from '@/components/Header'

export default async function EvaluatorDashboard() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar se é avaliador
  const userRole = user.user_metadata?.role
  if (userRole !== 'evaluator') {
    redirect('/login')
  }

  // Buscar informações do avaliador
  const { data: evaluator, error: evaluatorError } = await supabase
    .from('evaluators')
    .select('*')
    .eq('email', user.email)
    .single()

  // Debug: Log para verificar se o avaliador existe
  console.log('🔍 Evaluator lookup:', {
    email: user.email,
    evaluator: evaluator,
    error: evaluatorError
  })

  // Se o avaliador não existe, mostrar erro
  if (!evaluator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro de Acesso</h2>
          <p className="text-gray-700 mb-4">
            Não foi encontrado um registro de avaliador para o email: <strong>{user.email}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Entre em contato com o administrador para cadastrar seu email como avaliador.
          </p>
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
            Error: {evaluatorError?.message || 'Evaluator not found'}
          </div>
        </Card>
      </div>
    )
  }

  // Buscar submissions pendentes para avaliar
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select(`
      *,
      team:team_id (
        name,
        course
      ),
      quest:quest_id (
        name,
        max_points,
        phase_id
      )
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  // Debug: Log para verificar submissions
  console.log('📦 Submissions query:', {
    count: submissions?.length || 0,
    error: submissionsError,
    submissions: submissions
  })

  // Buscar submissions já avaliadas por este avaliador
  const { data: evaluatedSubmissions } = await supabase
    .from('evaluations')
    .select('submission_id')
    .eq('evaluator_id', evaluator?.id)

  const evaluatedIds = evaluatedSubmissions?.map(e => e.submission_id) || []

  // Filtrar apenas submissions que ainda não foram avaliadas por este avaliador
  const pendingForMe = submissions?.filter(s => !evaluatedIds.includes(s.id)) || []

  // Buscar submissions já avaliadas com detalhes completos
  const { data: myEvaluations } = await supabase
    .from('evaluations')
    .select(`
      *,
      submission:submission_id (
        id,
        submitted_at,
        team:team_id (
          name,
          course
        ),
        quest:quest_id (
          name,
          max_points
        )
      )
    `)
    .eq('evaluator_id', evaluator?.id)
    .order('created_at', { ascending: false })

  console.log('✅ My evaluations:', myEvaluations)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`Bem-vindo, ${evaluator?.name || 'Avaliador'}! ⭐`}
        subtitle={evaluator?.specialty || 'Avaliador Geral'}
        showLogout={true}
      />

      <div className="container mx-auto p-6">
        <div className="grid gap-6">
          {/* Estatísticas */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Total Submissions</h3>
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {submissions?.length || 0}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Já Avaliadas</h3>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {evaluatedIds.length}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Pendentes</h3>
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-3xl font-bold text-orange-600">
                {pendingForMe.length}
              </p>
            </Card>
          </div>

          {/* Lista de Entregas */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">📋 Entregas para Avaliar</h2>
            {pendingForMe && pendingForMe.length > 0 ? (
              <div className="space-y-4">
                {pendingForMe.map((submission: any) => {
                  console.log('🎯 Rendering submission:', {
                    id: submission.id,
                    file_url: submission.file_url,
                    team: submission.team?.name,
                    quest: submission.quest?.name
                  })

                  return (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{submission.team?.name}</h3>
                        <p className="text-gray-600">{submission.quest?.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {submission.team?.course} • Max: {submission.quest?.max_points} pontos
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Enviado em: {new Date(submission.submitted_at).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          ID: {submission.id}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {submission.file_url ? (
                          <a
                            href={submission.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <Button variant="outline" className="w-full">
                              📄 Ver PDF
                            </Button>
                          </a>
                        ) : (
                          <Button variant="outline" className="w-full" disabled>
                            📄 Sem arquivo
                          </Button>
                        )}
                        <Link href={`/evaluate/${submission.id}`}>
                          <Button className="bg-purple-600 hover:bg-purple-700 w-full">
                            ⭐ Avaliar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-600">
                {submissions?.length === 0
                  ? "Nenhuma entrega cadastrada no momento."
                  : "Você já avaliou todas as entregas disponíveis! ✨"
                }
              </p>
            )}
          </Card>

          {/* Minhas Avaliações */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">📝 Minhas Avaliações</h2>
            {myEvaluations && myEvaluations.length > 0 ? (
              <div className="space-y-3">
                {myEvaluations.map((evaluation: any) => (
                  <div
                    key={evaluation.id}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-green-900">
                          {evaluation.submission?.team?.name}
                        </h3>
                        <p className="text-green-700 text-sm">
                          {evaluation.submission?.quest?.name}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {evaluation.submission?.team?.course}
                        </p>
                        <div className="flex gap-2 mt-2 text-xs text-green-800">
                          <span className="font-medium">
                            📊 {evaluation.points} pontos
                          </span>
                          <span>•</span>
                          <span>
                            Avaliado em {new Date(evaluation.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <Link href={`/evaluate/${evaluation.submission_id}`}>
                        <Button variant="outline" size="sm" className="ml-4">
                          ✏️ Editar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                Você ainda não fez nenhuma avaliação.
              </p>
            )}
          </Card>

          {/* Informações */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">ℹ️ Informações</h2>
            <div className="space-y-2 text-gray-700">
              <p>• Você pode editar suas avaliações a qualquer momento</p>
              <p>• Cada equipe deve ser avaliada em todos os critérios</p>
              <p>• Suas avaliações serão anônimas para as equipes</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
