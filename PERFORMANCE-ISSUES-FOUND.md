# Performance Issues Found - Refresh Problems

## 🚨 CRÍTICO

### Problema 1: TeamPageRealtime.tsx (MAIN CULPRIT)
**Arquivo:** `src/components/TeamPageRealtime.tsx`

**O que faz:**
- Polling a cada 2000ms
- **NÃO tem visibility check** (continua quando página oculta)
- Chama `router.refresh()` em QUALQUER mudança (inclusive timestamps!)
- Isso cascateia para toda a página

**Por que causa refresh:**
- Quando você navega entre páginas (evaluator ↔ team)
- Cada mudança de hash/timestamp causa refresh inteiro
- Múltiplos componentes reagindo

**Fix Necessário:**
1. Adicionar visibility detection
2. Aumentar intervalo para 5000ms
3. Filtrar mudanças reais (não timestamp!)

---

### Problema 2: useRealtimePhase e useRealtimeEvaluators
**Sem visibility check!**

Se você abrir /evaluate e depois sair sem fechar a aba, continua puxando dados mesmo que a página esteja oculta.

---

### Problema 3: Sincronização de Polling
4 hooks disparando em sequência rápida (0ms, 125ms, 250ms, 375ms) causa "micro spikes" de latência

---

## 📊 Números:

**Live Dashboard:** 544 queries/min (EXCEEDS free tier!)
**Team Pages:** 30 queries/min cada (com TeamPageRealtime)
**Total:** ~600 queries/min = **10 req/sec**

---

## ✅ Fixes a Fazer:

### Fix 1 (Urgente): Adicionar Visibility Check
- `useRealtimePhase()` → adicionar `isPageVisibleRef`
- `useRealtimeEvaluators()` → adicionar `isPageVisibleRef`
- `TeamPageRealtime.tsx` → adicionar visibility check

**Impacto:** -60% queries quando página oculta

### Fix 2 (Importante): TeamPageRealtime Melhorias
- Aumentar 2000ms → 5000ms
- Filtrar mudanças reais (não timestamp)
- Parar de chamar `router.refresh()` em tudo

**Impacto:** -50% em /dashboard e /submit

### Fix 3 (Melhorias): Aumentar alguns intervalos
- 500ms → 1000ms em hooks não críticos
- Usar adaptive polling (1000ms active, 5000ms hidden)

**Impacto:** -40% queries totais

---

## 🎯 Resultado Final:

| Cenário | Antes | Depois |
|---------|-------|--------|
| Live dashboard | 544 req/min | 150 req/min |
| Team pages | 30 req/min | 10 req/min |
| Total | ~600 req/min | ~160 req/min |
| **Redução** | - | **73%** |

---

## Próximos Passos:

1. Fix TeamPageRealtime.tsx (PRIORITY #1)
2. Adicionar visibility check aos outros hooks
3. Testar navegação entre páginas (avaliador ↔ equipe)
4. Verificar se refresh/flicker desaparece
