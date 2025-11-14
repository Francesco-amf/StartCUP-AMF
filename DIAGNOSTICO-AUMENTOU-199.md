# 🔴 DIAGNÓSTICO: Por que score AUMENTOU para 199?

**Você disse:**
- Deveria estar: **179** (189 - 10 penalidades)
- Estava: **189**
- Agora está: **199** ❌ PIOROU!

---

## O PROBLEMA REAL

O score **AUMENTOU +10** ao invés de **DIMINUIR -10**.

Isso significa uma de duas coisas:

### Opção 1: Final_points JÁ inclui a penalidade

Se a coluna `final_points` na tabela `submissions` **já subtrai a penalidade automaticamente**, então:

```
final_points = pontos_da_avaliacao - penalidade_aplicada

Exemplo:
- Avaliação: 100 pontos
- Penalidade: -10
- final_points: 90 (já com penalidade aplicada!)

Então:
- SUM(final_points) = 90 ✅ (já correto)
- Não precisa subtrair MAIS na view!
```

### Opção 2: Há lógica invertida na query

A query está **SOMANDO** penalidades em vez de **SUBTRAIR**.

---

## TESTE RÁPIDO

Execute este SQL:

```sql
SELECT
  s.final_points,
  s.late_penalty_applied,
  q.name as quest_name,
  (s.final_points + s.late_penalty_applied) as if_were_added,
  (s.final_points - s.late_penalty_applied) as if_were_subtracted
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.is_late = TRUE
LIMIT 5;
```

**O que procurar:**
- Se `final_points` já tem valor reduzido → **Opção 1** (já inclui penalidade)
- Se `final_points` é o valor bruto → **Opção 2** (precisa subtrair)

---

## A SOLUÇÃO

### Se final_points JÁ inclui penalidade (MAIS PROVÁVEL):

Use esta query:

```sql
DROP VIEW IF EXISTS live_ranking CASCADE;

CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  -- ✅ Apenas somar, final_points JÁ tem penalidade aplicada!
  COALESCE(SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

SELECT team_name, total_points, quests_completed
FROM live_ranking
ORDER BY total_points DESC
LIMIT 20;
```

---

## POR QUE AUMENTOU PARA 199?

Se a query estava **SUBTRAINDO** uma penalidade que **já estava subtraída**:

```
final_points = 189 (já com penalidade -10 incluída)

Query anterior fazia:
189 - 10 (penalidade) = 179 ❌ ERRADO (dobrou a penalidade!)

Depois quando voltou a somar:
189 + 10 (penalidade sendo somada) = 199 ❌ ERRADO TAMBÉM!
```

---

## SOLUÇÃO DEFINITIVA

A resposta está em verificar se `final_points` já inclui a penalidade.

**Arquivo:** `SQL-CORRECAO-FINAL.sql`

Este arquivo tem:
1. Query para verificar se final_points já tem penalidade
2. Query corrigida que apenas soma (sem subtrair duplamente)
3. Debug queries para validar

---

## PASSO A PASSO

1. Execute `SQL-CORRECAO-FINAL.sql` no Supabase
2. Veja o PASSO 1 para verificar final_points
3. Se já tem penalidade: use Solução 1 (apenas somar)
4. Se não tem penalidade: use Solução 2 (subtrair)

---

## 🎯 RESUMO

| Score | Situação | Causa |
|-------|----------|-------|
| 179 | ✅ CORRETO | final_points já com penalidade, apenas soma |
| 189 | ❌ ERRADO | Não está subtraindo (ou subtraindo dobrado) |
| 199 | ❌ MUITO ERRADO | Penalidade sendo SOMADA ao invés de subtraída |

---

## 📋 PRÓXIMOS PASSOS

1. Execute: `SQL-CORRECAO-FINAL.sql`
2. Veja o resultado do PASSO 1
3. Determine se final_points já inclui penalidade
4. Use a query corrigida apropriada
5. Verifique que score ficou em **179** ✅

---

*Diagnóstico criado: 14/11/2025*
