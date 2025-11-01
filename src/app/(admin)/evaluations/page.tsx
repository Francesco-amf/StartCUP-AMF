import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import Header from '@/components/Header'

export default async function AdminEvaluationsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar se é admin
  const userRole = user.user_metadata?.role
  if (userRole !== 'admin') {
    redirect('/login')
  }

  // Buscar todas as avaliações com detalhes
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select(`
      *,
      submission:submission_id (
        id,
        status,
        final_points,
        submitted_at,
        team:team_id (
          name,
          course
        ),
        quest:quest_id (
          name,
          max_points
        )
      ),
      evaluator:evaluator_id (
        name,
        email,
        specialty
      )
    `)
    .order('created_at', { ascending: false })

  // Buscar estatísticas
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')

  const evaluatedSubmissions = submissions?.filter(s => s.status === 'evaluated').length || 0
  const totalSubmissions = submissions?.length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Área de Avaliações"
        subtitle="Visualizar e gerenciar avaliações"
        backHref="/control-panel"
        showLogout={true}
      />

      <div className="container mx-auto p-6">
        <div className="grid gap-6">
          {/* Estatísticas */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Total de Entregas</h3>
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {totalSubmissions}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Avaliadas</h3>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {evaluatedSubmissions}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Pendentes</h3>
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-3xl font-bold text-orange-600">
                {totalSubmissions - evaluatedSubmissions}
              </p>
            </Card>
          </div>

          {/* Lista de Avaliações */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">📋 Todas as Avaliações</h2>
            {evaluations && evaluations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Equipe</th>
                      <th className="text-left p-3 font-semibold">Quest</th>
                      <th className="text-left p-3 font-semibold">Avaliador</th>
                      <th className="text-center p-3 font-semibold">Pontuação</th>
                      <th className="text-left p-3 font-semibold">Multiplicador</th>
                      <th className="text-left p-3 font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations.map((evaluation: any) => (
                      <tr key={evaluation.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">
                          {evaluation.submission?.team?.name}
                        </td>
                        <td className="p-3 text-gray-600">
                          {evaluation.submission?.quest?.name}
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-sm">
                              {evaluation.evaluator?.name}
                            </p>
                            {evaluation.evaluator?.specialty && (
                              <p className="text-xs text-gray-500">
                                {evaluation.evaluator.specialty}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-purple-600">
                            {evaluation.points}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {' / '}
                            {evaluation.submission?.quest?.max_points}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {evaluation.multiplier}x
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 text-xs">
                          {new Date(evaluation.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma avaliação registrada ainda.</p>
            )}
          </Card>

          {/* Avaliações por Avaliador */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">👥 Avaliações por Avaliador</h2>
            {evaluations && evaluations.length > 0 ? (
              <div className="space-y-4">
                {/* Agrupar por avaliador */}
                {Object.values(
                  evaluations.reduce((acc: any, evaluation: any) => {
                    const evaluatorId = evaluation.evaluator?.name || 'Desconhecido'
                    if (!acc[evaluatorId]) {
                      acc[evaluatorId] = {
                        evaluator: evaluation.evaluator,
                        evaluations: []
                      }
                    }
                    acc[evaluatorId].evaluations.push(evaluation)
                    return acc
                  }, {})
                ).map((group: any) => (
                  <div
                    key={group.evaluator?.email}
                    className="p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">
                          {group.evaluator?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {group.evaluator?.email}
                        </p>
                        {group.evaluator?.specialty && (
                          <p className="text-sm text-gray-500">
                            Especialidade: {group.evaluator.specialty}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-purple-600">
                          {group.evaluations.length}
                        </p>
                        <p className="text-xs text-gray-600">avaliações</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {group.evaluations.slice(0, 3).map((evaluation: any) => (
                        <div key={evaluation.id} className="text-sm p-2 bg-white rounded">
                          <p className="font-medium">
                            {evaluation.submission?.team?.name}
                          </p>
                          <p className="text-gray-600">
                            {evaluation.submission?.quest?.name} - {evaluation.points} pontos
                          </p>
                        </div>
                      ))}
                      {group.evaluations.length > 3 && (
                        <p className="text-xs text-gray-500 p-2">
                          +{group.evaluations.length - 3} mais avaliações
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma avaliação registrada ainda.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
