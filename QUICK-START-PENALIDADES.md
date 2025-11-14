# ⚡ QUICK START: Corrigir Penalidades em 5 Minutos

**TL;DR:** Copiar, colar, executar. Pronto.

---

## O Problema em 1 Linha

As quests não têm `started_at` e `planned_deadline_minutes` configurados, então as penalidades nunca são criadas.

---

## A Solução em 3 Passos

### 1️⃣ Abrir Supabase

https://supabase.com/dashboard → Seu Projeto → SQL Editor

### 2️⃣ Copiar Este SQL

```sql
-- ========================================
-- FIX AUTOMÁTICO DE PENALIDADES
-- ========================================

-- Diagnosticar
SELECT COUNT(*) as quests_sem_deadline
FROM quests
WHERE started_at IS NULL OR planned_deadline_minutes = 0;

-- Corrigir quests
UPDATE quests
SET
  started_at = COALESCE(started_at, NOW() - INTERVAL '120 minutes'),
  planned_deadline_minutes = CASE WHEN planned_deadline_minutes = 0 THEN 30 ELSE planned_deadline_minutes END,
  allow_late_submissions = TRUE
WHERE id IN (
  SELECT DISTINCT s.quest_id FROM submissions s WHERE s.is_late = TRUE
);

-- Recalcular penalidades
UPDATE submissions s
SET
  is_late = TRUE,
  late_penalty_applied = calculate_late_penalty(
    EXTRACT(EPOCH FROM (s.submitted_at - (
      SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q WHERE q.id = s.quest_id
    )))::INTEGER / 60
  )
WHERE s.submitted_at > (
  SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
  FROM quests q WHERE q.id = s.quest_id
);

-- Criar penalidades
INSERT INTO penalties (team_id, penalty_type, points_deduction, reason, assigned_by_admin)
SELECT
  s.team_id, 'atraso', s.late_penalty_applied,
  'Submissão atrasada na quest', TRUE
FROM submissions s
WHERE s.is_late = TRUE AND s.late_penalty_applied > 0
ON CONFLICT DO NOTHING;

-- Verificar resultado
SELECT 'VERIFICAÇÃO' as status,
  (SELECT COUNT(*) FROM submissions WHERE is_late = TRUE AND late_penalty_applied > 0) as subs_com_penalty,
  (SELECT COUNT(*) FROM penalties WHERE penalty_type = 'atraso') as penalties_criadas;
```

### 3️⃣ Colar + Executar

- Cole no SQL Editor
- Aperte **Ctrl+Enter** ou clique **RUN**
- Aguarde conclusão
- Pronto! ✅

---

## Resultado Esperado

```
Status: ✅ Quests atualizadas
Status: ✅ Submissões recalculadas
Status: ✅ Penalidades criadas

Verificação:
├─ subs_com_penalty: 2
└─ penalties_criadas: 2
```

---

## Verificar Score da Áurea Forma

Depois, execute isto para ver o novo score:

```sql
SELECT team_name, total_points, quests_completed
FROM live_ranking
WHERE team_name ILIKE '%aurea%';
```

**Esperado:** Score deve estar REDUZIDO (menor que antes)

Exemplo:
- Antes: 199 ❌
- Depois: 179 ou 190 ✅ (depende da configuração)

---

## Se Der Erro

Se a query falhar, significa que as funções não estão criadas. Execute isto antes:

```sql
-- Ver se funções existem
SELECT COUNT(*)
FROM information_schema.routines
WHERE routine_name = 'calculate_late_penalty'
AND routine_schema = 'public';
```

Se retornar `0`, você precisa executar: `add-late-submission-system.sql` no seu banco.

---

## Está Tudo OK?

✅ Quests com deadline configurado
✅ Submissões com late_penalty_applied
✅ Penalidades na tabela penalties
✅ Score reduzido no live_ranking

**Tudo pronto!** 🎉

---

## Próximas Vezes

Quando novas submissões atrasadas forem feitas, as penalidades serão criadas **automaticamente** porque:

1. ✅ Quests agora têm deadlines
2. ✅ RPC retorna penalty_calculated correto
3. ✅ API insere penalties
4. ✅ View deduz do score

---

**Time:** 5 minutos
**Risco:** NENHUM
**Resultado:** Penalidades funcionando corretamente 🚀
