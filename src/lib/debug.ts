/**
 * 🐛 Debug Configuration
 *
 * Controla logs de debug em toda a aplicação
 * Use: NEXT_PUBLIC_DEBUG=true (em .env.local ou .env.development)
 *
 * Em produção: Nenhum console output
 * Em desenvolvimento: Visibilidade completa do sistema
 */

const IS_DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG === 'true'

export const DEBUG = {
  /**
   * Log de informações do sistema (prefixado com [module-name])
   * Em produção: ignorado
   * Em dev: console.log
   */
  log: (module: string, ...args: any[]) => {
    if (IS_DEBUG_ENABLED) {
      console.log(`[${module}]`, ...args)
    }
  },

  /**
   * Log de avisos (prefixado com [module-name])
   * Em produção: ignorado
   * Em dev: console.warn
   */
  warn: (module: string, ...args: any[]) => {
    if (IS_DEBUG_ENABLED) {
      console.warn(`[${module}]`, ...args)
    }
  },

  /**
   * Log de erros (SEMPRE mostrado, mesmo em produção)
   * Erros são sempre importantes
   */
  error: (module: string, ...args: any[]) => {
    console.error(`[${module}]`, ...args)
  },

  /**
   * Verificar se debug está ativo
   */
  isEnabled: () => IS_DEBUG_ENABLED,
}

export default DEBUG
