# Bug Fix: Penalidade Automática de Atraso Não Era Aplicada

## Problema Identificado

A submissão atrasada da equipe "Áurea Forma" foi detectada como atrasada (`is_late = TRUE`), mas **nenhuma penalidade automática foi inserida** (`late_penalty_applied = NULL`).

### Dados da Falha
```
Submissão ID: 9667cec3-685e-49f2-a4dc-2fb951f42cd8
is_late: TRUE ✅ (sistema detectou atraso)
late_minutes: 0 (arredondado)
late_penalty_applied: NULL ❌ (deveria ser 5)
Sem registro em penalties com penalty_type='atraso'
```

---

## Causa do Bug

Na API `src/app/api/submissions/create/route.ts`, o código estava acessando incorretamente o retorno da RPC:

### Código Bugado (antes)
```javascript
const { data: validationResult, error: validationError } = await supabase
  .rpc('validate_submission_allowed', {
    team_id_param: teamId,
    quest_id_param: questId
  })

// Tentava acessar diretamente:
if (validationResult?.penalty_calculated && validationResult.penalty_calculated > 0) {
  // inserir penalidade
}
```

### O Problema

A RPC `validate_submission_allowed()` é definida com múltiplos `OUT` parameters:

```sql
CREATE OR REPLACE FUNCTION validate_submission_allowed(
  team_id_param UUID,
  quest_id_param UUID,
  OUT is_allowed BOOLEAN,
  OUT reason TEXT,
  OUT late_minutes_calculated INTEGER,
  OUT penalty_calculated INTEGER,
  OUT debug_now TIMESTAMP,
  OUT debug_deadline TIMESTAMP,
  OUT debug_late_window_end TIMESTAMP,
  OUT debug_v_minutes_late INTEGER,
  OUT debug_v_penalty INTEGER
)
```

Quando há múltiplos `OUT` parameters, o Supabase retorna um **array** de objetos, não um objeto simples:

```javascript
// Retorno bugado:
[{
  is_allowed: true,
  reason: "...",
  late_minutes_calculated: 3,
  penalty_calculated: 5,
  // ... debug fields
}]

// Código tentava acessar:
validationResult?.penalty_calculated  // undefined (porque é um array, não um objeto!)
```

---

## Solução Aplicada

### Código Corrigido (depois)
```javascript
const { data: validationResults, error: validationError } = await supabase
  .rpc('validate_submission_allowed', {
    team_id_param: teamId,
    quest_id_param: questId
  })

// RPC retorna array de objetos, pegar primeiro elemento
const validationResult = Array.isArray(validationResults) ? validationResults[0] : validationResults;

console.log('Validation Result (parsed):', validationResult);
console.log('penalty_calculated:', validationResult?.penalty_calculated);

if (validationResult?.penalty_calculated && validationResult.penalty_calculated > 0) {
  // Agora penalty_calculated está acessível!
  const { error: penaltyError } = await supabase
    .from('penalties')
    .insert({
      team_id: teamId,
      penalty_type: 'atraso',
      points_deduction: validationResult.penalty_calculated,  // ✅ Agora funciona!
      reason: `Submissão atrasada por ${validationResult.late_minutes_calculated} minutos...`,
      assigned_by_admin: true
    })
}
```

### Mudanças Específicas

1. **Renomeado** `validationResult` para `validationResults` na linha 47
2. **Adicionado parsing** na linha 64-65:
   ```javascript
   const validationResult = Array.isArray(validationResults) ? validationResults[0] : validationResults;
   ```
3. **Adicionados logs** nas linhas 53, 66-68 e 274-301 para debug

---

## Logs Adicionados para Debug

### PASSO 1: Validação
```javascript
console.log('Validation Results:', validationResults);
console.log('Validation Result (parsed):', validationResult);
console.log('penalty_calculated:', validationResult?.penalty_calculated);
console.log('is_allowed:', validationResult?.is_allowed);
```

### PASSO 8: Inserção de Penalidade
```javascript
console.log('Checking penalty application:');
console.log('  validationResult?.penalty_calculated:', validationResult?.penalty_calculated);
console.log('  is > 0:', validationResult?.penalty_calculated > 0);
console.log('  will apply:', validationResult?.penalty_calculated && validationResult.penalty_calculated > 0);

if (validationResult?.penalty_calculated && validationResult.penalty_calculated > 0) {
  console.log('Applying penalty of:', validationResult.penalty_calculated);
  // ... inserir penalidade
  if (penaltyError) {
    console.error('Erro ao inserir penalidade:', penaltyError);
  } else {
    console.log('Penalidade inserida com sucesso');
  }
} else {
  console.log('Nenhuma penalidade aplicada...');
}
```

---

## Como Testar a Correção

### Teste Manual

1. **Criar uma quest com deadline curto**
   ```
   planned_deadline_minutes = 2 minutos
   late_submission_window_minutes = 1 minuto
   ```

2. **Submeter após o deadline**
   - Esperar 3 minutos após a quest iniciar
   - Submeter uma resposta (será marcada como atrasada)

3. **Verificar o banco de dados**
   ```sql
   -- Verificar submissão
   SELECT is_late, late_minutes, late_penalty_applied
   FROM submissions
   WHERE team_id = '[team_id]'
   ORDER BY submitted_at DESC
   LIMIT 1;

   -- Verificar penalidade
   SELECT penalty_type, points_deduction, reason
   FROM penalties
   WHERE team_id = '[team_id]'
   AND penalty_type = 'atraso'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

4. **Resultados Esperados**
   ```
   Submissão:
   - is_late: TRUE ✅
   - late_minutes: 1 ou mais ✅
   - late_penalty_applied: 5 (ou 10/15 conforme delay) ✅

   Penalidades:
   - penalty_type: 'atraso' ✅
   - points_deduction: 5 (ou 10/15) ✅
   ```

### Verificar Logs

Procurar nos logs do servidor:
```
Validation Result (parsed): {
  is_allowed: true,
  penalty_calculated: 5,
  late_minutes_calculated: 1,
  ...
}

Checking penalty application:
  validationResult?.penalty_calculated: 5
  is > 0: true
  will apply: true

Applying penalty of: 5
Penalidade inserida com sucesso
```

---

## Arquivos Modificados

- `src/app/api/submissions/create/route.ts` - Linhas 47-301

---

## Resumo

| Item | Antes | Depois |
|------|-------|--------|
| RPC retorna | Array (ignorado) | Array → primeiro elemento extraído |
| penalty_calculated | undefined | 5/10/15 (correto) |
| Penalidade inserida | NÃO ❌ | SIM ✅ |
| Late penalty applied | NULL | 5/10/15 |

---

## Status

✅ **CORRIGIDO** - A penalidade automática por atraso agora será aplicada corretamente

