# Diagnóstico: Por que a Penalidade Não Foi Deduzida

## O Que Você Testou

✅ Avaliou uma entrega atrasada (com -5 pontos de penalty)
✅ Deu 100 pontos na avaliação
❌ Esperado: final_points = 95 (100 - 5)
❌ Recebido: final_points = 100 (sem penalty)

## Por Que Aconteceu

### Camada 1: Code (evaluate/route.ts) ✅
O código foi corrigido para:
```typescript
if (submission.is_late && submission.late_penalty_applied) {
  finalPoints = avgPoints - submission.late_penalty_applied
}
```

**Status**: ✅ FUNCIONANDO (confirmado no código compilado)

### Camada 2: Dados no Banco ❌
O problema é que quando você avaliou, os campos da submissão eram:
- `is_late = FALSE` ❌ (deveria ser TRUE)
- `late_penalty_applied = 0` ❌ (deveria ser 5)

**Isso significa**: O trigger do banco que deveria marcar como atrasada NÃO funcionou ou não foi acionado.

### Camada 3: Trigger (Root Cause) ⚠️
O trigger `update_late_submission_fields_trigger` deveria ter:

1. Calculado o deadline: `quest.started_at + quest.planned_deadline_minutes`
2. Comparado com: `submission.submitted_at`
3. Se submitted > deadline: marcado `is_late = TRUE` e calculado penalty

**Problema Encontrado**: A quest provavelmente tem:
- `started_at = NULL` ❌
- `planned_deadline_minutes = NULL` ou `0` ❌

**Sem esses dados**, o trigger não consegue calcular o deadline, então não marca como atrasada.

## Fluxo Completo (Como Deveria Funcionar)

```
1. Submissão criada
   ↓
2. Trigger BEFORE INSERT verifica:
   ├─ quest.started_at (ex: 10:00)
   ├─ quest.planned_deadline_minutes (ex: 30)
   └─ deadline = 10:00 + 30min = 10:30

3. Compara submitted_at com deadline
   ├─ Se submitted_at (10:33) > deadline (10:30) → is_late = TRUE
   ├─ late_minutes = 3
   └─ late_penalty_applied = 5 (porque ≤5 minutos)

4. Submissão salva com:
   - is_late = TRUE ✅
   - late_penalty_applied = 5 ✅

5. Evaluator avalia e dá 100 pontos

6. Evaluate endpoint verifica:
   if (submission.is_late && submission.late_penalty_applied)
   ├─ finalPoints = 100 - 5 = 95 ✅
   └─ Salva final_points = 95
```

## O Que Vamos Fazer

### Script 1: DIAGNOSTICO-RAPIDO.sql
Vai verificar:
- Se o trigger existe
- Se a função do trigger existe
- Qual submissão foi testada
- Por que não foi marcada como atrasada

### Script 2: CORRIGIR-RAIZ-QUESTS.sql
Vai:
1. Configurar todas as quests com `started_at` e `planned_deadline_minutes`
2. Marcar submissões existentes como atrasadas
3. Recalcular final_points das avaliadas

### Script 3: FIX-IMEDIATO-PENALTY.sql
Vai:
1. Encontrar a submissão que você testou (final_points = 100)
2. Marcar como atrasada (is_late = TRUE, late_penalty_applied = 5)
3. Recalcular final_points = 95

## Como Executar

### Passo 1: Verificar (recomendado primeiro)
```bash
# Execute no Supabase SQL Editor:
DIAGNOSTICO-RAPIDO.sql
```

### Passo 2: Corrigir na Raiz (IMPORTANTE)
```bash
# Execute:
CORRIGIR-RAIZ-QUESTS.sql
```

Isso vai garantir que **futuras submissões atrasadas** sejam marcadas corretamente.

### Passo 3: Corrigir Teste Anterior
```bash
# Execute:
FIX-IMEDIATO-PENALTY.sql
```

Isso vai corrigir a submissão que você testou de 100 para 95 pontos.

## Checklist de Verificação

Depois de executar os scripts, você deve ver:

- [ ] Quests têm `started_at` configurado
- [ ] Quests têm `planned_deadline_minutes` > 0
- [ ] Submissões atrasadas têm `is_late = TRUE`
- [ ] Submissões atrasadas têm `late_penalty_applied = 5, 10, ou 15`
- [ ] Submissões avaliadas têm `final_points` reduzido pela penalty
- [ ] Live ranking mostra score correto

## Próximos Passos

1. Execute `DIAGNOSTICO-RAPIDO.sql`
2. Compartilhe os resultados comigo
3. Execute `CORRIGIR-RAIZ-QUESTS.sql`
4. Execute `FIX-IMEDIATO-PENALTY.sql`
5. Teste novamente com uma nova submissão atrasada
6. Verifique se aparece 95 em vez de 100

## Resumo Técnico

| Componente | Status | Ação |
|-----------|--------|------|
| **Code Fix** | ✅ Feito | evaluate/route.ts modificado |
| **Trigger** | ⚠️ Incompleto | Quests não têm started_at/deadline |
| **Database Config** | ❌ Faltando | Executar CORRIGIR-RAIZ-QUESTS.sql |
| **Teste Anterior** | ❌ Errado | Executar FIX-IMEDIATO-PENALTY.sql |
| **Novas Submissões** | ⏳ Aguardando | Testar após corrigir quests |
