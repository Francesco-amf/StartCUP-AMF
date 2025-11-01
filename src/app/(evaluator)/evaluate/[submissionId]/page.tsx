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
      <div className="min-h-screen gradient-startcup p-6 flex items-center justify-center">
        <Card className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF3D00]/40">
          <h2 className="text-xl font-bold text-[#FF3D00] mb-4">Entrega não encontrada</h2>
          <p className="text-[#00E5FF] mb-4">
            Não foi possível encontrar a entrega com ID: <strong>{submissionId}</strong>
          </p>
          {submissionError && (
            <div className="mb-4 p-3 bg-[#FF3D00]/20 rounded text-xs font-mono text-[#FF6B47] border border-[#FF3D00]/40">
              Error: {submissionError.message}
            </div>
          )}
          <Link href="/evaluate">
            <Button className="bg-[#00E5FF] hover:bg-[#00D9FF] text-[#0A1E47] font-semibold">Voltar para Dashboard</Button>
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
    <div className="min-h-screen gradient-startcup">
      <Header
        title="Avaliar Entrega"
        backHref="/evaluate"
        showLogout={true}
      />

      <div className="container mx-auto p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informações da Entrega */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
              <h2 className="text-2xl font-bold mb-4 text-[#00E5FF]">📋 Informações</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#00E5FF]/70">Equipe</p>
                  <p className="font-bold text-lg text-white">{submission.team?.name}</p>
                  <p className="text-[#00E5FF]">{submission.team?.course}</p>
                  <p className="text-sm text-[#00E5FF]/70 mt-1">{submission.team?.members}</p>
                </div>

                <div className="pt-3 border-t border-[#00E5FF]/20">
                  <p className="text-sm text-[#00E5FF]/70">Quest</p>
                  <p className="font-bold text-white">{submission.quest?.name}</p>
                  <p className="text-[#00E5FF] text-sm mt-1">{submission.quest?.description}</p>
                </div>

                <div className="pt-3 border-t border-[#00E5FF]/20">
                  <p className="text-sm text-[#00E5FF]/70">Pontuação Máxima</p>
                  <p className="font-bold text-2xl text-[#00E5FF]">{submission.quest?.max_points} pontos</p>
                </div>

                <div className="pt-3 border-t border-[#00E5FF]/20">
                  <p className="text-sm text-[#00E5FF]/70">Data de Envio</p>
                  <p className="font-medium text-white">{new Date(submission.submitted_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </Card>

            {/* Formulário de Avaliação */}
            {existingEvaluation ? (
              <div className="space-y-4">
                <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E676]/40">
                  <h2 className="text-2xl font-bold mb-4 text-[#00E676]">✅ Já Avaliado</h2>
                  <div className="space-y-2">
                    <p className="text-[#00E676]">
                      <strong>Pontuação:</strong> {existingEvaluation.points} / {submission.quest?.max_points}
                    </p>
                    <p className="text-[#00E676]">
                      <strong>Comentário:</strong> {existingEvaluation.comments || 'Nenhum comentário'}
                    </p>
                    <p className="text-sm text-[#00E676]/70 mt-4">
                      Avaliado em: {new Date(existingEvaluation.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </Card>

                {/* Permitir reavaliação */}
                <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF9800]/40">
                  <h3 className="text-lg font-bold mb-2 text-[#FF9800]">🔄 Reavaliar</h3>
                  <p className="text-sm text-[#FF9800] mb-4">
                    Você pode revisar e atualizar sua avaliação abaixo:
                  </p>
                  <form action="/api/evaluate" method="POST" className="space-y-4">
                    <input type="hidden" name="submission_id" value={submissionId} />
                    <input type="hidden" name="evaluator_id" value={evaluator?.id} />
                    <input type="hidden" name="is_update" value="true" />

                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#FF9800]">
                        Pontuação Base (0 - {submission.quest?.max_points})
                      </label>
                      <input
                        type="number"
                        name="base_points"
                        min="0"
                        max={submission.quest?.max_points}
                        defaultValue={existingEvaluation.base_points || 0}
                        required
                        className="w-full px-4 py-2 bg-[#0A1E47]/40 border-2 border-[#FF9800]/30 rounded-lg text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#FF9800] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#FF9800]">
                        Pontos Bônus (0 - {submission.quest?.max_points})
                      </label>
                      <input
                        type="number"
                        name="bonus_points"
                        min="0"
                        max={submission.quest?.max_points}
                        defaultValue={existingEvaluation.bonus_points || 0}
                        className="w-full px-4 py-2 bg-[#0A1E47]/40 border-2 border-[#FF9800]/30 rounded-lg text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#FF9800] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#FF9800]">
                        Multiplicador (1.0x - 2.0x)
                      </label>
                      <input
                        type="number"
                        name="multiplier"
                        min="1"
                        max="2"
                        step="0.1"
                        defaultValue={existingEvaluation.multiplier || 1.0}
                        className="w-full px-4 py-2 bg-[#0A1E47]/40 border-2 border-[#FF9800]/30 rounded-lg text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#FF9800] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#FF9800]">
                        Comentários (opcional)
                      </label>
                      <textarea
                        name="comments"
                        rows={4}
                        defaultValue={existingEvaluation.comments || ''}
                        placeholder="Feedback para a equipe..."
                        className="w-full px-4 py-2 bg-[#0A1E47]/40 border-2 border-[#FF9800]/30 rounded-lg text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#FF9800] focus:outline-none"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-[#FF9800] hover:bg-[#FF8800] text-[#0A1E47] font-semibold">
                      Atualizar Avaliação
                    </Button>
                  </form>
                </Card>
              </div>
            ) : (
              <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
                <h2 className="text-2xl font-bold mb-4 text-[#00E5FF]">⭐ Avaliar</h2>
                <form action="/api/evaluate" method="POST" className="space-y-4">
                  <input type="hidden" name="submission_id" value={submissionId} />
                  <input type="hidden" name="evaluator_id" value={evaluator?.id} />

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#00E5FF]">
                      Pontuação Base (0 - {submission.quest?.max_points})
                    </label>
                    <input
                      type="number"
                      name="base_points"
                      min="0"
                      max={submission.quest?.max_points}
                      defaultValue="0"
                      required
                      className="w-full px-4 py-2 bg-[#0A1E47]/40 border-2 border-[#00E5FF]/30 rounded-lg text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#00E5FF] focus:outline-none"
                    />
                    <p className="text-xs text-[#00E5FF]/70 mt-1">
                      Pontuação base de acordo com o cumprimento da quest
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#00E5FF]">
                      Pontos Bônus (0 - {submission.quest?.max_points})
                    </label>
                    <input
                      type="number"
                      name="bonus_points"
                      min="0"
                      max={submission.quest?.max_points}
                      defaultValue="0"
                      className="w-full px-4 py-2 bg-[#0A1E47]/40 border-2 border-[#00E5FF]/30 rounded-lg text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#00E5FF] focus:outline-none"
                    />
                    <p className="text-xs text-[#00E5FF]/70 mt-1">
                      Pontos extras por criatividade, inovação, qualidade excepcional
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#00E5FF]">
                      Multiplicador (1.0x - 2.0x)
                    </label>
                    <input
                      type="number"
                      name="multiplier"
                      min="1"
                      max="2"
                      step="0.1"
                      defaultValue="1.0"
                      className="w-full px-4 py-2 bg-[#0A1E47]/40 border-2 border-[#00E5FF]/30 rounded-lg text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#00E5FF] focus:outline-none"
                    />
                    <p className="text-xs text-[#00E5FF]/70 mt-1">
                      Multiplicador de dificuldade ou destaque
                    </p>
                  </div>

                  <div className="p-3 bg-[#0A1E47]/40 border-2 border-[#00E5FF]/30 rounded-lg">
                    <p className="text-sm font-medium text-[#00E5FF]">
                      💡 Fórmula: (Pontuação Base + Bônus) × Multiplicador
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#00E5FF]">
                      Comentários (opcional)
                    </label>
                    <textarea
                      name="comments"
                      rows={4}
                      placeholder="Feedback para a equipe..."
                      className="w-full px-4 py-2 bg-[#0A1E47]/40 border-2 border-[#00E5FF]/30 rounded-lg text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#00E5FF] focus:outline-none"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-[#00E5FF] hover:bg-[#00D9FF] text-[#0A1E47] font-semibold">
                    Enviar Avaliação
                  </Button>
                </form>
              </Card>
            )}
          </div>

          {/* Visualização do PDF */}
          <div>
            <Card className="p-6 h-full bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
              <h2 className="text-2xl font-bold mb-4 text-[#00E5FF]">📄 Documento</h2>
              {submission.file_url ? (
                <>
                  <div className="bg-[#0A1E47]/40 rounded-lg overflow-hidden border-2 border-[#00E5FF]/20" style={{ height: '800px' }}>
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
                      <Button className="w-full bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 border-2 border-[#00E5FF]/60 text-[#00E5FF] font-semibold">
                        Abrir em Nova Aba
                      </Button>
                    </a>
                  </div>
                  <div className="mt-2 p-2 bg-[#0A1E47]/40 rounded text-xs font-mono break-all border border-[#00E5FF]/20 text-[#00E5FF]/70">
                    <strong>URL:</strong> {submission.file_url}
                  </div>
                </>
              ) : (
                <div className="bg-[#FF9800]/20 border-2 border-[#FF9800]/40 text-[#FF9800] p-4 rounded-lg">
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
