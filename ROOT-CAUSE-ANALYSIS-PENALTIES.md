# 🔴 ANÁLISE DE RAIZ: Por que Penalidades Não São Criadas

**Status:** DIAGNÓSTICO COMPLETO
**Data:** 14/11/2025

---

## O PROBLEMA

A equipe "Áurea Forma" submeteu 2 quests atrasadas:
- Cada submissão atrasada deveria gerar uma penalidade de -5 pontos
- **Esperado:** -10 pontos total (189 - 10 = 179)
- **Resultado:** Score aumentou para 199 (não diminuiu)
- **Causa:** As penalidades NUNCA foram criadas na tabela `penalties`

Diagnóstico anterior mostrou:
```
late_penalty_applied: 0  ← Deveria ser 5 ou 10
penalties_in_db: 0       ← Deveria ter registros na penalties table
```

---

## A CAUSA RAIZ: Quests Sem Deadline Configurado

### Problema Identificado

O sistema de penalidades depende de 3 campos nas quests:

```sql
quests table:
├─ started_at              ← Quando a quest foi aberta
├─ planned_deadline_minutes ← Quantos minutos o usuário tem
└─ allow_late_submissions  ← Se permite submeter atrasado
```

**O PROBLEMA:** Se qualquer um desses campos estiver NULL ou 0:

1. **`started_at IS NULL`** → RPC rejeita: "Quest ainda não começou"
2. **`planned_deadline_minutes = 0`** → Deadline é imediato (no mesmo instante)
3. **`allow_late_submissions = FALSE`** → Sistema rejeita submissões atrasadas

### Fluxo da Penalidade (O que DEVERIA acontar)

```
1. Usuário tenta submeter após deadline
   ↓
2. API chama RPC validate_submission_allowed()
   ├─ Calcula: deadline = started_at + planned_deadline_minutes
   ├─ Calcula: late_minutes = submitted_at - deadline
   ├─ Se late_minutes > 0: calcula penalty via calculate_late_penalty()
   └─ Retorna penalty_calculated = -5, -10 ou -15
   ↓
3. API verifica: if (penalty_calculated > 0)
   ├─ SIM → Insere record na tabela penalties
   └─ NÃO → Pula criação de penalty
   ↓
4. View live_ranking soma penalties e deduz do score
```

### O Que Está Acontecendo (ERRADO)

```
submitted_at = 14/11/2025 10:30:00
deadline     = ??? (porque started_at ou planned_deadline_minutes estão errados)

RPC retorna:
{
  is_allowed: TRUE,
  penalty_calculated: 0  ← ❌ ZERO!
  reason: "No prazo" ← ❌ Mas NÃO é no prazo!
}

API verifica: if (0 > 0) → FALSE
API não cria penalty → Nenhuma penalidade na tabela
View não deduz nada → Score permanece errado
```

---

## COMO VERIFICAR

### Executar Este SQL (Copiar e Colar no Supabase)

```sql
-- Ver quests da Áurea Forma com configuração de deadline
SELECT
  q.id,
  q.name,
  q.started_at,
  q.planned_deadline_minutes,
  q.allow_late_submissions,
  CASE
    WHEN q.started_at IS NULL THEN '❌ NULL'
    ELSE 'OK'
  END as check_started_at,
  CASE
    WHEN q.planned_deadline_minutes = 0 THEN '❌ ZERO'
    ELSE 'OK'
  END as check_deadline
FROM quests q
WHERE id IN (
  SELECT DISTINCT s.quest_id
  FROM submissions s
  LEFT JOIN teams t ON s.team_id = t.id
  WHERE t.name ILIKE '%aurea%'
)
ORDER BY q.created_at DESC;
```

**O que procurar:**
- `started_at = NULL` → ❌ PROBLEMA!
- `planned_deadline_minutes = 0` → ❌ PROBLEMA!
- `allow_late_submissions = FALSE` → ❌ PROBLEMA!

---

## A SOLUÇÃO

### Passo 1: Identificar as Quests Afetadas

Execute o SQL acima e anote os IDs das quests que têm started_at NULL ou planned_deadline_minutes = 0.

### Passo 2: Configurar os Deadlines

```sql
-- OPÇÃO 1: Se a quest deveria ter 30 minutos de prazo
UPDATE quests
SET
  planned_deadline_minutes = 30,
  late_submission_window_minutes = 15,
  allow_late_submissions = TRUE
WHERE id = 'UUID_DA_QUEST_AQUI';

-- OPÇÃO 2: Se a quest deveria ter começado há X minutos
UPDATE quests
SET
  started_at = NOW() - INTERVAL '60 minutes'  -- Começou 60 minutos atrás
WHERE id = 'UUID_DA_QUEST_AQUI';
```

### Passo 3: Recalcular Penalidades (após atualizar quests)

Depois que os deadlines forem configurados, as submissões que são realmente atrasadas precisam ter suas penalidades recalculadas:

```sql
-- Atualizar submissions que são atrasadas
UPDATE submissions
SET
  is_late = TRUE,
  late_penalty_applied = calculate_late_penalty(
    EXTRACT(EPOCH FROM (submitted_at - (
      SELECT started_at + (planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q
      WHERE q.id = submissions.quest_id
    )))::INTEGER / 60
  )
WHERE quest_id = 'UUID_DA_QUEST_AQUI'
  AND submitted_at > (
    SELECT started_at + (planned_deadline_minutes || ' minutes')::INTERVAL
    FROM quests q
    WHERE q.id = submissions.quest_id
  );

-- Criar penalties para essas submissions
WITH late_subs AS (
  SELECT
    s.id,
    s.team_id,
    s.quest_id,
    s.late_penalty_applied,
    q.name
  FROM submissions s
  LEFT JOIN quests q ON s.quest_id = q.id
  WHERE s.is_late = TRUE
    AND s.late_penalty_applied > 0
    AND s.quest_id = 'UUID_DA_QUEST_AQUI'
)
INSERT INTO penalties (team_id, penalty_type, points_deduction, reason, assigned_by_admin)
SELECT
  team_id,
  'atraso',
  late_penalty_applied,
  'Submissão atrasada na quest ' || name,
  true
FROM late_subs
ON CONFLICT DO NOTHING;  -- Evitar duplicatas

-- Atualizar live_ranking
REFRESH MATERIALIZED VIEW CONCURRENTLY live_ranking;
```

---

## 🔧 ARQUIVO PARA EXECUTAR TUDO

**Nome:** `DIAGNOSTIC-RPC-COMPLETE.sql`

Este arquivo:
1. ✅ Verifica a configuração das quests
2. ✅ Mostra submissões atrasadas
3. ✅ Testa o RPC diretamente
4. ✅ Mostra o resultado completo do RPC
5. ✅ Verifica penalties criadas
6. ✅ Mostra o status no live_ranking

**Como executar:**
1. Abra: https://supabase.com/dashboard
2. SQL Editor → + New Query
3. Copie todo o conteúdo de `DIAGNOSTIC-RPC-COMPLETE.sql`
4. Cole e execute
5. Veja os resultados

---

## RESULTADO ESPERADO APÓS DIAGNÓSTICO

Se o problema for exatamente como esperado, você verá:

```
STEP 1: Quests
├─ started_at = NULL ← ⚠️ PROBLEMA!
├─ planned_deadline_minutes = 0 ← ⚠️ PROBLEMA!
└─ allow_late_submissions = TRUE

STEP 2: Submissões
├─ is_late = TRUE (marcada como atrasada)
├─ late_penalty_applied = 0 (nenhuma penalidade!)
└─ Deveria ter -5 ou -10

STEP 4: RPC Result
├─ penalty_calculated = 0 ← 🔴 AQUI ESTÁ O PROBLEMA!
├─ late_minutes_calculated = 0
└─ reason = "No prazo" ou "Quest ainda não começou"

STEP 5: Penalties
├─ total_penalties = 0 ← 🔴 TABELA VAZIA!
└─ Status: Nenhuma penalidade criada

STEP 8: Summary
└─ 🔴 CRÍTICO: Penalties NÃO estão sendo criadas!
```

---

## SOLUÇÃO RÁPIDA (1 MINUTO)

Se você quer corrigir rápido, execute isto no Supabase:

```sql
-- Encontrar as quests sem deadline
WITH problem_quests AS (
  SELECT DISTINCT q.id
  FROM quests q
  WHERE id IN (
    SELECT DISTINCT s.quest_id
    FROM submissions s
    LEFT JOIN teams t ON s.team_id = t.id
    WHERE t.name ILIKE '%aurea%'
  )
  AND (q.started_at IS NULL OR q.planned_deadline_minutes = 0)
)
-- Atualizar todas com 30 minutos de prazo
UPDATE quests
SET
  started_at = NOW() - INTERVAL '120 minutes',  -- Começou 2 horas atrás
  planned_deadline_minutes = 30,
  late_submission_window_minutes = 15,
  allow_late_submissions = TRUE
WHERE id IN (SELECT id FROM problem_quests);
```

Depois execute:
```sql
-- Recalcular penalties
UPDATE submissions
SET late_penalty_applied = CASE
  WHEN submitted_at > (
    SELECT started_at + (planned_deadline_minutes || ' minutes')::INTERVAL
    FROM quests WHERE id = submissions.quest_id
  )
  THEN calculate_late_penalty(
    EXTRACT(EPOCH FROM (submitted_at - (
      SELECT started_at + (planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests WHERE id = submissions.quest_id
    )))::INTEGER / 60
  )
  ELSE 0
END,
is_late = submitted_at > (
  SELECT started_at + (planned_deadline_minutes || ' minutes')::INTERVAL
  FROM quests WHERE id = submissions.quest_id
);
```

---

## PRÓXIMOS PASSOS

1. **Execute** `DIAGNOSTIC-RPC-COMPLETE.sql`
2. **Procure** por campos NULL ou ZERO
3. **Atualize** a quest com `UPDATE quests SET started_at = ..., planned_deadline_minutes = ...`
4. **Recalcule** as penalidades
5. **Verifique** que live_ranking mostra score reduzido ✅

---

*Diagnóstico criado: 14/11/2025*
