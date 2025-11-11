'use client'

import React, { ReactNode, ReactElement } from 'react'
import { createLogger } from '@/lib/logging'

const logger = createLogger('ErrorBoundary')

interface Props {
  children: ReactNode
  fallback?: ReactElement
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 * Captura erros dos componentes filhos e mostra fallback amigável
 * Evita que toda a página quebre por erro em um componente
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log do erro
    logger.error(error, `Error caught by boundary - ${errorInfo.componentStack}`)

    // Callback customizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-black flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              {/* Icon */}
              <div className="text-6xl mb-6">⚠️</div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-red-400 mb-2">Algo deu errado</h1>

              {/* Description */}
              <p className="text-gray-300 mb-6">
                Desculpe, encontramos um erro inesperado. Por favor, tente recarregar a página.
              </p>

              {/* Error Message (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-950/50 border border-red-500 rounded p-4 mb-6 text-left">
                  <p className="text-red-400 text-sm font-mono break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
                >
                  Recarregar Página
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded transition-colors"
                >
                  Ir para Home
                </button>
              </div>

              {/* Support Message */}
              <p className="text-gray-500 text-xs mt-6">
                Se o problema persistir, contate o suporte técnico.
              </p>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

/**
 * Hook para usar Error Boundary de forma funcional (com Suspense)
 * Exemplo:
 *
 * <ErrorBoundary>
 *   <MeuComponente />
 * </ErrorBoundary>
 */
export default ErrorBoundary
