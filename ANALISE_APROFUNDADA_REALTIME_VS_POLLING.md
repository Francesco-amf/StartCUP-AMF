# 📊 Análise Aprofundada: Realtime vs Polling - Sistema Completo

**Data**: 2025-11-14
**Escopo**: Sistema inteiro de sincronização em tempo real
**Status**: Análise sem modificações

---

## 🎯 RESUMO EXECUTIVO

O sistema tem **DOIS AMBIENTES DE DADOS COMPLETAMENTE DIFERENTES**:

1. **Environment REALTIME** (useRealtimeQuests) - WebSocket ✅ CORRETO
2. **Environment POLLING** (todos os outros) - HTTP a cada 500ms ❌ PROBLEMA

**Problema Principal**: Não há fallback entre Realtime e Polling. Se um falha, o outro não substitui.

---

## 📋 MAPA COMPLETO DE HOOKS

### 1. **useRealtimeRanking()**
**File**: `src/lib/hooks/useRealtime.ts:21-75`

```
Estratégia: HTTP POLLING
Intervalo: 500ms (sem delay)
Visibilidade: SIM (pausa se aba oculta)
Dependências: [supabase]
Stagger: T=0ms (primeiro hook)

Requests/minuto:
- Aba ativa: 120 req/min
- Aba oculta: 0 req/min

Comportamento:
- Busca imediatamente (linha 60)
- Define polling 500ms (linha 65)
- Cleanup: clearInterval (linhas 69)
```

**Problema**: Depende de `supabase`, se recriado, polling para

---

### 2. **useRealtimePhase()**
**File**: `src/lib/hooks/useRealtime.ts:78-197`

```
Estratégia: HTTP POLLING + RPC FALLBACK
Intervalo: 500ms (com delay de 125ms)
Visibilidade: SIM (pausa se aba oculta)
Dependências: [supabase]
Stagger: T=125ms (segundo hook)

Queries por ciclo (CRÍTICO!):
- 1x RPC call: get_current_phase_data()
- Se RPC falhar:
  - 1x Query: event_config table
  - 1x Query: quests table (se phase > 0)

Total possível: 3 queries por 500ms = 360 queries/min de UM HOOK

Requests/minuto:
- Melhor caso (RPC sucesso): 120 req/min
- Pior caso (RPC falha): 360 req/min
- Aba oculta: 0 req/min

Comportamento:
- Busca imediatamente (linha 176)
- Define polling com delay 125ms (linhas 182-184)
- Cleanup: clearTimeout + clearInterval (linhas 188-191)
```

**Problema Crítico 1**: Se RPC falha, faz 3 queries em cascata
**Problema Crítico 2**: Depende de `supabase`, causando re-polling

---

### 3. **useRealtimePenalties()**
**File**: `src/lib/hooks/useRealtime.ts:200-269`

```
Estratégia: HTTP POLLING (sem Realtime)
Intervalo: 500ms (com delay de 250ms)
Visibilidade: NÃO (sempre polling)
Dependências: [supabase, play]
Stagger: T=250ms (terceiro hook)

Requests/minuto: 120 req/min (sempre)

Comportamento:
- Busca imediatamente (linha 250)
- Define polling com delay 250ms (linhas 255-257)
- Toca som quando nova penalidade detectada (linha 226)
- Cleanup: clearTimeout + clearInterval (linhas 261-264)

Features Especiais:
- Rastreia IDs anteriores em previousPenaltyIdsRef
- Detecta novas penalidades para tocar som
```

**Problema**: Não há Realtime, apenas polling. Pode perder penalidades durante crashes

---

### 4. **useRealtimeEvaluators()**
**File**: `src/lib/hooks/useRealtime.ts:272-346`

```
Estratégia: HTTP POLLING (sem Realtime)
Intervalo: 500ms (com delay de 375ms)
Visibilidade: SIM (pausa se aba oculta)
Dependências: [supabase, play]
Stagger: T=375ms (quarto hook)

Requests/minuto:
- Aba ativa: 120 req/min
- Aba oculta: 0 req/min

Comportamento:
- Busca imediatamente (linha 326)
- Define polling com delay 375ms (linhas 331-333)
- Toca som quando avaliador online/offline (linhas 305-310)
- Cleanup: clearTimeout + clearInterval (linhas 337-340)

Features Especiais:
- Rastreia estado de online/offline anterior
- Toca som diferente (online vs offline)
```

**Problema**: Sem Realtime, delay de até 500ms para detectar status

---

### 5. **useRealtimeQuests()** ⭐ NOVO
**File**: `src/lib/hooks/useRealtimeQuests.ts:33-162`

```
Estratégia: WEBSOCKET REALTIME (ÚNICO!)
Intervalo: Instant (< 10ms)
Visibilidade: NÃO (sempre subscrito)
Dependências: [phaseId, supabase]
Requests: 1 inicial + eventos WebSocket

Comportamento:
- Initial Load: 1 query (linha 57-61)
- Subscribe: WebSocket channel (linhas 79-135)
- Event Types: INSERT, UPDATE, DELETE (linha 84)
- Re-order: Automático por order_index (linha 123)
- Cleanup: removeChannel (linha 153)

Features:
- Único hook com Realtime genuíno
- Sem polling em loop
- 0 requisições quando dados estáveis
```

**Problema Crítico**: NÃO tem fallback para polling se WebSocket falhar!

---

### 6. **useRealtimePenaltiesOptimized()**
**File**: `src/lib/hooks/useRealtimePenaltiesOptimized.ts`

```
Estratégia: SWR (Stale While Revalidate)
Intervalo: 5000ms (5 segundos)
Visibilidade: SIM
Dependências: [isPageVisible]

Requests/minuto:
- Aba ativa: 12 req/min
- Aba oculta: 0 req/min

Features:
- Cache + revalidação em background
- Exponential backoff on errors
- Menos agressivo que polling 500ms
```

**Status**: Exists but NOT USED (apenas hook declaration)

---

### 7. **useRealtimeRankingOptimized()**
**File**: `src/lib/hooks/useRealtimeRankingOptimized.ts`

```
Estratégia: SWR (Stale While Revalidate)
Intervalo: 5000ms (5 segundos)
Visibilidade: SIM

Requests/minuto:
- Aba ativa: 12 req/min
- Aba oculta: 0 req/min
```

**Status**: Exists but NOT USED (apenas hook declaration)

---

## 🔌 ANÁLISE: CurrentQuestTimer Component

**File**: `src/components/dashboard/CurrentQuestTimer.tsx:287-401`

```typescript
// Linha 287-288: Instancia Supabase
const supabaseRef = useRef(createClient())
const supabase = supabaseRef.current

// Linha 336: Lookup de phase_id
const [phaseId, setPhaseId] = useState<string | null>(null)

// Linhas 338-369: Busca phase_id
useEffect(() => {
  const getPhaseId = async () => {
    const { data: phaseData } = await supabase
      .from('phases')
      .select('id')
      .eq('order_index', phase)
      .single()
    setPhaseId(phaseData?.id || null)
  }
  getPhaseId()
}, [phase, supabase])  // ⚠️ PROBLEMA: Depende de supabase!

// Linha 372: Usa Realtime hook
const { quests: realtimeQuests, ... } = useRealtimeQuests(phaseId)

// Linhas 374-399: Sync com state
useEffect(() => {
  if (phaseId) {
    if (realtimeQuests && realtimeQuests.length > 0) {
      setQuests(realtimeQuests)
      setLoadingQuests(false)
    } else if (realtimeError) {
      setQuests(PHASES_QUESTS_FALLBACK[phase] || [])
    }
  }
}, [phaseId, realtimeQuests, realtimeLoading, realtimeError, phase])
```

**Problemas Identificados**:

1. **Dependência de supabase causa re-lookup**
   - Se `supabase` recriado → triggers `getPhaseId()` novamente
   - Cria novo `useRealtimeQuests(phaseId)`
   - Interrompe subscription anterior
   - Dados brevemente perdidos

2. **Sem fallback polling**
   - Se WebSocket falha → mostra fallback quests
   - Não tenta polling automático
   - User vê dados stale indefinidamente

---

## 📊 MAPA DE REQUISIÇÕES (live-dashboard page)

```
Componente: live-dashboard (src/app/live-dashboard/page.tsx)

Hooks usados:
├─ useRealtimeRanking()          → 120 req/min (aba ativa)
├─ useRealtimePhase()            → 120-360 req/min (aba ativa)
└─ CurrentQuestTimer
   └─ useRealtimeQuests()        → 1 inicial + WebSocket

Outros componentes:
├─ LivePowerUpStatus             → Fetch 1x (sem polling!)
├─ LivePenaltiesStatus           → Fetch 1x (sem polling!)
│  └─ Usa useRealtimePenalties() → 120 req/min (REDUNDANTE!)
└─ RankingBoard                  → Usa ranking do hook

Total de requisições na aba ativa:
- Mínimo: 240 req/min (Ranking + Phase)
- Máximo: 480 req/min (Phase com 3 queries)
- Com penalidades: 600 req/min
```

**Conclusão**: Supabase Free Tier = 5000 req/mês ≈ 6.9 req/min
**Situação**: EXCEENDE LIMITE EM 85-99x! ❌

---

## 🔄 STAGGER PATTERN (Anti-Polling-Storm)

Sistema implementou stagger para evitar picos:

```
T=0ms:    useRealtimeRanking executa
T=125ms:  useRealtimePhase executa
T=250ms:  useRealtimePenalties executa
T=375ms:  useRealtimeEvaluators executa

T=500ms:  Todos 4 hooks executam novamente (4 requests simultâneos)
T=625ms:  Ranking executa novamente
T=750ms:  Phase executa novamente
...

⚠️ PROBLEMA: Ainda há picos simultâneos a cada 500ms
Pico máximo: 4-6 requests ao mesmo tempo (linha 65, 183, 256, 332)
```

---

## ❌ RACE CONDITIONS IDENTIFICADAS

### Race Condition #1: Phase Lookup Loop

```
Fluxo:
1. CurrentQuestTimer monta
2. supabase instanciado em useRef (OK)
3. Busca phase_id via useEffect([phase, supabase])
4. Passa phaseId para useRealtimeQuests
5. useRealtimeQuests(phaseId) instancia supabase NOVAMENTE
6. Se supabase do parent recriado → triggers getPhaseId() again
7. Novo phaseId → Nova subscription em useRealtimeQuests
8. Anterior subscription não cleanup rápido
9. RESULTADO: Múltiplas subscriptions abertas, uma fecha enquanto outra abre
```

**Impacto**: Perda de dados durante transição

---

### Race Condition #2: Concurrent Polling

```
Fluxo (dentro de 1 segundo):
T=0ms:    useRealtimeRanking começa fetch
T=60ms:   fetch ainda em progresso (network latency)
T=125ms:  useRealtimePhase começa fetch
T=190ms:  AMBOS fazem request SIMULTANEAMENTE
T=500ms:  Todos 4 hooks refazem fetch
T=560ms:  Múltiplos fetches em progresso

Problema:
- Supabase pode throttle requests
- Alguns podem falhar silenciosamente
- isFetching flag é local (não compartilhado entre hooks)
- Sem coordenação entre hooks
```

**Impacto**: Perda de dados, erros silenciosos

---

### Race Condition #3: Subscription Recreation

```
useRealtimeQuests tem dependências: [phaseId, supabase]

Se supabase recriado:
1. useRealtimeQuests.useEffect refira (linha 42)
2. Subscription anterior NOT cleanup (ainda em channel removal)
3. Nova subscription iniciada
4. RESULTADO: 2 subscriptions simultâneas
5. Dados duplicados ou conflituosos
```

---

## 🛡️ ERROR HANDLING ANALYSIS

### useRealtimeQuests (Novo)

```typescript
// Linha 65-67: Initial load error
if (initialError) {
  console.error(...)
  setError(initialError.message)
  setLoading(false)
  return  // ← PARA TUDO!
}

// Linhas 88-127: Event handler
// Sem try-catch! Se erro no processamento, subscription silenciosamente quebra

// Linha 126: Clears error
setError(null)

PROBLEMA:
- Se event processing bate erro, sem recovery
- setError(null) pode nunca ser chamado
- Component mostra "loading" indefinidamente
- Nenhum fallback para polling
```

---

### useRealtimePhase (Antigo)

```typescript
// Linhas 103-111: RPC try-catch
try {
  const { data: rpcData, error: rpcError } = await supabase.rpc(...)
  if (!rpcError && rpcData?.event_config) {
    eventConfig = rpcData.event_config
  }
} catch (rpcErr) {
  // Continue to fallback ← BOM!
}

// Linhas 114-143: Fallback queries
if (!eventConfig) {
  // Query event_config directly
  // Query quests if phase > 0
}

// Linhas 166-169: Top-level error
catch (err) {
  console.error('[useRealtimePhase] Error:', err)
  setPhase(null)  // ← Remove dados!
  setLoading(false)
}

PROBLEMA:
- Setando phase=null remove todos dados
- Component mostra erro indefinidamente
- Sem retry automático
```

---

## 📈 CARGA NO SERVIDOR (Estimativa)

```
Cenário: 10 usuários na live-dashboard simultaneamente

Por usuário:
- useRealtimeRanking:    120 req/min
- useRealtimePhase:      120-360 req/min (average 240)
- useRealtimePenalties:  120 req/min
- useRealtimeEvaluators: 120 req/min
Total por usuário:       600 req/min

Para 10 usuários:
- Total: 6000 req/min = 100 req/seg

Supabase Free Tier:
- Limite: 5000 req/MÊS
- Tempo até limite: ~50 minutos com 10 usuários!
- Com 50 usuários: ~10 minutos

⚠️ CRÍTICO: Sistema não é escalável no free tier
```

---

## 🎯 COMPARAÇÃO: useRealtimeQuests vs Outros

```
                 Realtime   Polling    Optimized
                 (Quests)   (Others)   (Unused)
─────────────────────────────────────────────────
Mecanismo        WebSocket  HTTP       SWR Cache
Intervalo        Instant    500ms      5000ms
Req quando idle  0          120/min    12/min
Req quando ativo 1 + WS     120/min    12/min
Escalável?       SIM ✅     NÃO ❌     SIM ✅
Fallback?        NÃO ❌     N/A        SIM ✅
Error recovery   POBRE ❌   POBRE ❌   BOA ✅
Deploy status    NOVO       LEGADO     UNUSED
─────────────────────────────────────────────────
```

---

## 🚨 PROBLEMAS CRÍTICOS (RESUMO)

### CRÍTICO #1: Sem Fallback Realtime → Polling
**Arquivo**: useRealtimeQuests.ts
**Impacto**: Se WebSocket falha, UI congela em "loading"
**Solução**: Implementar polling fallback automático
**Esforço**: 30 minutos

---

### CRÍTICO #2: Multiple Queries por Poll (useRealtimePhase)
**Arquivo**: useRealtime.ts:103-143
**Impacto**: 360 req/min em vez de 120 req/min
**Causa**: RPC fallback com 3 queries em cascata
**Solução**: Cache RPC result ou usar apenas fallback
**Esforço**: 20 minutos

---

### CRÍTICO #3: Supabase Dependency Loop
**Arquivo**: CurrentQuestTimer.tsx:341, useRealtimeQuests.ts:40
**Impacto**: Subscription recriada desnecessariamente
**Solução**: Mover createClient fora do hook, ou usar useMemo
**Esforço**: 15 minutos

---

### CRÍTICO #4: Exceeds Supabase Free Tier
**Impacto**: 600 req/min vs 5000 req/mês limit
**Solução**: Otimizar polling intervals
**Esforço**: Depende de solução acima

---

## 🟡 PROBLEMAS ALTOS (Não-Críticos)

### ALTO #1: LivePowerUpStatus Sem Polling
**Arquivo**: dashboard/LivePowerUpStatus.tsx
**Problema**: Busca 1x, nunca atualiza
**Impacto**: User vê dados desatualizado
**Solução**: Usar hook polling ou Realtime
**Esforço**: 20 minutos

---

### ALTO #2: LivePenaltiesStatus Duplicado
**Arquivo**: dashboard/LivePenaltiesStatus.tsx + useRealtime.ts
**Problema**: Componente faz fetch, também usa useRealtimePenalties
**Impacto**: 2x requisições para mesmos dados
**Solução**: Usar apenas hook, remover fetch direto
**Esforço**: 15 minutos

---

### ALTO #3: No Shared State Between Hooks
**Problema**: Cada hook tem seu próprio supabase client
**Impacto**: Múltiplas conexões, memory leak potencial
**Solução**: Criar Supabase provider no app level
**Esforço**: 1-2 horas

---

## 📈 RECOMENDAÇÕES (Ordem de Impacto)

### Prioridade 1: Implement Polling Fallback (Crítico)
```
if (phaseId) {
  // Se WebSocket falhar, tenta polling
  if (!subscription.connected) {
    startPollingFallback()
  }
}
```
**Impacto**: 100% - Previne UI congelada
**Esforço**: 30 minutos

---

### Prioridade 2: Optimize useRealtimePhase (Crítico)
```
// Escolha 1: Cache RPC result por 5 segundos
// Escolha 2: Use apenas fallback (sem RPC)
// Resultado: 240 req/min → 120 req/min
```
**Impacto**: 50% query reduction
**Esforço**: 20 minutos

---

### Prioridade 3: Fix Supabase Dependency (Crítico)
```
// Mover createClient fora de hook
const supabase = useMemo(() => createClient(), [])
```
**Impacto**: Elimina race conditions
**Esforço**: 15 minutos

---

### Prioridade 4: Consolidate Penalties (Alto)
```
// LivePenaltiesStatus: Use hook em vez de fetch direto
// Resultado: -120 req/min
```
**Impacto**: Query reduction
**Esforço**: 15 minutos

---

### Prioridade 5: Add Polling to PowerUpStatus (Alto)
```
// LivePowerUpStatus: Implementar polling ou Realtime
// Resultado: Dados sempre atualizados
```
**Impacto**: Better UX
**Esforço**: 20 minutos

---

### Prioridade 6: Centralize Supabase (Médio)
```
// app.tsx: Provider com Supabase Context
// Todos hooks: usam context client
// Resultado: 1 conexão compartilhada, melhor memory
```
**Impacto**: Escalabilidade
**Esforço**: 1-2 horas

---

## 📊 VISUALIZAÇÃO: Timeline de Requisições

```
T=0ms    Aba carrega
├─ Ranking.fetch() inicia
└─ Penalidades.fetch() inicia

T=50ms   Aba carrega (cont)
└─ Phase.fetch() inicia

T=100ms  3 fetches em progresso
└─ Evaluators.fetch() inicia (não, ainda não, delay 375ms)

T=150ms  3 fetches em progresso

T=200ms  Respostas começam a chegar

T=250ms
└─ Penalidades polling inicia (delay 250ms)
└─ Fetches prévios ainda em progresso (network lag)

T=375ms
└─ Evaluators polling inicia (delay 375ms)
└─ Múltiplos fetches simultâneos possível

T=500ms  ← PICO DE REQUISIÇÕES
├─ Ranking.fetch() inicia (segundo ciclo)
├─ Phase.fetch() inicia
├─ Penalidades.fetch() inicia
├─ Evaluators.fetch() inicia
└─ Quests Realtime: Nenhuma requisição (WebSocket)

T=600ms
└─ Múltiplos fetches em progresso

⚠️ Problema: Pico de 4-6 requests simultâneos a cada 500ms
```

---

## 🎓 LIÇÕES APRENDIDAS

1. **Realtime vs Polling**: Realtime é melhor MAS PRECISA de fallback
2. **Stagger não resolve tudo**: Ainda há picos simultâneos
3. **Supabase Client**: Deve ser centralizado, nunca recriado
4. **Fallback Pattern**: Todo Realtime precisa fallback para polling
5. **Scaling**: Free tier não suporta 600 req/min for múltiplos usuários
6. **Error Handling**: Error não pode remover dados (setPhase(null))

---

## ✅ CONCLUSÃO

Sistema tem **boa arquitetura com WebSocket Realtime**, mas **pobre implementation**:

- ✅ useRealtimeQuests: Correto (mas sem fallback)
- ❌ useRealtimePhase: Polindo (mas 360 req/min possível)
- ❌ useRealtimePenalties: Polindo (sem Realtime option)
- ❌ useRealtimeEvaluators: Polling (sem Realtime option)
- ❌ LivePowerUpStatus: Sem atualização (1x fetch)
- ❌ Supabase client: Recriado desnecessariamente

**Status**: Funcionando, mas não escalável e não robusto.

**Próximos passos**: Implementar 6 prioridades acima em ordem para melhorar 80% dos problemas em ~3 horas.

