'use client'

import React from 'react'

interface AccessibleAlertProps {
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Alerta acessível com suporte completo a ARIA
 * - role="alert" para erros/warnings (assertive)
 * - role="status" para info/success (polite)
 * - aria-live regions para anúncios automáticos
 * - aria-atomic para anunciar conteúdo completo
 * - aria-dismissible quando permite fechar
 */
export const AccessibleAlert: React.FC<AccessibleAlertProps> = ({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  action,
}) => {
  const [isVisible, setIsVisible] = React.useState(true)

  if (!isVisible) return null

  const isError = type === 'error' || type === 'warning'
  const ariaLive = isError ? 'assertive' : 'polite'
  const role = isError ? 'alert' : 'status'

  const typeStyles = {
    error: 'bg-red-950/50 border-red-500 text-red-400',
    warning: 'bg-yellow-950/50 border-yellow-500 text-yellow-400',
    info: 'bg-blue-950/50 border-blue-500 text-blue-400',
    success: 'bg-green-950/50 border-green-500 text-green-400',
  }

  const iconMap = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅',
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      aria-dismissible={dismissible}
      className={`
        border-l-4 rounded-lg p-4
        ${typeStyles[type]}
        flex items-start gap-4
        transition-all
      `}
    >
      {/* Icon */}
      <span aria-hidden="true" className="text-xl flex-shrink-0 mt-0.5">
        {iconMap[type]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm opacity-90">{message}</p>

        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            className={`
              mt-3 text-sm font-medium
              px-3 py-1.5 rounded
              focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
              transition-colors
              ${
                type === 'error'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400'
                  : type === 'warning'
                    ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-400'
                    : type === 'info'
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-400'
              }
            `}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          aria-label={`Fechar alerta de ${type}`}
          className={`
            flex-shrink-0 text-lg
            focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
            rounded transition-colors
            hover:opacity-80
            ${
              type === 'error'
                ? 'focus:ring-red-400'
                : type === 'warning'
                  ? 'focus:ring-yellow-400'
                  : type === 'info'
                    ? 'focus:ring-blue-400'
                    : 'focus:ring-green-400'
            }
          `}
        >
          ✕
        </button>
      )}
    </div>
  )
}

AccessibleAlert.displayName = 'AccessibleAlert'
