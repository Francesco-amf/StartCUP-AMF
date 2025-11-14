# 📊 Análise: Sistema de Polling vs Realtime (Supabase Free Tier)

## 🎯 Situação Atual do Projeto

### 1. **Estratégia Adotada: POLLING PURO** ✅
O projeto usa **polling com intervalo de 500ms** em vez de WebSocket Realtime:

```typescript
// useRealtime.ts - Linha 65
const pollInterval = setInterval(fetchPhase, 500) // Cada 500ms
```

**Motivos Claros (comentários no código):**
- Linha 20: "WebSocket removido para melhor performance no free tier"
- Linha 77: "Hook para fase com WebSocket Realtime" (mas comentário anterior mostra que foi removido)

### 2. **Dados sendo Polled (4 Hooks)**

#### A. `useRealtimeRanking()` - Ranking Ao Vivo
- **Intervalo:** 500ms
- **Fonte:** Tabela `live_ranking`
- **Objetivo:** Atualizar posição das equipes em tempo real
- **Impacto Free Tier:** 1 read-request a cada 500ms = ~120 requests/min
- **Otimizações:**
  - ✅ Verifica se página está visível (não faz polling quando aba é hidden)
  - ✅ Evita fetch simultâneo (`isFetching` flag)

#### B. `useRealtimePhase()` - Dados da Fase Atual
- **Intervalo:** 500ms
- **Fonte:** RPC `get_current_phase_data()` (otimizado - traz tudo em 1 query)
- **Objetivo:** Atualizar fase, quest ativa, timestamps
- **Impacto Free Tier:** 1 RPC call a cada 500ms = ~120 calls/min
- **Otimizações:**
  - ✅ Usa RPC em vez de múltiplos SELECTs
  - ✅ Verifica se página está visível
  - ✅ Evita fetch simultâneo (`isFetching` flag)

#### C. `useRealtimePenalties()` - Penalidades
- **Intervalo:** 500ms
- **Fonte:** Tabela `penalties`
- **Objetivo:** Detectar penalidades novas + tocar som
- **Impacto Free Tier:** 1 read-request a cada 500ms = ~120 requests/min
- **Otimizações:**
  - ✅ Detecção inteligente de IDs novos (não faz som duplicado)
  - ✅ Verifica página visível

#### D. `useRealtimeEvaluators()` - Status dos Avaliadores
- **Intervalo:** 500ms
- **Fonte:** Tabela `evaluators`
- **Objetivo:** Ver avaliadores online/offline + sons
- **Impacto Free Tier:** 1 read-request a cada 500ms = ~120 requests/min
- **Otimizações:**
  - ✅ Detecta mudanças de estado (online → offline)
  - ✅ Verifica página visível

---

## 📈 Impacto Total no Free Tier Supabase

### Cálculo de Requisições

```
Por Hook:
- Ranking:      1 request × 120/min = 120/min
- Phase (RPC):  1 call × 120/min = 120/min
- Penalties:    1 request × 120/min = 120/min
- Evaluators:   1 request × 120/min = 120/min

TOTAL POR MINUTO:
120 + 120 + 120 + 120 = 480 requisições/min

EM 1 HORA:
480 × 60 = 28,800 requisições/hora

EM 24 HORAS:
28,800 × 24 = 691,200 requisições/dia
```

### Limites Free Tier Supabase

| Métrica | Limite Free | Seu Uso | Status |
|---------|------------|---------|--------|
| **Reads/mês** | 50,000 | ~20M (estimado) | ❌ **EXCEDE MUITO** |
| **Writes/mês** | 50,000 | ~1K-10K | ✅ OK |
| **Realtime Messages** | 1M/mês | Não usa | ✅ OK |
| **Storage** | 1GB | ~100MB | ✅ OK |

---

## 🔄 Alternativas Exploradas: Hooks Otimizados

### `useRealtimeRankingOptimized.ts` - Usa SWR

```typescript
// Linha 42-65
const { data, error, isLoading, mutate } = useSWR('live_ranking', fetcher, {
  revalidateOnFocus: false,        // ❌ Desabilitar focus
  revalidateOnReconnect: false,    // ❌ Deixar só refresh
  revalidateIfStale: false,        // ❌ Não revalidar automático
  refreshInterval: 5000,            // ⏱️ 5 SEGUNDOS (vs 500ms!)
  dedupingInterval: 2000,           // 📦 Dedup 2s
  errorRetryCount: 3,              // 🔄 Retry 3x
})
```

**Impacto:**
- Reduz de 500ms → 5000ms = **10x menos requisições!**
- 480 requests/min → 48 requests/min
- Implementa **caching inteligente**
- Deduplicação automática
- Fallback data durante loading

### `useRealtimePenaltiesOptimized.ts` - Também SWR

```typescript
// Linha 46-58
refreshInterval: 5000,  // 5 SEGUNDOS (mais rápido que ranking)
```

**Impacto:**
- Mesma redução: 10x menos requisições
- Mantém detecção de novas penalidades
- Som continua funcionando

---

## ⚠️ Status Atual: Problema de Compatibilidade

### `useRealtime.ts` (Atual) vs `useRealtimeOptimized.ts` (Alternativa)

**Arquivo Atual Usa:**
```typescript
// setInterval a cada 500ms
const pollInterval = setInterval(fetchPhase, 500)
```

**Arquivo Alternativo Usa:**
```typescript
// SWR com refreshInterval de 5000ms
refreshInterval: 5000
```

**Componentes que usam cada um:**

```
useRealtime.ts (500ms):
├── live-dashboard/page.tsx → useRealtimeRanking() ❌ FREQUENTE
├── live-dashboard/page.tsx → useRealtimePhase() ❌ FREQUENTE
├── componentes diversos → useRealtimePenalties() ❌ FREQUENTE
├── componentes diversos → useRealtimeEvaluators() ❌ FREQUENTE
└── Impacto: ~480 requests/min ❌ EXCEDE FREE TIER

useRealtimeOptimized.ts (5000ms):
├── Não está sendo usado em lugar nenhum ⚠️
└── Impacto: ~48 requests/min ✅ DENTRO DO LIMITE
```

---

## 🎯 Análise de Impacto

### Cenário Atual (500ms polling)
- ✅ **Responsividade:** Excelente (atualiza a cada 500ms)
- ✅ **Experiência:** Muito fluida e instantânea
- ❌ **Custo Free Tier:** Vai exceder massivamente (20M requisições em ~1 dia)
- ❌ **Escalabilidade:** Não sustentável no Free Tier

### Cenário Otimizado (5000ms polling via SWR)
- ⏱️ **Responsividade:** Boa, mas perceptível (atualiza a cada 5s)
- ⏱️ **Experiência:** Ligeiramente menos fluida, mas aceitável
- ✅ **Custo Free Tier:** Mantém dentro dos limites
- ✅ **Escalabilidade:** Sustentável indefinidamente

---

## 💡 Recomendações (SEM MODIFICAR CÓDIGO)

### 1. **Para Evitar Exceder Limites Free Tier**
   - Considerar migrar para `useRealtimeOptimized` hooks
   - Ou implementar detecção de quotas e fallback automático
   - Ou fazer upgrade para Pro Plan ($25/mês) que tem limites maiores

### 2. **Se Manter 500ms Polling**
   - Implementar debounce/throttle no lado do cliente
   - Usar cache mais agressivo
   - Limitar número de abas abertas simultaneamente
   - Monitorar uso em tempo real

### 3. **Melhor Prática (Futuro)**
   ```typescript
   // Usar versão otimizada por padrão
   import { useRealtimeRankingOptimized } from '@/lib/hooks/useRealtimeRankingOptimized'

   // Permitir modo "high-performance" (500ms) apenas em planos pagos
   const isHighPerformance = plan === 'pro' || plan === 'enterprise'
   const useRealtime = isHighPerformance ? useRealtimePhase : useRealtimePhaseOptimized
   ```

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────┐
│ ANÁLISE SISTEMA DE POLLING/REALTIME        │
└─────────────────────────────────────────────┘

ATUAL (useRealtime.ts - 500ms):
┌─────────────────────────────────────────────┐
│ Ranking      │ 120 req/min × 24h = 172,800   │
│ Phase RPC    │ 120 call/min × 24h = 172,800   │
│ Penalties    │ 120 req/min × 24h = 172,800   │
│ Evaluators   │ 120 req/min × 24h = 172,800   │
├─────────────────────────────────────────────┤
│ TOTAL:       → ~691,200/dia ❌ EXCEDE LIMITE │
│ Free Tier:   → 50,000/mês   │ ~23M/mês   │
└─────────────────────────────────────────────┘

ALTERNATIVA (useRealtimeOptimized.ts - 5000ms):
┌─────────────────────────────────────────────┐
│ Ranking      │ 12 req/min × 24h = 17,280    │
│ Penalties    │ 12 req/min × 24h = 17,280    │
├─────────────────────────────────────────────┤
│ TOTAL:       → ~69,120/dia ✅ DENTRO LIMITE │
│ Free Tier:   → 50,000/mês   │ ~2M/mês    │
└─────────────────────────────────────────────┘

Diferença: 10x MENOS requisições com SWR!
```

---

## 🔍 Conclusão

**O projeto atual usa polling em 500ms**, que é **excelente para UX mas insustentável no Free Tier**.

Os hooks otimizados com SWR já existem no projeto (`useRealtimeOptimized.ts`) mas **não estão sendo usados**. Seriam a solução perfeita para manter a aplicação rodando no Free Tier sem exceder limites.

**Recomendação:** Quando pronto para produção, avaliar upgrade para Pro ou migração gradual para hooks otimizados.
