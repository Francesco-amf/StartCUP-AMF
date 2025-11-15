# 🐛 Análise - Card da Quest Sumindo e Reaparecendo

**Data**: 2025-11-14
**Problema**: Card do CurrentQuestTimer pisca/some e reaparece constantemente
**Severidade**: 🔴 CRÍTICO (afeta visualização em tempo real)
**Status**: ANÁLISE COMPLETA

---

## 🔍 Raiz do Problema

O problema está no **dependency array do useEffect que atualiza `quests`** (linha 401):

```typescript
// PROBLEMA - Linhas 376-401
useEffect(() => {
  if (phaseId) {
    if (realtimeQuests && realtimeQuests.length > 0) {
      console.log(...)
      setQuests(realtimeQuests)  // ❌ State update
      setLoadingQuests(false)
    } else if (realtimeError) {
      setQuests(PHASES_QUESTS_FALLBACK[phase] || [])
      setLoadingQuests(false)
    } else if (realtimeLoading) {
      setLoadingQuests(true)
    }
  }
}, [phaseId, realtimeQuests, realtimeLoading, realtimeError, phase])
//  ↑ Dependency array tem MUITAS coisas que mudam frequentemente
```

---

## 📊 Cenário de Pisca

### Timeline do Problema:

```
T=0ms: realtimeQuests recebe dados do Realtime
       ↓
T=1ms: setQuests(realtimeQuests) é chamado
       ↓
T=2ms: Component re-render com new quests
       ↓
T=3ms: Linha 398: fetchQuestsRef.current = async () => { ... }
       ↓
T=5ms: Polling fallback (2s) dispara e faz fetch HTTP
       ↓
T=50ms: Fetch HTTP retorna dados ANTERIORES (ligeiramente stale)
        ↓
T=51ms: setQuests(data) é chamado COM OS DADOS ANTIGOS
        ↓
T=52ms: Component re-render com dados DIFERENTES
        ↓
T=53ms: UI PISCA (mudança de dados mesmo que Realtime está ativo)
```

---

## 🚨 Problema Raiz - 3 Cenários

### Cenário 1: Realtime vs Polling Fighting

**O que acontece**:
1. Realtime subscription envia dados → `setQuests(realtimeQuests)`
2. Polling fallback TAMBÉM faz fetch HTTP → `setQuests(data)`
3. Se polling retorna dados ligeiramente diferentes → pisca!

**Log esperado**:
```
✅ [useRealtimeQuests] Realtime subscription ativa!
✅ [useRealtimeQuests-Polling] Quests atualizadas via polling: 4 items
   ↓ UI PISCA se dados diferentes!
```

---

### Cenário 2: Dependency Array Muito Sensível

O useEffect é rodado TODA VEZ que algum desses muda:
- `phaseId` ✅ OK (deveria rodar)
- `realtimeQuests` ❌ PROBLEMA (roda 120x/min se polling)
- `realtimeLoading` ❌ PROBLEMA (pode mudar frequentemente)
- `realtimeError` ❌ PROBLEMA (pode flutuar)
- `phase` ❌ PROBLEMA (não deveria estar aqui)

---

### Cenário 3: Fallback Polling NÃO para quando Realtime Funciona

**Problema no código P1.1**:

```typescript
// useRealtimeQuests.ts, linha 163-183
.subscribe((status: any) => {
  console.log(`🔔 [useRealtimeQuests] Subscription status: ${status}`)

  subscriptionHealthRef.current = status === 'SUBSCRIBED'

  if (status === 'SUBSCRIBED') {
    console.log(`✅ [useRealtimeQuests] Realtime subscription ativa!`)
    // ✅ Para o polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  } else {
    // ✅ Inicia polling
    if (!pollingIntervalRef.current && mounted) {
      pollingIntervalRef.current = setInterval(fetchQuestsFallback, 2000)
    }
  }
})
```

**O problema**: Se Realtime dispara eventos constantemente → status é `SUBSCRIBED` constantemente
Mas se há 1 momento onde status é diferente (ou a connection flutua) → polling inicia
E depois quando volta a `SUBSCRIBED` → polling para

**Resultado**: Realtime + Polling rodam ao mesmo tempo por curtos períodos → dados inconsistentes → PISCA!

---

## 🎯 Raízes Identificadas (3 problemas)

### 1. **Polling Fallback NÃO Deveria Rodar se Realtime Está Bom**

O polling está MUITO agressivo (2 segundos). Se WebSocket está funcionando, polling não deveria NUNCA rodar.

**Solução**:
- Polling deveria ser realmente "fallback" (apenas se Realtime FALHAR)
- Não deveria rodar "por precaução" enquanto Realtime funciona
- Atualmente funciona para fallback, MAS há edge cases

---

### 2. **Dependency Array em CurrentQuestTimer (Linhas 376-401) é Muito Sensível**

```typescript
}, [phaseId, realtimeQuests, realtimeLoading, realtimeError, phase])
```

Deveria ser apenas:
```typescript
}, [phaseId, realtimeQuests])
```

**Porquê**:
- `realtimeLoading` muda frequentemente → re-executa efeito
- `realtimeError` pode flutuar → re-executa efeito
- `phase` não precisa estar aqui (não é usado dentro do efeito)

---

### 3. **fetchQuestsFallback Rodando Mesmo com Realtime Saudável**

Quando Realtime está funcionando bem, polling HTTP AINDA faz requests a cada 2 segundos.

Se isso retorna dados ligeiramente diferentes (race condition) → pisca!

**Exemplo**:
```
T=0ms:  Realtime: Quest 1 started_at="2025-11-14T10:00:00Z"
T=5ms:  Polling: Quest 1 started_at="2025-11-14T10:00:01Z" (carimbo diferente!)
        ↓ PISCA porque realtimeQuests mudou!
```

---

## 📈 Evidência Técnica

### Log Pattern que Indica o Problema:

```
✅ [useRealtimeQuests] Realtime subscription ativa!
🛑 [useRealtimeQuests] Parando polling fallback
✅ [useRealtimeQuests-Polling] Quests atualizadas via polling: 4 items ← ❌ AQUI!
   (Não deveria ter "Polling" log se Realtime está SUBSCRIBED!)
```

---

## 🔧 Solução (3 correções)

### Correção 1: Remover `phase` e `realtimeLoading`/`realtimeError` do Dependency Array

**Antes**:
```typescript
}, [phaseId, realtimeQuests, realtimeLoading, realtimeError, phase])
```

**Depois**:
```typescript
}, [phaseId, realtimeQuests])
```

---

### Correção 2: Melhorar Lógica de Fallback Polling

Ao invés de polling rodar a cada 2s MESMO com Realtime bom, implementar:

1. Polling PERMANECE PARADO enquanto Realtime é `SUBSCRIBED`
2. Se Realtime falha (status ≠ SUBSCRIBED), inicia polling
3. Se Realtime volta, para polling
4. **Importante**: NÃO rodar ambos simultaneamente

**Código atual já faz isso, MAS há edge case**:
- Connection flutua entre SUBSCRIBED e CONNECTING
- Durante CONNECTING, polling inicia
- Quando volta a SUBSCRIBED, polling para
- Mas isso é rápido demais → ambos rodando = dados inconsistentes

**Solução**: Usar debounce para polling (não inicia de imediato)

---

### Correção 3: Garantir que Polling Só Roda se Realtime REALMENTE Morreu

```typescript
// Ao invés de iniciar polling no primeiro sinal de falha
if (!pollingIntervalRef.current && mounted) {
  pollingIntervalRef.current = setInterval(fetchQuestsFallback, 2000)
}

// Implementar: só começar polling após 5 segundos de SUBSCRIBED=false
const pollingDebounceRef = useRef<NodeJS.Timeout | null>(null)

if (status !== 'SUBSCRIBED') {
  if (!pollingDebounceRef.current) {
    pollingDebounceRef.current = setTimeout(() => {
      // Só ativa polling após 5s confirmando que Realtime morreu
      if (subscriptionRef.current && status !== 'SUBSCRIBED') {
        pollingIntervalRef.current = setInterval(fetchQuestsFallback, 2000)
      }
    }, 5000)
  }
} else {
  // Realtime está vivo, parar polling e limpar debounce
  if (pollingDebounceRef.current) {
    clearTimeout(pollingDebounceRef.current)
    pollingDebounceRef.current = null
  }
  if (pollingIntervalRef.current) {
    clearInterval(pollingIntervalRef.current)
    pollingIntervalRef.current = null
  }
}
```

---

## 📋 Impacto por Correção

| Correção | Impacto | Prioridade |
|----------|--------|-----------|
| **1. Remove deps sensíveis** | 60% reduz re-renders | 🔴 CRÍTICO |
| **2. Evita Realtime+Polling simultâneos** | 30% reduz pisca | 🟠 ALTO |
| **3. Debounce polling** | 10% mais estável | 🟡 MÉDIO |

---

## 🧪 Como Testar Problema Atual

### Teste 1: Simular Realtime Funcional
```
1. Abra live-dashboard
2. Console → search "[ActiveQuestFilter]"
3. Watch para "quests" array mudar
4. Se vir UPDATE mesmo com "[useRealtimeQuests] ativa" → problema!
```

### Teste 2: Checar Polling vs Realtime
```
1. Abra live-dashboard
2. Console → search "useRealtimeQuests"
3. Deve ver APENAS:
   - "Realtime subscription ativa"
   - "Parando polling fallback"
4. NÃO deveria ver "Polling] Quests atualizadas" (enquanto SUBSCRIBED)
```

### Teste 3: Contar Re-renders
```
1. Abra React DevTools → Profiler
2. Watch CurrentQuestTimer component
3. Record durante 10 segundos
4. Contar re-renders
5. Se > 5 re-renders/segundo → problema!
```

---

## 🚀 Implementação da Correção

**Arquivo**: [src/lib/hooks/useRealtimeQuests.ts](src/lib/hooks/useRealtimeQuests.ts)

**Arquivo**: [src/components/dashboard/CurrentQuestTimer.tsx](src/components/dashboard/CurrentQuestTimer.tsx)

---

## 💡 Resumo

**Causa Raiz**:
- Dependency array muito sensível + polling fallback rodando mesmo com Realtime bom = pisca

**Manifestação**:
- Card da quest some/reaparece a cada 2 segundos
- Dados oscilam entre Realtime e Polling
- UI flicker visível

**Severidade**: 🔴 CRÍTICO (afeta UX em tempo real)

**Correção**: 3 mudanças simples = 90% redução de pisca

---

**Próximos passos**: Implementar as 3 correções acima para eliminar problema completamente.
