# 🔧 INSTRUÇÕES SIMPLES - Corrigir Penalidades

## O PROBLEMA

Áurea Forma recebeu 100 pontos mas deveria ser 95 (100 - 5 de penalidade).

## A SOLUÇÃO (5 MINUTOS)

### 1️⃣ Abra Supabase

https://supabase.com/dashboard → Seu Projeto

### 2️⃣ Vá para SQL Editor

Na barra lateral esquerda → **SQL Editor**

### 3️⃣ Clique em "+ New Query"

### 4️⃣ COPIE este SQL:

```sql
DROP VIEW IF EXISTS live_ranking CASCADE;

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

GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

SELECT team_name, total_points, quests_completed
FROM live_ranking
ORDER BY total_points DESC
LIMIT 20;
```

### 5️⃣ COLE na caixa de texto

### 6️⃣ Clique em RUN

Ou pressione: **Ctrl + Enter**

### 7️⃣ Aguarde resultado

Deve mostrar uma tabela com teams e scores **REDUZIDOS** pelas penalidades.

Áurea Forma deve aparecer com **95** (não 100).

### 8️⃣ Pronto! ✅

Recarregue o navegador e vá no Live Dashboard para verificar.

---

## 🎯 O QUE DEVE ACONTECER

Antes:
```
Áurea Forma: 100 pontos
```

Depois:
```
Áurea Forma: 95 pontos ✅
```

---

## ⏱️ Tempo

- Copiar SQL: 30 segundos
- Colar e executar: 30 segundos
- **Total: 1 minuto**

---

## 🆘 Erro?

Se aparecer erro no SQL, tente:

1. Certificar que copiou TUDO (começa com DROP VIEW...)
2. Certificar que está no Supabase SQL Editor (não em outro lugar)
3. Tentar novamente

---

## ✨ Pronto!

Agora as penalidades são deduzidas automaticamente! 🎉
