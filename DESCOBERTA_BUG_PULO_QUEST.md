# 🐛 BUG DESCOBERTO - POR QUE PULOU QUEST 2.1

## ❌ O PROBLEMA

A função `auto_start_next_quest()` tem uma **FALHA GRAVE** na lógica de transição entre fases.

### 📍 CÓDIGO PROBLEMÁTICO (Linha ~32-38):

```sql
-- ===================== PASSO 3: ENCONTRAR QUEST ATUAL ===================
SELECT MAX(q.order_index) INTO v_current_quest_order
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = v_current_phase
    AND q.started_at IS NOT NULL;  -- 🔥 BUG AQUI!

IF v_current_quest_order IS NULL THEN
  RAISE NOTICE '[auto_start] 📭 Nenhuma quest iniciada na fase %', v_current_phase;
  RETURN;  -- 🚨 SAI SEM ATIVAR NADA!
END IF;
```

## 🔥 O QUE ACONTECEU NA TRANSIÇÃO FASE 1 → FASE 2

### Cenário Real:
1. **01:08** - BOSS 1.4 expirou
2. **auto_advance_phase()** rodou e mudou `current_phase` de 1 para 2
3. **auto_start_next_quest()** rodou logo depois
4. **Procurou:** "Qual quest da FASE 2 tem started_at preenchido?"
5. **Resposta:** NENHUMA! (Fase 2 acabou de começar)
6. **v_current_quest_order = NULL**
7. **Sistema RETORNOU sem ativar nada** (linha 38)
8. **Quest 2.1 nunca foi ativada automaticamente!**

### O que DEVERIA ter acontecido:
- Quando `v_current_quest_order = NULL` em uma fase nova
- Sistema deveria **ATIVAR A PRIMEIRA QUEST** (order_index = 1)
- Em vez disso, simplesmente **DESISTIU**

## ❓ MAS ENTÃO QUEM ATIVOU A QUEST 2.2?

**Opções:**
1. Você ativou manualmente a Quest 2.2 sem perceber?
2. Algum outro script/comando foi executado?
3. A função `auto_advance_phase()` tem lógica para ativar primeira quest da próxima fase?

Precisamos verificar o código de `auto_advance_phase()` para ver se ela ativa a Quest X.1 quando avança de fase.

## ✅ SOLUÇÃO

A função `auto_start_next_quest()` precisa de um **FALLBACK**:

```sql
IF v_current_quest_order IS NULL THEN
  -- Em vez de RETURN, ativar a PRIMEIRA quest da fase
  RAISE NOTICE '[auto_start] 🆕 Primeira quest da fase % - ativando Quest %.1', v_current_phase, v_current_phase;
  
  SELECT q.id INTO v_quest_to_start_id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.order_index = 1;
  
  UPDATE quests
  SET started_at = NOW(), status = 'active'
  WHERE id = v_quest_to_start_id;
  
  RETURN;
END IF;
```

## 🔍 PRÓXIMO PASSO

Verificar código de `auto_advance_phase()` para entender quem ativou a Quest 2.2.
