'use client'

import { Button } from '@/components/ui/button'

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button
        className="bg-purple-600 hover:bg-purple-700"
        onClick={() => window.location.href = '/live-dashboard'}
      >
        📊 Ver Ranking Ao Vivo
      </Button>
      <Button
        variant="outline"
        onClick={() => window.location.href = '/control-panel'}
      >
        🔄 Atualizar Página
      </Button>
      <Button
        variant="outline"
        onClick={() => window.location.href = '/evaluate'}
      >
        ⭐ Área de Avaliação
      </Button>
    </div>
  )
}
