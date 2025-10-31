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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

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
      let fileUrl = null

      // Upload de arquivo se necessário
      if (deliverableType === 'file' && file) {
        const fileName = `${teamId}/${questId}/${Date.now()}-${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(fileName)

        fileUrl = publicUrl
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

      if (insertError) throw insertError

      setSuccess(true)
      setContent('')
      setFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      onSuccess?.()

      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(false), 5000)
      
    } catch (err) {
      console.error('Erro ao enviar entrega:', err)
      setError('Erro ao enviar entrega. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold">{questName}</h3>
        <p className="text-sm text-gray-500">
          Pontuação máxima: {maxPoints} pontos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Upload de Arquivo */}
        {deliverableType === 'file' && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Arquivo *
            </label>
            <Input
              id="file-input"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              disabled={loading}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formatos aceitos: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG
            </p>
          </div>
        )}

        {/* URL */}
        {deliverableType === 'url' && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              URL *
            </label>
            <Input
              type="url"
              placeholder="https://..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Cole o link do seu protótipo, apresentação, etc.
            </p>
          </div>
        )}

        {/* Texto Livre */}
        {deliverableType === 'text' && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Conteúdo *
            </label>
            <Textarea
              placeholder="Digite o conteúdo aqui..."
              className="min-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        )}

        {/* Mensagens */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
            ✅ Entrega enviada com sucesso! Aguarde a avaliação.
          </div>
        )}

        {/* Botão */}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Enviando...' : 'Enviar Entrega'}
        </Button>
      </form>
    </Card>
  )
}