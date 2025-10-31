'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function ResetSystemButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    if (confirmText !== 'RESETAR TUDO') {
      setError('Texto de confirmação incorreto')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmationText: confirmText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao resetar sistema')
      }

      // Sucesso!
      alert('✅ Sistema resetado com sucesso!\n\nTodas as avaliações e submissões foram removidas.')
      setIsModalOpen(false)
      setConfirmText('')

      // Recarregar a página para atualizar estatísticas
      window.location.reload()
    } catch (err) {
      console.error('Erro ao resetar:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="outline"
        className="border-red-500 text-red-600 hover:bg-red-50"
      >
        🔥 Resetar Sistema
      </Button>

      {/* Modal de Confirmação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ ATENÇÃO: Resetar Sistema
            </h2>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold mb-2">
                Esta ação é IRREVERSÍVEL e irá:
              </p>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                <li>Deletar todas as avaliações</li>
                <li>Deletar todas as submissões</li>
                <li>Resetar pontuações das equipes</li>
                <li>Limpar todo o progresso do evento</li>
              </ul>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                Para confirmar, digite <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded">RESETAR TUDO</span> abaixo:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite aqui..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setIsModalOpen(false)
                  setConfirmText('')
                  setError(null)
                }}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isLoading || confirmText !== 'RESETAR TUDO'}
              >
                {isLoading ? 'Resetando...' : 'Confirmar Reset'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
