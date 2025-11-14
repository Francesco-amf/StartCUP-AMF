# Hotfix - Update Evaluation Form Refresh

**Issue**: Quando você edita uma avaliação existente (UPDATE), o formulário volta com os valores antigos em vez dos novos salvos.

**Exemplo**: Você mudou de 38 para 40, som tocou, mas o formulário voltou para 38.

---

## Root Cause

A página `/evaluate/[submissionId]` é um **server-component com `force-dynamic`**.

### O Problema
1. ✅ Página carrega, busca `existingEvaluation` (38)
2. ✅ Passa para form como `defaultValues={{base_points: 38}}`
3. ✅ Usuário edita para 40 e submete
4. ✅ API salva 40 no banco
5. ✅ Form resets mas...
6. ❌ A página nunca roda novamente (é client-side)
7. ❌ Então `defaultValues` continua 38

### Por quê?
- `force-dynamic` só funciona para **requisições HTTP** para a página
- Uma vez que você está no cliente (React), o server-component não roda novamente
- A página precisa de um **page reload completo** para buscar dados novos do servidor

---

## Solution

Para **UPDATE** (edição de avaliação), fazer reload da página após o som tocar:

**File**: `src/components/EvaluationForm.tsx` (Lines 88-99)

### Antes
```typescript
setIsLoading(false)  // Apenas isso
```

### Depois
```typescript
if (isUpdate) {
  // Para UPDATE: Esperar som (2.5s) e recarregar página
  // Isso faz o servidor rodar novamente e buscar dados novos
  setTimeout(() => {
    console.log('🔄 Recarregando página...')
    window.location.reload()
  }, 2500)
} else {
  // Para novas avaliações: apenas reset (sem reload)
  setIsLoading(false)
}
```

### Por que 2.5 segundos?
- Som quest-complete leva ~2s
- 2.5s garante que o som terminou
- Depois disso, reload é seguro e não interrompe som

### Por que diferente para UPDATE vs novo?
- **Novo (`isUpdate=false`)**: Apenas reseta form, polling atualiza ranking
- **UPDATE (`isUpdate=true`)**: Precisa recarregar porque `defaultValues` vem do servidor

---

## Workflow Agora

### Para Novo Envio
```
POST /api/evaluate
  ↓
Form resets ✅
  ↓
Sound plays ✅
  ↓
setIsLoading(false)
  ↓
Polling atualiza ranking
  ↓
Usuário permanece na página ✅
```

### Para Atualização (UPDATE)
```
POST /api/evaluate
  ↓
Form resets ✅
  ↓
Sound plays ✅
  ↓
[Aguarda 2.5s para som terminar]
  ↓
window.location.reload()
  ↓
Server roda novamente
  ↓
Busca dados novos do banco (40)
  ↓
Formulário carrega com valores novos ✅
  ↓
Usuário vê dados corretos ✅
```

---

## Trade-off

### Antes
- ❌ UPDATE: Valores velhos aparecem
- ✅ Novo: Sem reload
- ✅ Novo: Som não interrompe

### Depois
- ✅ UPDATE: Valores novos aparecem (reload)
- ✅ Novo: Sem reload (como antes)
- ✅ Novo: Som não interrompe (como antes)
- ⚠️ UPDATE: Reload após som (2.5s delay, som já terminou)

O reload para UPDATE é **aceitável** porque:
1. Só acontece para atualizações (uso menos comum)
2. Som já terminou (não interrompe)
3. Garante dados corretos (melhor UX)
4. Usuário vê confirmação visual (página carrega com dados salvos)

---

## Test Scenario

1. **Nova Avaliação**:
   - Ir para `/evaluate`
   - Click "⭐ Avaliar"
   - Submit form
   - ✅ Sem reload (como antes)
   - ✅ Som toca normal

2. **Atualizar Avaliação**:
   - Em "Minhas Avaliações" → click "✏️ Editar"
   - Mudar valor (38 → 40)
   - Click "Atualizar Avaliação"
   - ✅ Som toca normal
   - ✅ Página recarrega (2.5s)
   - ✅ Formulário mostra novo valor (40)
   - ✅ Sem erro de "null reference"

---

## Changes

| File | Lines | Change |
|------|-------|--------|
| `src/components/EvaluationForm.tsx` | 88-99 | Condicional: reload se isUpdate, else reset |

---

## Build Status

✅ Build successful - No errors

---

## Why Not Just Keep Old Values?

Alternativas consideradas:

### ❌ Opção A: Não fazer nada
```
Usuário fica confuso vendo valor antigo
Precisa F5 manualmente para ver novo valor
Bad UX
```

### ❌ Opção B: Atualizar defaultValues via polling
```
Polling pega novos dados cada 500ms
Mas defaultValues é props renderizados no servidor
Difícil de sincronizar no cliente
Complex + unreliable
```

### ❌ Opção C: Converter para client-component
```
Perder benefícios de server-component
Auth no cliente (security risk)
Mais código complexo
```

### ✅ Opção D: Reload após som (ESCOLHIDA)
```
Simples e direto
Garante dados frescos do servidor
Sound já terminou (não interrompe)
Bom UX
```

---

## Implementation Notes

- Timing de 2500ms é baseado em duração do som `quest-complete`
- Se som for alterado, ajustar timing
- Log adicionado para debug: "🔄 Recarregando página..."
- Apenas faz reload se `isUpdate={true}`
- Para novas avaliações, comportamento idêntico (sem reload)

---

## Deployment

✅ Safe to deploy
- Minimal change
- Only affects UPDATE path
- Backward compatible
- No database changes

---

## Next Test

Try updating an evaluation again:
1. Go to `/evaluate`
2. Find "Minhas Avaliações"
3. Click "✏️ Editar"
4. Change value (38 → 40)
5. Submit
6. Watch form update with new values ✅

