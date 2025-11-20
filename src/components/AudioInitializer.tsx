'use client'

import { useEffect } from 'react'
import { setupAutoAudioAuthorization } from '@/lib/audio/audioContext'

/**
 * Componente responsável por inicializar o sistema de áudio global
 * Deve ser renderizado uma vez apenas no layout raiz
 *
 * Funções:
 * 1. Configura autorização automática de áudio via interação do usuário
 * 2. Simula clique virtual após 500ms para autorizar sem precisar de clique manual
 * 3. Permite que todos os sons do projeto funcionem sem bloqueios do navegador
 */
export function AudioInitializer() {
  useEffect(() => {
    // Inicializar sistema de áudio apenas uma vez
    setupAutoAudioAuthorization()
  }, [])

  // Componente não renderiza nada visualmente
  return null
}
