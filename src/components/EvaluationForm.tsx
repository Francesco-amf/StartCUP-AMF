'use client'

import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

interface EvaluationFormProps {
  submissionId: string
  evaluatorId: string
  maxPoints: number
  isUpdate?: boolean
  defaultValues?: {
    base_points?: number
    multiplier?: number
    comments?: string
  }
  buttonText?: string
  title?: string
  color?: 'cyan' | 'orange'
}

export default function EvaluationForm({
  submissionId,
  evaluatorId,
  maxPoints,
  isUpdate = false,
  defaultValues = {},
  buttonText = 'Avaliar',
  title = '⭐ Avaliar',
  color = 'cyan'
}: EvaluationFormProps) {
  const { play } = useSoundSystem()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const colorClasses = {
    cyan: {
      title: 'text-[#00E5FF]',
      label: 'text-[#00E5FF]',
      input: 'border-[#00E5FF]/30 focus:ring-[#00E5FF]',
      button: 'bg-[#00E5FF] hover:bg-[#00D9FF] text-[#0A1E47]',
      card: 'border-[#00E5FF]/40'
    },
    orange: {
      title: 'text-[#FF9800]',
      label: 'text-[#FF9800]',
      input: 'border-[#FF9800]/30 focus:ring-[#FF9800]',
      button: 'bg-[#FF9800] hover:bg-[#FF8800] text-[#0A1E47]',
      card: 'border-[#FF9800]/40'
    }
  }

  const c = colorClasses[color]

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar avaliação')
      }

      // 🎵 TOCAR SOM DE CONCLUSÃO COM MÁXIMA PRIORIDADE
      console.log('✅ [EvaluationForm] Avaliação enviada, queuing quest-complete com prioridade 0')
      play('quest-complete', 0) // Prioridade 0 = máxima prioridade

      // Aguardar um pouco para o som tocar antes de redirecionar
      setTimeout(() => {
        window.location.href = '/evaluate'
      }, 500)

    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="evaluator_id" value={evaluatorId} />
      {isUpdate && <input type="hidden" name="is_update" value="true" />}

      <div>
        <label className={`block text-sm font-medium mb-2 ${c.label}`}>
          AMF Coins Base (0 - {maxPoints})
        </label>
        <input
          type="number"
          name="base_points"
          min="0"
          max={maxPoints}
          defaultValue={defaultValues.base_points || 0}
          required
          className={`w-full px-4 py-2 bg-[#0A1E47]/40 border-2 ${c.input} rounded-lg text-white placeholder:text-white/40 focus:outline-none`}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${c.label}`}>
          Multiplicador (1.0x - 2.0x)
        </label>
        <input
          type="number"
          name="multiplier"
          min="1"
          max="2"
          step="0.1"
          defaultValue={defaultValues.multiplier || 1.0}
          className={`w-full px-4 py-2 bg-[#0A1E47]/40 border-2 ${c.input} rounded-lg text-white placeholder:text-white/40 focus:outline-none`}
        />
        <p className={`text-xs ${c.label}/70 mt-1`}>
          Qualidade da entrega (1.0 = regular, 2.0 = excelente)
        </p>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${c.label}`}>
          Comentários (opcional)
        </label>
        <textarea
          name="comments"
          rows={4}
          defaultValue={defaultValues.comments || ''}
          placeholder="Feedback para a equipe..."
          className={`w-full px-4 py-2 bg-[#0A1E47]/40 border-2 ${c.input} rounded-lg text-white placeholder:text-white/40 focus:outline-none`}
        />
      </div>

      {error && (
        <div className="p-3 bg-[#FF3D00]/20 border border-[#FF3D00]/40 rounded text-sm text-[#FF6B47]">
          ❌ {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className={`w-full ${c.button} font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? '⏳ Enviando...' : buttonText}
      </Button>
    </form>
  )
}
