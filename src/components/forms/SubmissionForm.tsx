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

  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFileError('')

    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setFileError(`Arquivo muito grande. Máximo: 50MB. Seu arquivo: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`)
        setFile(null)
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      // Validação de entrada
      if (deliverableType === 'file' && !file) {
        setError('Por favor, selecione um arquivo.')
        setLoading(false)
        return
      }

      if ((deliverableType === 'text' || deliverableType === 'url') && !content.trim()) {
        setError('Por favor, preencha o conteúdo.')
        setLoading(false)
        return
      }

      // Preparar FormData para envio
      const formData = new FormData()
      formData.append('questId', questId)
      formData.append('teamId', teamId)
      formData.append('deliverableType', deliverableType)
      formData.append('content', content)

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

      const data = await response.json()

      if (!response.ok) {
        // Tratamento de erros específicos
        if (data.details?.reason) {
          // Erro de validação com detalhes
          let errorMessage = data.error

          if (data.details.lateMinutes > 0) {
            errorMessage += ` (${data.details.lateMinutes} minutos atrasado)`
            if (data.details.penalty > 0) {
              errorMessage += `. Penalidade: -${data.details.penalty} AMF Coins`
            }
          }

          setError(errorMessage)
        } else {
          setError(data.error || 'Erro ao enviar entrega. Tente novamente.')
        }
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
      setError(err instanceof Error ? err.message : 'Erro ao enviar entrega. Tente novamente.')
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
              Formatos: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, ZIP, RAR, 7Z (Máx: 50MB)
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
          <div className="bg-red-500/15 border border-red-500/60 text-red-300 px-4 py-3 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/15 border border-green-500/60 text-green-300 px-4 py-3 rounded-lg text-sm">
            ✅ Entrega enviada com sucesso! Aguarde a avaliação.
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