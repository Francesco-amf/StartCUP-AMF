import { createBrowserClient, type AuthChangeEvent, type Session } from '@supabase/ssr'

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
    
    // CORREÇÃO: Adicionados os tipos para 'event' e 'session'
    clientInstance.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'TOKEN_REFRESHED' && session) {
        console.log('✅ Token auto-refreshed')
      } else if (event === 'USER_UPDATED') {
        console.log('👤 User updated')
      }
      // NÃO logar SIGNED_OUT pois pode impactar outras abas
    })
  }

  return clientInstance
}