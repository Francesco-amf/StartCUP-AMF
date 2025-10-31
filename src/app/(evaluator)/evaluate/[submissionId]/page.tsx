import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Header from '@/components/Header'

export default async function EvaluateSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>
}) {
  // Next.js 15: params é uma Promise
  const { submissionId } = await params

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

  console.log('🔍 Evaluator lookup:', { evaluator, evaluatorError })

  // Buscar a submission
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select(`
      *,
      team:team_id (
        name,
        course,
        members
      ),
      quest:quest_id (
        name,
        description,
        max_points,
        phase_id
      )
    `)
    .eq('id', submissionId)
    .single()

  console.log('📦 Submission lookup:', {
    submissionId: submissionId,
    submission,
    submissionError
  })

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-4">Entrega não encontrada</h2>
          <p className="text-gray-700 mb-4">
            Não foi possível encontrar a entrega com ID: <strong>{submissionId}</strong>
          </p>
          {submissionError && (
            <div className="mb-4 p-3 bg-gray-100 rounded text-xs font-mono">
              Error: {submissionError.message}
            </div>
          )}
          <Link href="/evaluate">
            <Button>Voltar para Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Verificar se já foi avaliada por este avaliador
  const { data: existingEvaluations } = await supabase
    .from('evaluations')
    .select('*')
    .eq('submission_id', submissionId)
    .eq('evaluator_id', evaluator?.id)
    .order('created_at', { ascending: false })

  const existingEvaluation = existingEvaluations?.[0] // Pega a mais recente

  console.log('📄 File URL:', submission.file_url)
  console.log('✅ Existing evaluations:', existingEvaluations)
  console.log('✅ Using evaluation:', existingEvaluation)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Avaliar Entrega"
        backHref="/evaluate"
        showLogout={true}
      />

      <div className="container mx-auto p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informações da Entrega */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">📋 Informações</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Equipe</p>
                  <p className="font-bold text-lg">{submission.team?.name}</p>
                  <p className="text-gray-600">{submission.team?.course}</p>
                  <p className="text-sm text-gray-500 mt-1">{submission.team?.members}</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500">Quest</p>
                  <p className="font-bold">{submission.quest?.name}</p>
                  <p className="text-gray-600 text-sm mt-1">{submission.quest?.description}</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500">Pontuação Máxima</p>
                  <p className="font-bold text-2xl text-purple-600">{submission.quest?.max_points} pontos</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500">Data de Envio</p>
                  <p className="font-medium">{new Date(submission.submitted_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </Card>

            {/* Formulário de Avaliação */}
            {existingEvaluation ? (
              <div className="space-y-4">
                <Card className="p-6 bg-green-50 border-green-200">
                  <h2 className="text-2xl font-bold mb-4 text-green-700">✅ Já Avaliado</h2>
                  <div className="space-y-2">
                    <p className="text-green-800">
                      <strong>Pontuação:</strong> {existingEvaluation.points} / {submission.quest?.max_points}
                    </p>
                    <p className="text-green-800">
                      <strong>Comentário:</strong> {existingEvaluation.comments || 'Nenhum comentário'}
                    </p>
                    <p className="text-sm text-green-600 mt-4">
                      Avaliado em: {new Date(existingEvaluation.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </Card>

                {/* Permitir reavaliação */}
                <Card className="p-6 border-orange-200 bg-orange-50">
                  <h3 className="text-lg font-bold mb-2 text-orange-800">🔄 Reavaliar</h3>
                  <p className="text-sm text-orange-700 mb-4">
                    Você pode revisar e atualizar sua avaliação abaixo:
                  </p>
                  <form action="/api/evaluate" method="POST" className="space-y-4">
                    <input type="hidden" name="submission_id" value={submissionId} />
                    <input type="hidden" name="evaluator_id" value={evaluator?.id} />
                    <input type="hidden" name="is_update" value="true" />

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Pontuação Base (0 - {submission.quest?.max_points})
                      </label>
                      <input
                        type="number"
                        name="base_points"
                        min="0"
                        max={submission.quest?.max_points}
                        defaultValue={existingEvaluation.base_points || 0}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Pontos Bônus (0 - {submission.quest?.max_points})
                      </label>
                      <input
                        type="number"
                        name="bonus_points"
                        min="0"
                        max={submission.quest?.max_points}
                        defaultValue={existingEvaluation.bonus_points || 0}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Multiplicador (1.0x - 2.0x)
                      </label>
                      <input
                        type="number"
                        name="multiplier"
                        min="1"
                        max="2"
                        step="0.1"
                        defaultValue={existingEvaluation.multiplier || 1.0}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Comentários (opcional)
                      </label>
                      <textarea
                        name="comments"
                        rows={4}
                        defaultValue={existingEvaluation.comments || ''}
                        placeholder="Feedback para a equipe..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-600 focus:outline-none"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                      Atualizar Avaliação
                    </Button>
                  </form>
                </Card>
              </div>
            ) : (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">⭐ Avaliar</h2>
                <form action="/api/evaluate" method="POST" className="space-y-4">
                  <input type="hidden" name="submission_id" value={submissionId} />
                  <input type="hidden" name="evaluator_id" value={evaluator?.id} />

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Pontuação Base (0 - {submission.quest?.max_points})
                    </label>
                    <input
                      type="number"
                      name="base_points"
                      min="0"
                      max={submission.quest?.max_points}
                      defaultValue="0"
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Pontuação base de acordo com o cumprimento da quest
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Pontos Bônus (0 - {submission.quest?.max_points})
                    </label>
                    <input
                      type="number"
                      name="bonus_points"
                      min="0"
                      max={submission.quest?.max_points}
                      defaultValue="0"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Pontos extras por criatividade, inovação, qualidade excepcional
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Multiplicador (1.0x - 2.0x)
                    </label>
                    <input
                      type="number"
                      name="multiplier"
                      min="1"
                      max="2"
                      step="0.1"
                      defaultValue="1.0"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Multiplicador de dificuldade ou destaque
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      💡 Fórmula: (Pontuação Base + Bônus) × Multiplicador
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Comentários (opcional)
                    </label>
                    <textarea
                      name="comments"
                      rows={4}
                      placeholder="Feedback para a equipe..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                    Enviar Avaliação
                  </Button>
                </form>
              </Card>
            )}
          </div>

          {/* Visualização do PDF */}
          <div>
            <Card className="p-6 h-full">
              <h2 className="text-2xl font-bold mb-4">📄 Documento</h2>
              {submission.file_url ? (
                <>
                  <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '800px' }}>
                    <iframe
                      src={submission.file_url}
                      className="w-full h-full"
                      title="PDF Viewer"
                    />
                  </div>
                  <div className="mt-4">
                    <a
                      href={submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full"
                    >
                      <Button variant="outline" className="w-full">
                        Abrir em Nova Aba
                      </Button>
                    </a>
                  </div>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                    <strong>URL:</strong> {submission.file_url}
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                  <p className="font-semibold">Arquivo não disponível</p>
                  <p className="text-sm mt-2">
                    {submission.content ? (
                      <>
                        <strong>Conteúdo:</strong> {submission.content}
                      </>
                    ) : (
                      'Nenhum arquivo ou conteúdo foi enviado com esta submissão.'
                    )}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
