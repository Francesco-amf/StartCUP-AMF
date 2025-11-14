# 🔧 PRÓXIMO PASSO: Execute Diagnóstico

**Objetivo:** Descobrir por que score aumentou de 189 para 199

---

## 📋 PASSO A PASSO

### 1️⃣ Abra Supabase SQL Editor

https://supabase.com/dashboard → Seu Projeto → SQL Editor

### 2️⃣ "+ New Query"

### 3️⃣ COPIE Este SQL:

```sql
-- Verificar como final_points é calculado
SELECT
  s.id,
  s.final_points,
  s.late_penalty_applied,
  (SELECT COALESCE(SUM(p.points_deduction), 0)
   FROM penalties p WHERE p.team_id = s.team_id AND p.penalty_type = 'atraso') as penalties_in_db
FROM submissions s
WHERE s.is_late = TRUE
LIMIT 5;
```

### 4️⃣ Clique **RUN**

### 5️⃣ ANALISE O RESULTADO

**Procure:**

- **Se `final_points` JÁ está reduzido:**
  ```
  final_points: 85
  late_penalty_applied: 10
  penalties_in_db: 10

  → Significa: final_points JÁ tem penalidade aplicada!
  ```

- **Se `final_points` é o valor BRUTO:**
  ```
  final_points: 100
  late_penalty_applied: 10
  penalties_in_db: 10

  → Significa: final_points NÃO tem penalidade, precisa subtrair
  ```

---

## 📊 INTERPRETAÇÃO DOS RESULTADOS

### Cenário 1: final_points JÁ INCLUI penalidade

```
Avaliação: 100
Penalidade: -10
final_points no DB: 90 ✅ (já com penalidade)

→ Use query simples: SELECT SUM(final_points)
```

### Cenário 2: final_points é o VALOR BRUTO

```
Avaliação: 100
Penalidade: -10
final_points no DB: 100 ❌ (sem penalidade)

→ Precisa: SELECT SUM(final_points) - SUM(penalties)
```

---

## 🎯 APÓS DESCOBRIR

### Se é Cenário 1:

Execute esta query:

```sql
DROP VIEW IF EXISTS live_ranking CASCADE;

CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  COALESCE(SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

SELECT team_name, total_points FROM live_ranking WHERE LOWER(team_name) LIKE '%aurea%';
```

### Se é Cenário 2:

Implementar lógica de subtração (será criado depois).

---

## 📞 REPORTE O RESULTADO

Depois que executar, me reporte:

```
final_points: [valor]
late_penalty_applied: [valor]
penalties_in_db: [valor]

→ Qual é o cenário? 1 ou 2?
```

---

## ⏱️ TEMPO

- Executar SQL: 1 minuto
- Analisar resultado: 1 minuto
- **Total: 2 minutos**

---

**Vamos descobrir por que está 199 e corrigir para 179!** 🚀
