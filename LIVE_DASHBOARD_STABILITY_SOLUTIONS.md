# 🔧 Soluções para Estabilizar a Live Dashboard

**Problema**: Timer da quest aparece e desaparece constantemente
**Causa Raiz**: Polling agressivo (3x/segundo) + fallback aleatório + race conditions

---

## 🎯 Solução 1: Reduzir Polling para 2 segundos (Mais Importante)

### Problema Atual
```typescript
// ❌ ERRADO: 500ms = 2 requisições/segundo
const pollInterval = setInterval(fetchQuests, 500)
```

### Solução
```typescript
// ✅ CORRETO: 2000ms = 1 requisição a cada 2 segundos
// (useRealtimePhase já está fazendo polling de 500ms, então não precisa de 500ms aqui)
const pollInterval = setInterval(fetchQuests, 2000)
```

**Por que funciona**:
- Não entra em race condition com `useRealtimePhase`
- Dados chegam de forma consistente
- UI não pisca a cada polling conflitante

---

## 🎯 Solução 2: Remover Fallback Automático

### Problema Atual
```typescript
// ❌ ERRADO: Se há erro, mostra fallback (sem started_at)
if (phaseError || !phaseData) {
  setQuests(PHASES_QUESTS_FALLBACK[phase] || [])  // Timer desaparece
  return
}
```

### Solução
```typescript
// ✅ CORRETO: Se há erro, MANTÉM dados anteriores (não muda de repente)
if (phaseError || !phaseData) {
  console.warn('⚠️ Erro ao buscar quests, mantendo dados anteriores')
  setLoadingQuests(false)
  return  // ← Não muda quests, mantém o que estava
}
```

**Por que funciona**:
- Dados não desaparecem de repente
- Timer continua contando mesmo se houver erro temporário
- Apenas atualiza quando há dados válidos

---

## 🎯 Solução 3: Cachear Dados e Evitar Updates Desnecessárias

### Problema Atual
```typescript
// ❌ Toda vez que fetch termina, atualiza state mesmo se dados são iguais
setQuests(sortedData)  // Causa re-render mesmo se dados não mudaram
```

### Solução
```typescript
// ✅ Comparar dados antes de atualizar
const questsHash = JSON.stringify(sortedData)
if (questsHashRef.current !== questsHash) {
  questsHashRef.current = questsHash
  setQuests(sortedData)
  console.log('✅ Quests atualizadas (dados diferentes)')
} else {
  console.log('⏭️ Quests não mudaram, ignorando update')
}
```

**Por que funciona**:
- Evita re-renders desnecessários
- Reduz flickering mesmo com polling frequente

---

## 🎯 Solução 4: Isolar Dependências do useEffect

### Problema Atual
```typescript
// ❌ Toda vez que isPageVisible muda, recria toda a lógica
}, [phase, supabase, isPageVisible])
```

### Solução
```typescript
// ✅ Separar em dois useEffects
// 1. Polling adaptativo (dependente de isPageVisible)
useEffect(() => {
  const interval = setInterval(
    fetchQuests,
    isPageVisible ? 2000 : 5000  // 2s ativo, 5s inativo
  )
  return () => clearInterval(interval)
}, [isPageVisible])  // Só refaz quando visibility muda

// 2. Initial fetch (quando phase muda)
useEffect(() => {
  fetchQuests()
}, [phase])  // Só refaz quando fase muda
```

**Por que funciona**:
- Polling continua mesmo quando visibility muda
- Não dispara fetch múltiplas vezes

---

## 🎯 Solução 5: Garantir started_at Consistente

### Problema Atual
```typescript
// ❌ started_at vem em formatos diferentes do DB
const started_at = "2025-11-14T10:30:00+00:00"  // ou "2025-11-14T10:30:00Z" ou sem nada
```

### Solução
```typescript
// ✅ Normalizar timestamp no query
const { data } = await supabase
  .from('quests')
  .select(`
    id,
    ...
    started_at::text as started_at_normalized  -- Força formato text do DB
  `)

// Depois, sempre normalizar o mesmo jeito
const normalizeTimestamp = (ts: string): string => {
  if (!ts) return ''
  return ts.replace('+00:00', 'Z').endsWith('Z') ? ts : `${ts}Z`
}
```

**Por que funciona**:
- Timestamps sempre em formato consistente
- Cálculo de tempo sempre correto

---

## 🎯 Solução 6: Usar Supabase Realtime em vez de Polling

### Problema Atual
```typescript
// ❌ Polling = múltiplas requisições idênticas por segundo
setInterval(fetchQuests, 500)
```

### Solução (Longo Prazo)
```typescript
// ✅ Usar subscriptions em tempo real
const questsSubscription = supabase
  .channel(`phase:${phase}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'quests',
      filter: `phase_id=eq.${phaseId}`
    },
    (payload) => {
      console.log('📡 Quest atualizada em tempo real')
      setQuests(prev => [...prev, payload.new])
    }
  )
  .subscribe()
```

**Por que funciona**:
- Sem polling agressivo
- Apenas recebe dados quando há mudança real
- Reduz carga de 2 req/s para ~0 req/s

---

## 📋 Implementação Rápida (Escolha UMA)

### **Opção A: Rápida & Eficiente** ⭐ RECOMENDADO
1. Mude polling de 500ms para **2000ms** (Solução 1)
2. Remova fallback automático (Solução 2)

**Esforço**: 10 minutos | **Impacto**: 80% de melhoria

---

### **Opção B: Completa & Robusta**
Implemente Soluções 1-5 (todas acima)

**Esforço**: 1 hora | **Impacto**: 99% de estabilidade

---

### **Opção C: Perfeita** (Futuro)
Migre para Supabase Realtime (Solução 6)

**Esforço**: 2-3 horas | **Impacto**: Tempo real puro

---

## 🔧 Código Completo para Solução Rápida (Opção A)

### Mudança 1: Reduzir Polling

**Arquivo**: `src/components/dashboard/CurrentQuestTimer.tsx`

**Procure por** (linha ~436):
```typescript
const pollInterval = setInterval(
  fetchQuests,
  isPageVisible ? 500 : 5000  // ← Mude aqui
)
```

**Mude para**:
```typescript
const pollInterval = setInterval(
  fetchQuests,
  isPageVisible ? 2000 : 5000  // 2 segundos quando ativo
)
```

---

### Mudança 2: Remover Fallback Automático

**Procure por** (linha ~355):
```typescript
if (phaseError || !phaseData) {
  console.error('❌ [FetchQuests] Erro ao buscar fase:', {
    phase,
    error: phaseError?.message,
    code: phaseError?.code
  })
  setQuests(PHASES_QUESTS_FALLBACK[phase] || [])  // ← Remova essa linha
  setLoadingQuests(false)
  isFetching = false
  return
}
```

**Mude para**:
```typescript
if (phaseError || !phaseData) {
  console.warn('⚠️ [FetchQuests] Erro ao buscar fase, mantendo dados anteriores')
  setLoadingQuests(false)
  isFetching = false
  return  // Mantém quests anteriores
}
```

---

### Mudança 3: Remover Fallback no else

**Procure por** (linha ~406):
```typescript
if (data && data.length > 0) {
  const sortedData = [...data].sort((a: any, b: any) => a.order_index - b.order_index)
  console.log(`✅ Quests carregadas...`)
  setQuests(sortedData)
} else {
  // Usar fallback APENAS se não houver quests no banco ou erro na query
  console.log(`⚠️ Nenhuma quest encontrada...`)
  const fallbackQuests = PHASES_QUESTS_FALLBACK[phase] || []
  setQuests(fallbackQuests)  // ← Remova essa linha
}
```

**Mude para**:
```typescript
if (data && data.length > 0) {
  const sortedData = [...data].sort((a: any, b: any) => a.order_index - b.order_index)
  console.log(`✅ Quests carregadas...`)
  setQuests(sortedData)
} else {
  console.warn(`⚠️ Nenhuma quest encontrada para Fase ${phase}`)
  // Mantém quests anteriores em vez de usar fallback
}
```

---

## 📊 Resultado Esperado

### Antes (Instável)
```
[Timer aparece] → [Pisca] → [Desaparece] → [Reapparece]
↓
Causa: 3 polls/segundo + fallback + race condition
```

### Depois (Estável)
```
[Timer aparece] → [Conta corretamente] → [Continua contando]
↓
Causa: 1 poll a cada 2 segundos + dados mantidos
```

---

## ✅ Checklist de Verificação

- [ ] Mudei polling de 500ms para 2000ms
- [ ] Removi fallback automático quando há erro
- [ ] Removi fallback quando data está vazio
- [ ] Compilei: `npm run build`
- [ ] Testei na live dashboard
- [ ] Timer não pisca mais
- [ ] Timer conta corretamente

---

## 📞 Se Ainda Assim Houver Problemas

1. **Timer ainda pisca ocasionalmente?**
   - Implemente cache de dados (Solução 3)

2. **Timer desaparece quando aba fica inativa?**
   - Revise a lógica de `isPageVisible` (pode estar interferindo)
   - Considere remover dependência de `isPageVisible` do polling

3. **Timer mostra tempo errado?**
   - Implemente normalização de timestamp (Solução 5)

4. **Ainda instável?**
   - Migre para Supabase Realtime (Solução 6)

---

**Tempo para implementar**: 10-15 minutos
**Impacto esperado**: 80% melhoria de estabilidade

Comece pela **Solução 1 + 2** (mais rápidas)!
