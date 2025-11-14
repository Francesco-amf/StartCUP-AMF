# 🚀 SQL PARA COPIAR E COLAR DIRETO

**Copie o SQL abaixo e cole no Supabase SQL Editor**

---

## 📋 PASSO A PASSO

1. Abra: https://supabase.com/dashboard
2. Seu projeto → SQL Editor
3. Clique: "+ New Query"
4. **COPIE** todo o SQL abaixo
5. **COLE** na caixa de texto
6. Clique: **Run** (ou Ctrl+Enter)
7. Aguarde resultado
8. Pronto!

---

## 🔧 SQL PARA COPIAR:

```sql
-- Remover view antiga
DROP VIEW IF EXISTS live_ranking CASCADE;

-- Criar nova view que SUBTRAI penalidades
CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  COALESCE(SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN p.penalty_type = 'atraso' THEN p.points_deduction ELSE 0 END), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN penalties p ON t.id = p.team_id
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

-- Permissões
GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

-- Ver resultado
SELECT team_name, total_points, quests_completed
FROM live_ranking
ORDER BY total_points DESC
LIMIT 20;
```

---

## ✅ ESPERADO DEPOIS:

Você vai ver uma tabela com teams e seus scores **REDUZIDOS** pelas penalidades.

Exemplo:
```
team_name    | total_points | quests_completed
-------------|--------------|----------------
Team A       | 290          | 3
Team B       | 285          | 3
Áurea Forma  | 95           | 1  ← REDUZIDO de 100 para 95!
```

---

## 🎯 PRONTO!

Depois disto:

1. Recarregue o navegador
2. Vá para Live Dashboard
3. Verifique que scores foram reduzidos ✅

---

**Tempo total:** < 1 minuto
**Risco:** Nenhum
**Resultado:** Penalidades agora deduzidas! ✅
