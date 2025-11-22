'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import SubmissionDeadlineStatus from '@/components/quest/SubmissionDeadlineStatus'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

interface SubmissionFormProps {
  questId: string
  teamId: string
  deliverableType: 'file' | 'text' | 'url'
  questName: string
  maxPoints: number
  onSuccess?: (questId: string) => void
  isQuestCompleted?: boolean
}

export default function SubmissionForm({
  questId,
  teamId,
  deliverableType,
  questName,
  maxPoints,
  onSuccess,
  isQuestCompleted = false,
}: SubmissionFormProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fileError, setFileError] = useState('')
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false)
  const supabase = createClient()
  const { play } = useSoundSystem()

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFileError('')

    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setFileError(`Arquivo muito grande. Máximo: 5MB. Seu arquivo: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`)
        setFile(null)
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ NOVA VALIDAÇÃO: Verificar envio duplo (arquivo + link/texto)
    const hasFile = deliverableType === 'file' && file
    const hasContent = (deliverableType === 'text' || deliverableType === 'url') && content.trim()
    
    if (hasFile && hasContent) {
      setError('⚠️ Você só pode enviar UM tipo de entrega por vez. Escolha entre enviar um arquivo OU um link/texto, mas não ambos.')
      return
    }

    // Confirmação antes de enviar
    const confirmSubmit = window.confirm(
      '⚠️ ATENÇÃO: Esta submissão é DEFINITIVA e não poderá ser alterada.\n\n' +
      'Tem certeza que deseja enviar esta entrega?'
    )

    if (!confirmSubmit) {
      return // Cancela o envio
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // ✅ VALIDAÇÕES PRELIMINARES (antes de qualquer envio)
      
      // Validação de entrada
      if (deliverableType === 'file' && !file) {
        setError('📄 Por favor, selecione um arquivo para enviar.')
        setLoading(false)
        return
      }

      if ((deliverableType === 'text' || deliverableType === 'url') && !content.trim()) {
        setError(`📝 Por favor, preencha o ${deliverableType === 'url' ? 'link' : 'conteúdo'}.`)
        setLoading(false)
        return
      }

      // Validação de tamanho de arquivo (redundante mas importante)
      if (deliverableType === 'file' && file) {
        if (file.size > MAX_FILE_SIZE) {
          setError(`📦 Arquivo muito grande!\n\nSeu arquivo: ${(file.size / 1024 / 1024).toFixed(2)}MB\nMáximo permitido: 5MB\n\nDica: Comprima o arquivo ou envie um link de compartilhamento em vez disso.`)
          setFile(null)
          setLoading(false)
          return
        }
        
        // Validar tipo MIME
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'application/zip',
          'application/x-rar-compressed',
          'application/x-7z-compressed',
        ]
        
        if (!allowedMimes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|ppt|pptx|jpg|jpeg|png|zip|rar|7z)$/i)) {
          setError(`📄 Tipo de arquivo não permitido: ${file.type || 'desconhecido'}\n\nTipos aceitos: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, ZIP, RAR, 7Z`)
          setFile(null)
          setLoading(false)
          return
        }
      }

      // Validação de URL
      if (deliverableType === 'url') {
        try {
          new URL(content.trim())
        } catch {
          setError('🔗 URL inválida!\n\nCertifique-se de que começa com https:// ou http://')
          setLoading(false)
          return
        }
      }

      // Preparar FormData para envio
      const formData = new FormData()
      formData.append('questId', questId)
      formData.append('teamId', teamId)
      formData.append('deliverableType', deliverableType)

      // ✅ APENAS adicionar content se for text/url (NÃO para file)
      if (deliverableType !== 'file') {
        formData.append('content', content)
      }

      if (deliverableType === 'file' && file) {
        formData.append('file', file)
        setUploadingFile(true)
      }

      // Enviar para API de submissão
      const response = await fetch('/api/submissions/create', {
        method: 'POST',
        body: formData
      })

      // Verificar se sessão expirou (401/403)
      if (response.status === 401 || response.status === 403) {
        setError('Sua sessão expirou. Redirecionando para login...')
        setTimeout(() => {
          router.push('/login')
        }, 1000)
        setLoading(false)
        setUploadingFile(false)
        return
      }

      // ✅ MELHORADO: Tratamento de erro JSON com diagnostico
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Erro ao parsear JSON da resposta:', jsonError)
        console.error('Status da resposta:', response.status)
        console.error('Tipo de entrega enviado:', deliverableType)
        
        // Tratar erros específicos por status HTTP
        let errorMessage = '❌ Erro ao processar resposta do servidor.'
        if (response.status === 413) {
          errorMessage = '📦 Arquivo muito grande! Máximo permitido: 5MB'
        } else if (response.status === 500) {
          errorMessage = '⚠️ Erro interno do servidor. Tente novamente em alguns momentos.'
        } else if (response.status === 408 || response.status === 504) {
          errorMessage = '⏱️ Timeout! Upload demorou muito. Verifique sua conexão e tente novamente.'
        } else if (response.statusText === 'Bad Gateway' || response.statusText === 'Service Unavailable') {
          errorMessage = '🔌 Serviço temporariamente indisponível. Tente novamente em poucos segundos.'
        }
        
        setError(errorMessage)
        setLoading(false)
        setUploadingFile(false)
        return
      }

      if (!response.ok) {
        // Tratamento de erros específicos com diagnóstico melhorado
        let errorMessage = data.error || 'Erro ao enviar entrega. Tente novamente.'
        let errorDetails = ''

        // Erros de tamanho de arquivo
        if (response.status === 413 || errorMessage.includes('Arquivo muito grande')) {
          errorMessage = '📦 Arquivo muito grande!'
          errorDetails = 'Máximo permitido: 5MB. Comprima o arquivo ou envie um link em vez disso.'
        }
        // Erros de autenticação/autorização
        else if (response.status === 401) {
          errorMessage = '🔐 Sessão expirada'
          errorDetails = 'Redirecionando para login...'
        } else if (response.status === 403) {
          errorMessage = '🚫 Acesso negado'
          errorDetails = 'Você não tem permissão para enviar esta entrega.'
        }
        // Erros de deadline
        else if (data.details?.reason === 'PAST_DEADLINE') {
          errorMessage = '⏰ Prazo expirado'
          errorDetails = 'Você não pode mais enviar uma entrega para esta quest.'
        } else if (data.details?.reason === 'NOT_STARTED') {
          errorMessage = '⏳ Quest não iniciada'
          errorDetails = 'Aguarde o início da quest para enviar uma entrega.'
        }
        // Erros de validação com detalhes
        else if (data.details?.reason) {
          errorMessage = data.error
          if (data.details.lateMinutes > 0) {
            errorDetails = `⚠️ Você está ${data.details.lateMinutes} minuto(s) atrasado`
            if (data.details.penalty > 0) {
              errorDetails += `. Penalidade: -${data.details.penalty} AMF Coins`
            }
          }
        }
        // Erro de submissão duplicada
        else if (errorMessage.includes('já foi submetida') || errorMessage.includes('duplicate')) {
          errorMessage = '✅ Esta quest já foi submetida'
          errorDetails = 'Você já enviou uma entrega para esta quest. Cada quest permite apenas uma submissão.'
        }
        // Erro de tipo de arquivo inválido
        else if (errorMessage.includes('tipo de arquivo') || errorMessage.includes('arquivo inválido')) {
          errorMessage = '📄 Tipo de arquivo não permitido'
          errorDetails = 'Tipos aceitos: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, ZIP, RAR, 7Z'
        }
        // Erro de servidor
        else if (response.status >= 500) {
          errorMessage = '⚠️ Erro do servidor'
          errorDetails = 'Tente novamente em alguns momentos. Se o problema persistir, contate o suporte.'
        }

        // Montar mensagem final
        const fullError = errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage
        setError(fullError)
        
        setLoading(false)
        setUploadingFile(false)
        return
      }

      // Sucesso!
      let successMessage = '✅ Entrega enviada com sucesso!'

      if (data.submission.isLate) {
        successMessage += ` (${data.submission.lateMinutes}min atrasado)`
        if (data.submission.penaltyApplied) {
          successMessage += ` - Penalidade: -${data.submission.penaltyAmount} AMF Coins`
        }
      }

      setSuccess(true)
      setContent('')
      setFile(null)
      setFileError('')

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Tocar som de submissão
      play('submission')

      onSuccess?.(questId)

      // Aguarda som completar (1.5s) e marca como completo (esconde form)
      setTimeout(() => {
        console.log('🔄 [SubmissionForm] Entrega completa - escondendo formulário...')
        setIsSubmissionComplete(true)
      }, 1500)

    } catch (err) {
      console.error('Erro ao enviar entrega:', err)
      
      // Tratamento de erros de rede
      if (err instanceof TypeError) {
        if (err.message.includes('Failed to fetch')) {
          setError('🌐 Erro de conexão. Verifique sua internet e tente novamente.')
        } else if (err.message.includes('payload')) {
          setError('📦 Arquivo muito grande para envio. Máximo: 5MB')
        } else {
          setError('🌐 Erro de conexão. Tente novamente.')
        }
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao enviar entrega. Tente novamente.')
      }
    } finally {
      setLoading(false)
      setUploadingFile(false)
    }
  }

  // Função auxiliar para gerar título do tipo de entrega
  const getDeliverableTypeTitle = () => {
    switch (deliverableType) {
      case 'file':
        return '📄 Enviar Arquivo'
      case 'url':
        return '🔗 Enviar Link'
      case 'text':
        return '📝 Enviar Texto'
      default:
        return 'Enviar Entrega'
    }
  }

  const getDeliverableTypeDescription = () => {
    switch (deliverableType) {
      case 'file':
        return 'Faça upload de um arquivo (PDF, PPTX, PNG, etc)'
      case 'url':
        return 'Cole o link do seu trabalho (Figma, Canva, Google Drive, etc)'
      case 'text':
        return 'Digite o texto diretamente aqui'
      default:
        return ''
    }
  }

  // Se submissão foi completada ou a quest foi completa pelo wrapper, esconder o form
  if (isSubmissionComplete || isQuestCompleted) {
    // Se foi completa por isQuestCompleted (outro form da mesma quest completou)
    // não renderizar nada (outro form já mostra a mensagem)
    if (isQuestCompleted && !isSubmissionComplete) {
      return null
    }

    // Se foi completa por isSubmissionComplete (este form completou)
    // renderizar a mensagem de conclusão
    return (
      <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/80 to-[#001A4D]/80 border border-[#00E5FF]/30">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">✅</span>
            <h2 className="text-2xl font-bold text-[#00FF88]">Quest Concluída!</h2>
          </div>

          <p className="text-[#00E5FF] text-lg">
            Você completou <span className="font-bold text-white">"{questName}"</span> com sucesso.
          </p>

          <div className="bg-[#0A3A5A]/40 border border-[#00E5FF]/50 text-[#00E5FF] px-4 py-3 rounded-lg">
            <p className="font-semibold mb-1">📋 Próximo passo:</p>
            <p className="text-sm">Aguarde o prazo desta quest expirar para acessar a próxima entrega.</p>
          </div>

          <div className="bg-[#0A1E47]/40 border border-[#FFD700]/50 text-[#FFD700] px-4 py-3 rounded-lg">
            <p className="text-sm">💡 <strong>Dica:</strong> Use esse tempo para revisar ou se preparar para o próximo desafio!</p>
          </div>

          <p className="text-[#00E5FF]/70 text-sm mt-4">
            Você será redirecionado automaticamente quando a próxima quest estiver disponível.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/80 to-[#001A4D]/80 border border-[#00E5FF]/30">
      {/* Tipo de Entrega - CABEÇALHO DESTACADO */}
      <div className="mb-4 pb-4 border-b border-[#00E5FF]/30">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold text-[#00E5FF]">{getDeliverableTypeTitle()}</h2>
        </div>
        <p className="text-sm text-[#00E5FF]/70">
          {getDeliverableTypeDescription()}
        </p>
      </div>

      {/* Status de deadline */}
      <SubmissionDeadlineStatus questId={questId} teamId={teamId} />

      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#00E5FF] mb-2">{questName}</h3>
        <p className="text-sm text-[#00E5FF]/70">
          AMF Coins máximos: <span className="font-bold text-[#00FF88]">🪙 {maxPoints} AMF Coins</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Upload de Arquivo */}
        {deliverableType === 'file' && (
          <div className="space-y-2">
            <label className="text-sm font-medium mb-2 block text-[#00E5FF]">
              Arquivo *
            </label>
            <div className="relative">
              <Input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                required
                disabled={loading || uploadingFile}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.rar,.7z"
                className="bg-[#0A1E47]/60 border-[#00E5FF]/50 text-white cursor-pointer"
              />
            </div>

            {file && (
              <div className="bg-[#0A1E47]/40 border border-[#00FF88]/50 px-3 py-2 rounded-lg text-sm">
                <p className="text-[#00FF88] font-medium">✅ Arquivo selecionado</p>
                <p className="text-[#00E5FF]/70 text-xs mt-1">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                </p>
              </div>
            )}

            {fileError && (
              <div className="bg-red-500/10 border border-red-500/50 px-3 py-2 rounded-lg text-sm text-red-400">
                ❌ {fileError}
              </div>
            )}

            {uploadingFile && (
              <div className="bg-[#0A3A5A]/40 border border-[#00D4FF]/50 px-3 py-2 rounded-lg text-sm text-[#00D4FF]">
                ⏳ Enviando arquivo...
              </div>
            )}

            <p className="text-xs text-[#00E5FF]/60 mt-1">
              Formatos: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, ZIP, RAR, 7Z (Máx: 5MB)
            </p>
          </div>
        )}

        {/* URL */}
        {deliverableType === 'url' && (
          <div className="space-y-2">
            <label className="text-sm font-medium mb-2 block text-[#00E5FF]">
              URL *
            </label>
            <Input
              type="url"
              placeholder="https://..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={loading}
              className="bg-[#0A1E47]/60 border-[#00E5FF]/50 text-white placeholder-[#00E5FF]/40"
            />
            <p className="text-xs text-[#00E5FF]/60 mt-1">
              Cole o link do seu protótipo, apresentação, etc.
            </p>
          </div>
        )}

        {/* Texto Livre */}
        {deliverableType === 'text' && (
          <div className="space-y-2">
            <label className="text-sm font-medium mb-2 block text-[#00E5FF]">
              Conteúdo *
            </label>
            <Textarea
              placeholder="Digite o conteúdo aqui..."
              className="min-h-[200px] bg-[#0A1E47]/60 border-[#00E5FF]/50 text-white placeholder-[#00E5FF]/40"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        )}

        {/* Mensagens */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/60 text-red-300 px-4 py-3 rounded-lg text-sm space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">❌</span>
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {error}
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/15 border border-green-500/60 text-green-300 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>Entrega enviada com sucesso! Aguarde a avaliação.</span>
            </div>
          </div>
        )}

        {/* Botão */}
        <Button
          type="submit"
          disabled={loading || uploadingFile || fileError.length > 0}
          className="w-full bg-[#FF9800] hover:bg-[#F57C00] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 text-base"
        >
          {uploadingFile 
            ? '⏳ Enviando arquivo...' 
            : loading 
            ? '⏳ Enviando...' 
            : deliverableType === 'file' 
            ? '📄 Enviar Arquivo' 
            : deliverableType === 'url' 
            ? '� Enviar Link' 
            : '📝 Enviar Texto'}
        </Button>
      </form>
    </Card>
  )
}