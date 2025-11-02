'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

interface SubmissionFormProps {
  questId: string
  teamId: string
  deliverableType: 'file' | 'text' | 'url'
  questName: string
  maxPoints: number
  onSuccess?: () => void
}

export default function SubmissionForm({
  questId,
  teamId,
  deliverableType,
  questName,
  maxPoints,
  onSuccess,
}: SubmissionFormProps) {
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fileError, setFileError] = useState('')
  const supabase = createClient()

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
      // Validação: Verificar se a quest pertence à fase ativa
      const { data: eventConfig } = await supabase
        .from('event_config')
        .select('current_phase')
        .single()

      const { data: quest } = await supabase
        .from('quests')
        .select('phase_id')
        .eq('id', questId)
        .single()

      if (!quest || quest.phase_id !== eventConfig?.current_phase) {
        setError('Esta quest não está disponível para submissão no momento. A fase ativa foi alterada.')
        setLoading(false)
        return
      }

      let fileUrl = null

      // Upload de arquivo se necessário
      if (deliverableType === 'file' && file) {
        if (!file) {
          setError('Por favor, selecione um arquivo.')
          setLoading(false)
          return
        }

        setUploadingFile(true)
        const fileName = `${teamId}/${questId}/${Date.now()}-${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file)

        if (uploadError) {
          setFileError(`Erro ao enviar arquivo: ${uploadError.message}`)
          setLoading(false)
          setUploadingFile(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(fileName)

        fileUrl = publicUrl
        setUploadingFile(false)
      }

      // Criar submission
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          team_id: teamId,
          quest_id: questId,
          content: deliverableType !== 'file' ? content : null,
          file_url: fileUrl,
          status: 'pending',
        })

      if (insertError) {
        if (insertError.message.includes('unique')) {
          setError('Você já enviou uma entrega para esta quest. Apenas uma submissão é permitida.')
        } else {
          setError('Erro ao criar submissão. Tente novamente.')
        }
        return
      }

      setSuccess(true)
      setContent('')
      setFile(null)
      setFileError('')

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      onSuccess?.()

      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(false), 5000)

    } catch (err) {
      console.error('Erro ao enviar entrega:', err)
      setError(err instanceof Error ? err.message : 'Erro ao enviar entrega. Tente novamente.')
    } finally {
      setLoading(false)
      setUploadingFile(false)
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/80 to-[#001A4D]/80 border border-[#00E5FF]/30">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#00E5FF] mb-2">{questName}</h3>
        <p className="text-sm text-[#00E5FF]/70">
          Pontuação máxima: <span className="font-bold text-[#00FF88]">{maxPoints} pontos</span>
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
          className="w-full bg-[#FF9800] hover:bg-[#F57C00] text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50"
        >
          {uploadingFile ? '⏳ Enviando arquivo...' : loading ? '⏳ Enviando...' : '🚀 Enviar Entrega'}
        </Button>
      </form>
    </Card>
  )
}