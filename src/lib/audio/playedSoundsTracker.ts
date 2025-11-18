/**
 * Rastreador global de sons tocados
 * Garante que sons de evento toquem EXATAMENTE UMA VEZ per sessão/evento
 * Usa múltiplas camadas: memória (rápido) + sessionStorage (persiste em abas)
 */

type SoundEventKey = `phase-1-quest-1` | `phase-${number}-quest-1` | `boss-${string}` | `quest-${string}`

class PlayedSoundsTracker {
  private playedSounds: Set<SoundEventKey> = new Set()
  private readonly STORAGE_KEY = 'amf_played_sounds'

  constructor() {
    // Carregar do sessionStorage ao inicializar (persiste entre reloads da aba)
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return

    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        this.playedSounds = new Set(parsed as SoundEventKey[])
        console.log(`🎵 [PlayedSoundsTracker] Carregou ${this.playedSounds.size} sons do sessionStorage`)
      }
    } catch (err) {
      console.warn('⚠️ Erro ao carregar sounds do sessionStorage:', err)
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.playedSounds)))
    } catch (err) {
      console.warn('⚠️ Erro ao salvar sounds no sessionStorage:', err)
    }
  }

  /**
   * Verifica e marca um som como tocado
   * @returns true se o som NÃO foi tocado antes (deve tocar), false se já foi
   */
  public shouldPlay(key: SoundEventKey): boolean {
    const alreadyPlayed = this.playedSounds.has(key)

    if (alreadyPlayed) {
      console.log(`❌ [PlayedSoundsTracker] ${key} JÁ foi tocado nesta sessão. Pulando.`)
      return false
    }

    // Marcar como tocado
    this.playedSounds.add(key)
    this.saveToStorage()

    console.log(`✅ [PlayedSoundsTracker] ${key} marcado como tocado. Total: ${this.playedSounds.size}`)
    return true
  }

  /**
   * Retorna todos os sons já tocados (para debug)
   */
  public getPlayedSounds(): string[] {
    return Array.from(this.playedSounds)
  }

  /**
   * Limpa sons específicos de uma fase para permitir replay quando mudar de fase
   */
  public clearPhaseSound(phaseNumber: number): void {
    const phaseKey = `phase-${phaseNumber}-quest-1`
    if (this.playedSounds.has(phaseKey as SoundEventKey)) {
      this.playedSounds.delete(phaseKey as SoundEventKey)
      this.saveToStorage()
      console.log(`🔄 [PlayedSoundsTracker] Limpo: ${phaseKey}`)
    }
  }

  /**
   * Limpa todos os sons (útil para testes ou reset)
   */
  public clear() {
    this.playedSounds.clear()
    try {
      sessionStorage.removeItem(this.STORAGE_KEY)
    } catch (err) {
      console.warn('⚠️ Erro ao limpar sessionStorage:', err)
    }
    console.log(`🗑️ [PlayedSoundsTracker] Todos os sons foram limpos`)
  }
}

// Singleton global
export const playedSoundsTracker = new PlayedSoundsTracker()
