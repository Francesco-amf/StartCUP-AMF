# 🐛 INVESTIGAÇÃO DO BUG - POR QUE auto_start_next_quest() PULOU QUESTS

## 🔍 FATOS COLETADOS

### Tentativa 1 (Quest 2.2 ativada às 03:28:52):
- BOSS 1.4 terminou → `auto_advance_phase()` rodou
- `auto_advance_phase()` deveria ativar Quest 2.1 (linhas 121-132)
- MAS ativou Quest 2.2 em vez de Quest 2.1
- Query na função: `WHERE p.order_index = v_next_phase AND q.order_index = 1`
- Dados no banco: Quest 2.1 tem `order_index = 1` ✅ (correto)

### Tentativa 2 (Quest 2.3 ativada hoje):
- Sistema pulou Quest 2.1 E Quest 2.2
- Foi direto para Quest 2.3

## 🎯 HIPÓTESES

### Hipótese 1: Bug na query de `auto_advance_phase()`
**Código da função (linhas 121-132):**
```sql
UPDATE quests
SET started_at = NOW(),
    status = 'active'
WHERE id = (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_next_phase
    AND q.order_index = 1  -- 🎯 Deveria pegar Quest X.1
  LIMIT 1
);
```

**Problema possível:** 
- Se houver múltiplas quests com `order_index = 1` em fases diferentes
- Ou se `LIMIT 1` sem `ORDER BY` pegar quest aleatória
- Ou se `phase_id` não está correto

### Hipótese 2: Ordem de execução dos crons
**Sequência possível:**
1. `auto_advance_phase()` roda e TENTA ativar Quest 2.1
2. MAS antes de commitar, `auto_start_next_quest()` roda em paralelo
3. `auto_start_next_quest()` vê que nenhuma quest está ativa ainda
4. Pega a "próxima" errada por causa de race condition

### Hipótese 3: Bug no cálculo de "próxima quest"
**Código de `auto_start_next_quest()` (linhas 26-35):**
```sql
SELECT MAX(q.order_index) INTO v_current_quest_order
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = v_current_phase
    AND q.started_at IS NOT NULL;
```

**Se executa logo após mudança de fase:**
- Fase mudou para 2
- MAS nenhuma quest da Fase 2 tem `started_at` ainda
- Retorna NULL
- Função retorna sem fazer nada (linhas 33-35)

**PORÉM** se `auto_advance_phase()` ativou Quest X.1 errada (ex: Quest 2.2):
- Próxima vez que `auto_start_next_quest()` rodar
- Vai encontrar Quest 2.2 com `started_at`
- Vai calcular próxima = 2 + 1 = 3
- Ativa Quest 2.3! ❌

## 🎯 TESTE PARA CONFIRMAR

Precisamos ver:
1. Se há múltiplas quests com mesmo `order_index` em fases diferentes
2. Se a query de `auto_advance_phase()` pode pegar quest de fase errada
3. Se há lock ou race condition entre os 2 crons

## 🔧 CORREÇÃO IMEDIATA

A query de `auto_advance_phase()` precisa de `ORDER BY` e melhor filtro:

```sql
-- QUERY ATUAL (BUGADA):
WHERE id = (
  SELECT q.id FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_next_phase
    AND q.order_index = 1
  LIMIT 1  -- ❌ SEM ORDER BY!
);

-- QUERY CORRIGIDA:
WHERE id = (
  SELECT q.id FROM quests q
  WHERE q.phase_id = (SELECT id FROM phases WHERE order_index = v_next_phase)
    AND q.order_index = 1
  ORDER BY q.id  -- ✅ Garantir ordem determinística
  LIMIT 1
);
```

Vou criar o script de teste agora.
