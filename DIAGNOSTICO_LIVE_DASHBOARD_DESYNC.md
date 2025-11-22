# 🔍 DIAGNÓSTICO: Live Dashboard Desync (Telão vs Local)

## 🎯 PROBLEMA IDENTIFICADO

**Logs do Console NÃO mostram `[useRealtimeQuests]`** - componente não está sendo executado na página live!

## ✅ Fatos Confirmados

1. **useRealtimePhase FUNCIONA** - logs mostram:
   ```
   [useRealtimePhase] 📡 Chamando RPC para dados da fase...
   [useRealtimePhase] ✅ RPC sucesso - Fase: 3
   ```

2. **useRealtimeQuests NÃO EXECUTA** - não há nenhum log:
   ```
   [useRealtimeQuests] Realtime subscription ativa!  ← AUSENTE
   [useRealtimeQuests] Ativando polling fallback     ← AUSENTE
   ```

3. **CurrentQuestTimer NÃO MOSTRA LOGS** - não há:
   ```
   [CurrentQuestTimer] phase_id encontrado           ← AUSENTE
   [CurrentQuestTimer] Quests atualizadas via Realtime ← AUSENTE
   ```

## 🔎 Análise

O `CurrentQuestTimer` é renderizado em `live-dashboard/page.tsx` **COM CONDIÇÃO**:

```tsx
{!showContent || phaseLoading ? (
  <div>Carregando informações da fase...</div>
) : phase?.event_status === 'running' && phase?.phase_started_at && phase?.current_phase > 0 ? (
  <div className="mb-6">
    <CurrentQuestTimer
      phase={phase.current_phase}
      phaseStartedAt={phase.phase_started_at}
      phaseDurationMinutes={phase.phases?.duration_minutes || 60}
    />
  </div>
) : null}
```

### Possíveis Causas do Componente Não Renderizar:

1. ❓ `phase.event_status !== 'running'`
2. ❓ `phase.phase_started_at` é null/undefined
3. ❓ `phase.current_phase <= 0`
4. ❓ Delay do `showContent` (500ms) + fase carregando

## 🔧 PRÓXIMOS PASSOS

### 1️⃣ Verificar valores de `phase` no telão:

No console do **TELÃO**, execute:

```javascript
// Ver objeto phase completo
window.phaseDebug = {}
setTimeout(() => {
  const scripts = document.querySelectorAll('script')
  scripts.forEach(s => {
    if (s.textContent?.includes('useRealtimePhase')) {
      console.log('✅ Script encontrado que usa useRealtimePhase')
    }
  })
}, 2000)
```

### 2️⃣ Adicionar log temporário no código:

Adicionar no início de `CurrentQuestTimer.tsx`:

```tsx
console.log('🔴 [CurrentQuestTimer] RENDERIZADO COM PROPS:', { phase, phaseStartedAt, phaseDurationMinutes })
```

### 3️⃣ Verificar se componente monta:

No console do telão:

```javascript
// Procurar pelo componente na DOM
document.querySelectorAll('[class*="CurrentQuest"]').length
```

## 🎯 HIPÓTESE PRINCIPAL

**O `CurrentQuestTimer` não está sendo renderizado no telão** porque:
- Condição `phase?.event_status === 'running'` retorna false
- OU `phaseLoading` permanece true
- OU `showContent` delay de 500ms está causando problema

**Resultado:** Sem `CurrentQuestTimer` → Sem `useRealtimeQuests` → Sem WebSocket → Dados estáticos ou cache antigo

## 🛠️ SOLUÇÃO TEMPORÁRIA

**Hard refresh no telão:** `Ctrl + Shift + R`
- Limpa cache
- Reconecta WebSocket
- Re-renderiza todos componentes

## 🛠️ SOLUÇÃO PERMANENTE

Adicionar logs de debug para confirmar rendering do `CurrentQuestTimer`.
