'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface TeamLogoUploadProps {
  teamId: string
  teamName: string
  currentLogoUrl?: string
  onUploadSuccess?: (logoUrl: string) => void
}

export default function TeamLogoUpload({
  teamId,
  teamName,
  currentLogoUrl,
  onUploadSuccess
}: TeamLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Formato inválido. Use PNG, JPG, GIF ou WebP')
      return
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB')
      return
    }

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const fileInput = document.getElementById('logo-input') as HTMLInputElement
    const file = fileInput?.files?.[0]

    if (!file) {
      setError('Selecione um arquivo')
      return
    }

    setIsUploading(true)

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${teamId}/${Date.now()}.${fileExt}`

      console.log('📤 Iniciando upload de logo:', { teamId, fileName, fileSize: file.size })

      // Upload para Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('❌ Erro no upload Storage:', uploadError)
        throw new Error(uploadError.message)
      }

      console.log('✅ Upload Storage concluído:', data)

      // Gerar URL pública
      const { data: publicData } = supabase.storage
        .from('team-logos')
        .getPublicUrl(fileName)

      const publicUrl = publicData?.publicUrl

      console.log('🔗 URL pública gerada:', publicUrl)

      // Atualizar database com a URL
      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo_url: publicUrl })
        .eq('id', teamId)

      if (updateError) {
        console.error('❌ Erro ao atualizar DB:', updateError)
        throw new Error(updateError.message)
      }

      console.log('💾 Database atualizado com sucesso')

      setSuccess(true)
      onUploadSuccess?.(publicUrl)

      // Limpar input
      if (fileInput) {
        fileInput.value = ''
      }

      // Log de debug
      console.log('✅ Logo enviada com sucesso:', publicUrl)

      // Recarregar a página após 2 segundos para refletir as mudanças
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="group relative inline-block">
      {/* Área de hover invisível - expande a zona de interação */}
      <div className="absolute -inset-2 z-40"></div>

      {/* Ícone discreto - sempre visível */}
      <label className="relative z-40 flex items-center gap-1 cursor-pointer text-purple-400 hover:text-purple-600 transition">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <input
          id="logo-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Menu expandido - aparece ao passar mouse */}
      <div className="absolute right-0 top-8 w-56 bg-white border border-purple-200 rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {/* Upload Form */}
        <form onSubmit={handleUpload} className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-900">🎨 Logo da Equipe</h3>
            <div className="flex items-center gap-2">
              {error && (
                <span className="text-xs text-red-600">❌</span>
              )}
              {success && (
                <span className="text-xs text-green-600">✅</span>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 mb-1">{error}</p>
          )}

          {/* Preview */}
          {preview && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <img
                src={preview}
                alt="Logo preview"
                className="h-10 w-10 object-contain bg-white p-0.5 rounded border border-gray-200"
              />
              <span className="text-xs text-gray-600">Pronto para enviar</span>
            </div>
          )}

          {/* Upload Input */}
          <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-dashed border-purple-300 rounded hover:bg-purple-50 transition">
            <svg
              className="w-4 h-4 text-purple-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs text-purple-600 font-medium">
              {preview ? 'Trocar logo' : 'Clique para adicionar'}
            </span>
          </label>

          {preview && (
            <Button
              type="submit"
              disabled={isUploading}
              size="sm"
              className="w-full text-xs py-1 h-auto"
            >
              {isUploading ? '⏳ Enviando...' : '📤 Salvar'}
            </Button>
          )}

          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG, GIF ou WebP (Máx. 5MB)
          </p>
        </form>
      </div>
    </div>
  )
}
