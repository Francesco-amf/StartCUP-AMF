# 🆘 PLAN B: Se o Fix Não Funcionar

**Quando usar este documento:**
- Você executou `FIX-ALL-PENALTIES-AUTO.sql` mas penalties ainda não aparecem
- Ou score ainda não está sendo deduzido corretamente
- Ou recebe erro ao executar o script

---

## 🔧 PLANO B - ABORDAGEM MANUAL E GRADUAL

Se o script automático não funcionar completamente, execute passo a passo:

### PASSO 1: Verificar Problema

```sql
-- Ver exatamente o que está errado
SELECT
  'Status das Quests' as check,
  COUNT(DISTINCT CASE WHEN started_at IS NULL THEN id END) as quests_sem_start,
  COUNT(DISTINCT CASE WHEN planned_deadline_minutes = 0 THEN id END) as quests_sem_deadline
FROM quests;

-- Ver submissões atrasadas
SELECT
  COUNT(*) as total_late_subs,
  COUNT(DISTINCT CASE WHEN late_penalty_applied > 0 THEN id END) as com_penalty,
  COUNT(DISTINCT CASE WHEN late_penalty_applied = 0 THEN id END) as sem_penalty
FROM submissions
WHERE is_late = TRUE;

-- Ver penalidades criadas
SELECT
  COUNT(*) as total_penalties
FROM penalties
WHERE penalty_type = 'atraso';
```

**O que você quer ver:**
```
check | quests_sem_start | quests_sem_deadline
------|------------------|-------------------
... | 0 | 0

total_late_subs | com_penalty | sem_penalty
----------------|-------------|-------------
2 | 2 | 0

total_penalties
---------------
2
```

Se não está assim, continue...

---

### PASSO 2: Configurar Quests Manualmente

Se as quests ainda não têm deadline:

```sql
-- Encontrar quests que precisam ser configuradas
SELECT id, name, started_at, planned_deadline_minutes
FROM quests
WHERE id IN (
  SELECT DISTINCT s.quest_id
  FROM submissions s
  WHERE s.is_late = TRUE
)
AND (started_at IS NULL OR planned_deadline_minutes = 0);
```

Para cada quest encontrada, execute:

```sql
-- Substituir UUID_AQUI pelo ID da quest
UPDATE quests
SET
  started_at = NOW() - INTERVAL '120 minutes',  -- Começou 2 horas atrás
  planned_deadline_minutes = 30,                -- Prazo de 30 minutos
  late_submission_window_minutes = 15,          -- Janela de atraso de 15 minutos
  allow_late_submissions = TRUE
WHERE id = 'UUID_AQUI';
```

---

### PASSO 3: Recalcular Penalty Applied

Se submissões ainda têm `late_penalty_applied = 0`:

```sql
-- Recalcular para todas as submissões atrasadas
UPDATE submissions
SET
  late_penalty_applied = calculate_late_penalty(
    EXTRACT(EPOCH FROM (submitted_at - (
      SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q
      WHERE q.id = submissions.quest_id
    )))::INTEGER / 60
  )
WHERE is_late = TRUE
AND late_penalty_applied = 0;
```

---

### PASSO 4: Verificar Que Funcionou

```sql
-- Ver submissões após recálculo
SELECT
  s.id,
  s.is_late,
  s.late_penalty_applied,
  s.submitted_at,
  q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL as deadline
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.is_late = TRUE
LIMIT 5;

-- Deve mostrar: late_penalty_applied > 0
```

---

### PASSO 5: Criar Penalidades

Se a tabela penalties ainda está vazia:

```sql
-- Inserir penalties para cada submissão atrasada
INSERT INTO penalties (team_id, penalty_type, points_deduction, reason, assigned_by_admin)
SELECT
  s.team_id,
  'atraso',
  s.late_penalty_applied,
  'Submissão atrasada na quest ' || q.name,
  TRUE
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.is_late = TRUE
AND s.late_penalty_applied > 0
ON CONFLICT DO NOTHING;
```

---

### PASSO 6: Verificar Live Ranking

```sql
-- Ver se live_ranking mostra penalties deduzidas
SELECT team_name, total_points, quests_completed
FROM live_ranking
WHERE team_name ILIKE '%aurea%';
```

**Esperado:** Score deve estar REDUZIDO

---

## 🔴 Se Ainda Assim Não Funcionar

### Possível Causa 1: Functions Não Existem

```sql
-- Verificar se as funções existem
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('calculate_late_penalty', 'validate_submission_allowed')
AND routine_schema = 'public';
```

Se não aparecer nada, você precisa executar:
```
arquivo: add-late-submission-system.sql
```

Este arquivo cria todas as funções necessárias.

---

### Possível Causa 2: View Usa Join Errado

Se penalties existem mas live_ranking não deduz:

```sql
-- Verificar a view
SELECT *
FROM live_ranking
WHERE team_name ILIKE '%aurea%';
```

Se o score NÃO está reduzido mesmo com penalties existindo, então a VIEW está errada.

**Solução:** Use a view corrigida em `SQL-CORRETO-COPIAR-AGORA.md`

Execute:
```sql
-- Dropar view antiga
DROP VIEW IF EXISTS live_ranking CASCADE;

-- Copiar nova view de SQL-CORRETO-COPIAR-AGORA.md
CREATE VIEW live_ranking AS
WITH team_submissions AS (
  -- ... resto do SQL
)
```

---

### Possível Causa 3: Trigger Não Está Funcionando

Se submissions continue com `is_late = FALSE` mesmo sendo atrasadas:

```sql
-- Verificar trigger
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'submissions'
AND trigger_schema = 'public';
```

Se o trigger `update_late_submission_fields_trigger` não aparecer:

```sql
-- Recriar trigger
CREATE TRIGGER update_late_submission_fields_trigger
BEFORE INSERT OR UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_late_submission_fields();
```

---

## 📋 CHECKLIST PLAN B

Se executar manualmente, use este checklist:

- [ ] Passo 1: Verificar status (executei)
- [ ] Passo 2: Configurar quests (executei)
- [ ] Passo 3: Recalcular penalty_applied (executei)
- [ ] Passo 4: Verificar resultado (tudo OK?)
- [ ] Passo 5: Criar penalidades (executei)
- [ ] Passo 6: Verificar live_ranking (score diminuiu?)

Se tudo OK em cada passo, passe para o próximo.

---

## 🐛 DEBUG SQL Completo

Se precisa ver tudo de uma vez:

```sql
-- DEBUG COMPLETO
SELECT
  'QUESTS' as section,
  COUNT(*) as total,
  COUNT(DISTINCT CASE WHEN started_at IS NULL THEN id END) as sem_start,
  COUNT(DISTINCT CASE WHEN planned_deadline_minutes = 0 THEN id END) as sem_deadline,
  COUNT(DISTINCT CASE WHEN allow_late_submissions = FALSE THEN id END) as nao_permite_atraso

UNION ALL

SELECT
  'SUBMISSIONS',
  COUNT(*),
  COUNT(DISTINCT CASE WHEN is_late = TRUE THEN id END),
  COUNT(DISTINCT CASE WHEN late_penalty_applied > 0 THEN id END),
  NULL

UNION ALL

SELECT
  'PENALTIES',
  COUNT(*),
  COUNT(DISTINCT CASE WHEN penalty_type = 'atraso' THEN id END),
  NULL,
  NULL

FROM (
  SELECT 1 as n UNION SELECT 2 UNION SELECT 3
) as dummy
FULL OUTER JOIN quests q ON dummy.n = 1
FULL OUTER JOIN submissions s ON dummy.n = 2
FULL OUTER JOIN penalties p ON dummy.n = 3;
```

---

## 💬 Se Precisar de Ajuda

Se mesmo assim não funcionar:

1. **Capture o erro completo:**
   - Copie exatamente a mensagem de erro do SQL
   - Qual passo falhou?

2. **Verifique:**
   - Qual é o seu plano de projeto? (Fases, quests configuradas)
   - Qual é a equipe que deve ter penalidade?
   - Quantas submissões atrasadas existem?

3. **Informações úteis para debug:**
   ```sql
   -- Team ID
   SELECT id, name FROM teams WHERE name ILIKE '%aurea%';

   -- Quest IDs
   SELECT id, name, phase_id FROM quests LIMIT 5;

   -- Submission IDs
   SELECT id, team_id, quest_id, submitted_at FROM submissions LIMIT 5;
   ```

---

## ⏱️ Tempo Estimado

- Passo 1: 2 minutos (verificação)
- Passo 2: 2 minutos (configurar)
- Passo 3: 1 minuto (recalcular)
- Passo 4: 1 minuto (verificar)
- Passo 5: 1 minuto (criar)
- Passo 6: 1 minuto (verificar resultado)

**Total: ~10 minutos**

---

## ✅ Resultado Final

Se todos os passos forem OK:

```
✅ Quests configuradas
✅ Penalties criadas
✅ Live ranking atualizado
✅ Score reduzido corretamente
```

Então o sistema de penalidades está funcionando!

---

**Se tudo falhar, execute `FIX-ALL-PENALTIES-AUTO.sql` novamente - ele é idempotente (seguro de rodar múltiplas vezes)**

*Plan B criado: 14/11/2025*
