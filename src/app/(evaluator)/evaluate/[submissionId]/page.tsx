import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Header from '@/components/Header'
import EvaluationForm from '@/components/EvaluationForm'

// ✅ IMPORTANTE: force-dynamic permite que router.refresh() revalide dados do servidor
export const dynamic = 'force-dynamic'

export default async function EvaluateSubmissionPage({
  params,
}: {
  // Esta versão está CORRETA para o seu projeto
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

  // Buscar a submission (incluindo campos de atraso)
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select(`
      *,
      is_late,
      late_minutes,
      late_penalty_applied,
      submitted_at,
      quest_deadline,
      team:team_id (
        id,
        name,
        course,
        members
      ),
      quest:quest_id (
        name,
        description,
        max_points,
        phase_id,
        phase:phase_id (
          name,
          duration_minutes
        )
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

      <div className="container mx-auto p-4 md:p-6">
        <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
          {/* Informações da Entrega */}
          <div className="space-y-4 md:space-y-6">
            {/* Card de Visualização do Arquivo/URL */}
            {(submission.file_url || submission.content) && (
              <Card className="p-4 md:p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00FF88]/40">
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#00FF88]">📦 Entrega Submetida</h2>
                
                {submission.file_url && (
                  <div className="space-y-3">
                    <div className="bg-[#0A3A5A]/40 border border-[#00E5FF]/30 rounded-lg p-4">
                      <p className="text-sm text-[#00E5FF]/70 mb-2">Arquivo/Link</p>
                      <a 
                        href={submission.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#00FF88] hover:text-[#00E5FF] underline break-all text-sm font-medium flex items-center gap-2"
                      >
                        🔗 {submission.file_url}
                        <span className="text-xs bg-[#00FF88]/20 px-2 py-1 rounded">Abrir em nova aba</span>
                      </a>
                      
                      {/* Aviso para links externos (YouTube, Figma, etc) */}
                      {(submission.file_url.includes('youtube.com') || 
                        submission.file_url.includes('youtu.be') ||
                        submission.file_url.includes('figma.com') ||
                        submission.file_url.includes('canva.com')) && (
                        <p className="text-xs text-[#FFB300] mt-3 bg-[#FFB300]/10 p-2 rounded border border-[#FFB300]/30">
                          💡 <strong>Dica:</strong> Este link não pode ser exibido aqui por questões de segurança. 
                          Clique no link acima para abrir em nova aba.
                        </p>
                      )}
                    </div>
                    
                    {submission.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                      <div className="mt-4">
                        <p className="text-sm text-[#00E5FF]/70 mb-2">Preview da Imagem</p>
                        <img 
                          src={submission.file_url} 
                          alt="Preview" 
                          className="max-w-full h-auto rounded-lg border border-[#00E5FF]/30"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {submission.content && !submission.file_url && (
                  <div className="bg-[#0A3A5A]/40 border border-[#00E5FF]/30 rounded-lg p-4">
                    <p className="text-sm text-[#00E5FF]/70 mb-2">Conteúdo de Texto</p>
                    <div className="text-white whitespace-pre-wrap break-words">
                      {submission.content}
                    </div>
                  </div>
                )}
              </Card>
            )}

            <Card className="p-4 md:p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#00E5FF]">📋 Informações</h2>
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
                  <p className="text-sm text-[#00E5FF]/70">AMF Coins Máximos</p>
                  <p className="font-bold text-2xl text-[#00E5FF]">{submission.quest?.max_points} coins</p>
                </div>

                {submission.quest?.phase && (
                  <div className="pt-3 border-t border-[#00E5FF]/20">
                    <p className="text-sm text-[#00E5FF]/70">Fase</p>
                    <p className="font-bold text-white">{submission.quest.phase.name}</p>
                    <p className="text-[#00D4FF] text-sm mt-1">⏱️ Duração: {submission.quest.phase.duration_minutes} minutos</p>
                  </div>
                )}

                <div className="pt-3 border-t border-[#00E5FF]/20">
                  <p className="text-sm text-[#00E5FF]/70">Data de Envio</p>
                  <p className="font-medium text-white">{new Date(submission.submitted_at).toLocaleString('pt-BR')}</p>
                  
                  {/* Badge de atraso */}
                  {submission.is_late && (
                    <div className="mt-3 p-3 bg-red-500/20 border-2 border-red-500 rounded-lg">
                      <p className="text-red-400 font-bold flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        SUBMISSÃO ATRASADA
                      </p>
                      <p className="text-red-300 text-sm mt-1">
                        Atraso: <strong>{submission.late_minutes} minutos</strong>
                      </p>
                      <p className="text-red-200 text-sm">
                        Penalidade aplicada: <strong className="text-red-400">-{submission.late_penalty_applied} pontos</strong>
                      </p>
                      {submission.quest_deadline && (
                        <p className="text-red-300/70 text-xs mt-2">
                          Deadline era: {new Date(submission.quest_deadline).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Formulário de Avaliação */}
            {existingEvaluation ? (
              <div className="space-y-3 md:space-y-4">
                <Card className="p-4 md:p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E676]/40">
                  <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#00E676]">✅ Já Avaliado</h2>
                  <div className="space-y-2">
                    <p className="text-[#00E676]">
                      <strong>AMF Coins:</strong> {existingEvaluation.points} / {submission.quest?.max_points}
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
                <Card className="p-4 md:p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#FF9800]/40">
                  <h3 className="text-lg md:text-xl font-bold mb-2 text-[#FF9800]">🔄 Reavaliar</h3>
                  <p className="text-sm text-[#FF9800] mb-4">
                    Você pode revisar e atualizar sua avaliação abaixo:
                  </p>
                  <EvaluationForm
                    submissionId={submissionId}
                    evaluatorId={evaluator?.id || ''}
                    maxPoints={submission.quest?.max_points || 0}
                    isUpdate={true}
                    defaultValues={{
                      base_points: existingEvaluation.base_points,
                      multiplier: existingEvaluation.multiplier,
                      comments: existingEvaluation.comments
                    }}
                    buttonText="Atualizar Avaliação"
                    title="🔄 Reavaliar"
                    color="orange"
                  />
                </Card>
              </div>
            ) : (
              <Card className="p-4 md:p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#00E5FF]">⭐ Avaliar</h2>
                <div className="space-y-4">
                  <div className="p-3 bg-[#0A1E47]/40 border-2 border-[#00E5FF]/30 rounded-lg">
                    <p className="text-sm font-medium text-[#00E5FF]">
                      💡 Fórmula: AMF Coins Base × Multiplicador
                    </p>
                  </div>
                  <EvaluationForm
                    submissionId={submissionId}
                    evaluatorId={evaluator?.id || ''}
                    maxPoints={submission.quest?.max_points || 0}
                    buttonText="Enviar Avaliação"
                    title="⭐ Avaliar"
                    color="cyan"
                  />
                </div>
              </Card>
            )}
          </div>

          {/* Visualização do PDF */}
          <div className="hidden xl:block">
            <Card className="p-4 md:p-6 h-full bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#00E5FF]">📄 Documento</h2>
              {submission.file_url ? (
                <>
                  <div className="bg-[#0A1E47]/40 rounded-lg overflow-hidden border-2 border-[#00E5FF]/20" style={{ height: '700px' }}>
                    <iframe
                      src={submission.file_url}
                      className="w-full h-full"
                      title="PDF Viewer"
                    />
                  </div>
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-4"
                  >
                    <Button className="w-full bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 border-2 border-[#00E5FF]/60 text-[#00E5FF] font-semibold">
                      📤 Abrir em Nova Aba
                    </Button>
                  </a>
                  <div className="mt-3 p-3 bg-[#0A1E47]/40 rounded text-xs font-mono break-all border border-[#00E5FF]/20 text-[#00E5FF]/70">
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
