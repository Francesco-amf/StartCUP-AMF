import { createBrowserClient } from '@supabase/ssr'
// CORREÇÃO: Importar os tipos do pacote principal '@supabase/supabase-js'
import { type AuthChangeEvent, type Session } from '@supabase/supabase-js'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null
let listenerRegistered = false

export function createClient() {
  // Reutilizar instância para evitar múltiplos listeners
  if (clientInstance) {
    return clientInstance
  }

  clientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Adicionar listeners para auto-refresh de token APENAS UMA VEZ
  if (typeof window !== 'undefined' && !listenerRegistered) {
    listenerRegistered = true
    
    // Tipos corretos aplicados
    clientInstance.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'TOKEN_REFRESHED' && session) {
        // Auto-refresh de token ocorreu
      } else if (event === 'USER_UPDATED') {
        // User foi atualizado
      }
      // NÃO logar SIGNED_OUT pois pode impactar outras abas
    })
  }

  return clientInstance
}