'use client'

import { Button } from '@/components/ui/button'

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        className="bg-[#00E5FF] hover:bg-[#00D9FF] text-[#0A1E47] font-semibold px-6 py-2 rounded-lg shadow-lg transition-all"
        onClick={() => window.location.href = '/live-dashboard'}
      >
        📊 Ver Ranking Ao Vivo
      </Button>
      <Button
        className="bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 border-2 border-[#00E5FF]/60 text-[#00E5FF] font-semibold px-6 py-2 rounded-lg transition-all"
        onClick={() => window.location.href = '/control-panel'}
      >
        🔄 Atualizar Página
      </Button>
      <Button
        className="bg-[#0A1E47]/60 hover:bg-[#0A1E47]/80 border-2 border-[#00E5FF]/60 text-[#00E5FF] font-semibold px-6 py-2 rounded-lg transition-all"
        onClick={() => window.location.href = '/evaluations'}
      >
        ⭐ Área de Avaliação
      </Button>
    </div>
  )
}
