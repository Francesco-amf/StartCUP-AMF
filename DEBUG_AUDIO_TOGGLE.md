# 🐛 DEBUG: Botão de Som Desativando Sozinho

## Problema Reportado
O botão de ativar som se desativa seguido sozinho na live dashboard

## Investigação

### 1. Sistema de Auto-Click Virtual
- ✅ NÃO ENCONTRADO: Não há código de auto-click/virtual-click
- ✅ Busca por: `auto.*click`, `virtual.*click`, `simulate.*click`, `dispatchEvent.*click`
- Resultado: Nenhum match

### 2. AudioInitializer
- Localização: `src/components/AudioInitializer.tsx`
- Função: `setupAutoAudioAuthorization()` em `audioContext.ts`
- Comportamento:
  - Adiciona listeners para click, touchstart, keydown
  - Marca `isAudioAuthorized = true` após primeiro gesto
  - **NÃO** tenta criar AudioContext imediatamente
  - **NÃO** chama `setEnabled()` ou `toggleSounds()`

### 3. AudioAuthorizationBanner
- Localização: `src/components/dashboard/AudioAuthorizationBanner.tsx`
- Estado próprio: `authorized` (após primeiro click)
- Depende de: `soundConfig.enabled` do `useSoundSystem`
- Botão chama: `toggleSounds()` do audioManager
- **NÃO** há código que desativa automaticamente

### 4. audioManager
- Config salva em: `localStorage.soundConfig`
- Valor padrão: `{ volume: 0.7, enabled: true }`
- Funções que alteram `enabled`:
  - `toggleEnabled()` - alterna e salva
  - `setEnabled(boolean)` - define e salva
- **NÃO** há nenhum timer ou auto-toggle

### 5. Possíveis Causas

#### A. localStorage sendo sobrescrito
```typescript
// audioManager carrega do localStorage no init
private loadConfigFromStorage(): void {
  const saved = localStorage.getItem('soundConfig')
  if (saved) {
    const parsed = JSON.parse(saved)
    this.config = {
      volume: parsed.volume ?? 0.7,
      enabled: parsed.enabled ?? true  // ← Se localStorage tiver false, carrega false
    }
  }
}
```

**HIPÓTESE 1**: Outro código ou aba está modificando `localStorage.soundConfig`

#### B. Múltiplas abas abertas
- Se houver 2+ abas da live-dashboard abertas
- Uma aba pode estar desativando e salvando no localStorage
- Outra aba recarrega e pega `enabled: false`

#### C. React re-render causando re-init
- Se audioManager for re-instanciado
- Ele recarrega do localStorage
- Se localStorage tiver `enabled: false`, ele restaura desativado

#### D. Polling/Realtime causando re-render
- `AudioAuthorizationBanner` usa `soundConfig` do hook
- Hook está subscrito ao audioManager
- Se algo chamar `setEnabled(false)` em outro componente, banner atualiza

## Próximos Passos de Debug

### Opção 1: Adicionar Logs no audioManager
```typescript
// Em audioManager.ts, linha 337
setEnabled(enabled: boolean): void {
  console.log('🔧 [audioManager] setEnabled called:', {
    from: this.config.enabled,
    to: enabled,
    stack: new Error().stack  // Ver quem chamou
  })
  
  if (this.config.enabled !== enabled) {
    this.config.enabled = enabled
    this.saveConfigToStorage()
    this.notifyListeners()
  }
}
```

### Opção 2: Verificar localStorage manualmente
```javascript
// Console do navegador
console.log('soundConfig:', localStorage.getItem('soundConfig'))

// Monitorar mudanças
setInterval(() => {
  const config = localStorage.getItem('soundConfig')
  console.log('soundConfig check:', config)
}, 1000)
```

### Opção 3: Verificar se há múltiplas abas
- Fechar TODAS as abas da live-dashboard
- Abrir apenas UMA aba
- Ver se problema persiste

### Opção 4: Limpar localStorage e testar
```javascript
// Console do navegador
localStorage.removeItem('soundConfig')
location.reload()
```

## Código Relevante

### audioManager.ts (linhas 336-341)
```typescript
setEnabled(enabled: boolean): void {
  if (this.config.enabled !== enabled) {
    this.config.enabled = enabled
    this.saveConfigToStorage()
    this.notifyListeners()
  }
}
```

### AudioAuthorizationBanner.tsx (linhas 84-98)
```tsx
{authorized && (
  <button
    onClick={toggleSounds}  // ← Chama audioManager.toggleEnabled()
    className={...}
  >
    {soundConfig.enabled ? '🔊 Desativar' : '🔇 Ativar'}
  </button>
)}
```

## Solução Temporária
Se problema persistir, podemos:
1. Remover persistência do localStorage (sempre começar com `enabled: true`)
2. Adicionar debounce no toggleSounds (evitar clicks duplos)
3. Adicionar flag para ignorar mudanças externas de localStorage
