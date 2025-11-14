# ✅ SQL CORRETO - COPIAR AGORA

**A query anterior tinha um BUG que fazia score AUMENTAR.**
**Esta é a versão CORRIGIDA.**

---

## 📋 COMO USAR

1. Supabase → SQL Editor
2. "+ New Query"
3. **COPIAR** o SQL abaixo
4. **COLAR** na caixa
5. **RUN** (Ctrl+Enter)

---

## 🔧 SQL CORRETO:

```sql
DROP VIEW IF EXISTS live_ranking CASCADE;

CREATE VIEW live_ranking AS
WITH team_submissions AS (
  SELECT
    s.team_id,
    SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) as total_points
  FROM submissions s
  GROUP BY s.team_id
),
team_penalties AS (
  SELECT
    p.team_id,
    SUM(p.points_deduction) as total_penalties
  FROM penalties p
  WHERE p.penalty_type = 'atraso'
  GROUP BY p.team_id
)
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  COALESCE(ts.total_points, 0) - COALESCE(tp.total_penalties, 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN team_submissions ts ON t.id = ts.team_id
LEFT JOIN team_penalties tp ON t.id = tp.team_id
GROUP BY t.id, t.name, t.course, ts.total_points, tp.total_penalties
ORDER BY total_points DESC;

GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

SELECT team_name, total_points, quests_completed
FROM live_ranking
ORDER BY total_points DESC
LIMIT 20;
```

---

## ✅ O QUE ESPERAR

Depois de executar, você verá scores **REDUZIDOS** pelas penalidades.

Exemplo:
```
team_name    | total_points
-------------|---------------
Team A       | 290
Áurea Forma  | 90   ← AGORA REDUZIDO CORRETAMENTE!
Team B       | 285
```

Se Áurea Forma teve:
- 100 + 50 pontos = 150 earned
- -5 -5 penalidades = -10 total
- **Final: 150 - 10 = 140**

---

## ⏱️ TEMPO

- Copiar: 30 segundos
- Colar e executar: 30 segundos
- **Total: 1 minuto**

---

## 🎯 DIFERENÇA

**Query anterior:** Via LEFT JOIN (criava Cartesian Product - BUG)
**Query nova:** Via WITH subqueries (cálculo separado - CORRETO)

---

## ✨ PRONTO!

Execute agora e penalidades serão deduzidas corretamente! ✅
