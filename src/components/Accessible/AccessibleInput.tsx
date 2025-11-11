'use client'

import React from 'react'

interface AccessibleInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  description?: string
  isRequired?: boolean
  onValidate?: (value: string) => void
}

/**
 * Input acessível com suporte completo a ARIA
 * - Label associado via htmlFor
 * - aria-describedby para descrições e erros
 * - aria-invalid para estados de erro
 * - aria-required para campos obrigatórios
 * - Validação opcional customizável
 */
export const AccessibleInput = React.forwardRef<
  HTMLInputElement,
  AccessibleInputProps
>(
  (
    {
      label,
      error,
      description,
      isRequired = false,
      onValidate,
      className = '',
      ...props
    },
    ref
  ) => {
    const id = React.useId()
    const errorId = `${id}-error`
    const descriptionId = `${id}-description`

    const describedBy = [error ? errorId : null, description ? descriptionId : null]
      .filter(Boolean)
      .join(' ')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onValidate) {
        onValidate(e.target.value)
      }
      props.onChange?.(e)
    }

    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-200"
        >
          {label}
          {isRequired && (
            <span aria-label="obrigatório" className="text-red-400 ml-1">
              *
            </span>
          )}
        </label>

        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          aria-required={isRequired}
          required={isRequired}
          onChange={handleChange}
          className={`
            w-full px-4 py-2 rounded-lg
            bg-gray-700 text-gray-100
            border-2 border-gray-600
            focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />

        {description && (
          <p id={descriptionId} className="text-xs text-gray-400">
            {description}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-red-400 flex items-center gap-1"
          >
            <span aria-hidden="true">⚠️</span>
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleInput.displayName = 'AccessibleInput'
