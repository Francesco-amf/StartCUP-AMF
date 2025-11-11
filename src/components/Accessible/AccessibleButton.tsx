'use client'

import React from 'react'

interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel?: string
  ariaDescription?: string
  isLoading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Botão acessível com suporte completo a ARIA
 * - aria-label para botões apenas com ícones
 * - aria-busy para estados de carregamento
 * - aria-disabled para estados desabilitados
 * - Focus ring visible conforme WCAG 2.1 AA
 */
export const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(
  (
    {
      ariaLabel,
      ariaDescription,
      isLoading = false,
      variant = 'primary',
      size = 'md',
      disabled = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 focus:ring-offset-blue-950',
      secondary:
        'bg-gray-600 text-white hover:bg-gray-700 focus:ring-offset-gray-950',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-offset-red-950',
      ghost:
        'bg-transparent text-current hover:bg-gray-800/50 focus:ring-offset-transparent',
    }

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm min-h-10 min-w-10',
      md: 'px-4 py-2 text-base min-h-12 min-w-12',
      lg: 'px-6 py-3 text-lg min-h-14 min-w-14',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-description={ariaDescription}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <span aria-hidden="true" className="mr-2">
            ⏳
          </span>
        )}
        {children}
      </button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'
