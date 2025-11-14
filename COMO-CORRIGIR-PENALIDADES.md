# 🔧 Como Corrigir: Penalidades Não Deduzidas

**Problema:** Scores não estão sendo reduzidos pelas penalidades de atraso
**Solução:** Executar SQL fix no Supabase

---

## 🚀 PASSO A PASSO

### Passo 1: Abrir Supabase Console

1. Acesse seu projeto Supabase
2. Vá para **SQL Editor**
3. Clique em **+ New Query**

### Passo 2: Copiar o SQL Fix

1. Abra arquivo: `FIX-PENALTY-DEDUCTION-IN-RANKING.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase

### Passo 3: Executar o Script

1. Clique em **▶ Run** (ou Ctrl+Enter)
2. Aguarde execução (deve demorar 1-2 segundos)
3. **Esperado:** Resultado com lista de equipes e scores

### Passo 4: Verificar Resultado

Após executar, você deve ver:

```
team_name | total_points | quests_completed
---------|--------------|----------------
Team A   | 285          | 3
Team B   | 290          | 3
Áurea    | 95           | 1  ← Score REDUZIDO de 100 para 95!
```

---

## ✅ Validação

### Query Rápida para Verificar

Se quer verificar rapidinho se funcionou:

```sql
SELECT
  team_name,
  total_points
FROM live_ranking
WHERE LOWER(team_name) LIKE '%aurea%'
   OR LOWER(team_name) LIKE '%forma%';
```

**Esperado:** Score deve ser 95 (ou menor se mais penalidades)

### Diagnóstico Completo

Se quiser saber exatamente o que está acontecendo:

```sql
SELECT
  t.name as team_name,
  COUNT(s.id) as submissions,
  SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) as total_earned,
  COALESCE(SUM(p.points_deduction), 0) as total_penalties,
  SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) -
    COALESCE(SUM(p.points_deduction), 0) as final_score
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN penalties p ON t.id = p.team_id
GROUP BY t.id, t.name
ORDER BY final_score DESC
LIMIT 20;
```

---

## 🌐 Verificar no Navegador

Após executar o SQL:

1. Recarregue o navegador (Ctrl+F5)
2. Vá para o Live Dashboard
3. Verifique o ranking
4. **Áurea Forma** deve aparecer com score menor (95, não 100)

---

## 🆘 Se Algo Deu Errado

### Erro: "relation 'live_ranking' does not exist"

**Solução:** A view foi dropada mas erro ao recriar. Execute novamente, desta vez apenas a parte de CREATE:

```sql
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
```

### Erro: "column 'penalty_type' does not exist"

**Solução:** Tabela penalties pode ter schema diferente. Verifique:

```sql
SELECT * FROM penalties LIMIT 5;
```

Se a coluna não existir, adapte o script removendo `AND p.penalty_type = 'atraso'`.

---

## 📊 Antes vs Depois

### ANTES (Com Bug)

```
Áurea Forma
├─ Submissão 1: 100 pontos
├─ Penalidade: -5 pontos
└─ Total no Ranking: 100 ❌ ERRADO
```

### DEPOIS (Corrigido)

```
Áurea Forma
├─ Submissão 1: 100 pontos
├─ Penalidade: -5 pontos
└─ Total no Ranking: 95 ✅ CORRETO
```

---

## 💡 Dicas

- **Fazer backup:** Se tiver preocupação, abra outra tab e faça query de SELECT antes de executar o DROP
- **Teste:** Após fix, submeta algo em atraso e veja se penalidade é deduzida automaticamente
- **Verif**: Rodar query de validação para confirmar todos os scores estão corretos

---

## 📞 FAQ

**P: Preciso reexecutar depois?**
R: Não. Uma vez executado, fica permanente na view. Futuras penalidades serão deduzidas automaticamente.

**P: Vai refazer o cálculo retroativamente?**
R: Sim! A view recalcula toda vez que é acessada. Todos os scores antigos serão atualizados.

**P: Posso desfazer se errar?**
R: Sim, basta recriar a view com a definição anterior (antes do fix).

**P: Quanto tempo leva?**
R: Menos de 1 segundo.

---

## ✨ Resumo

1. Copie conteúdo de `FIX-PENALTY-DEDUCTION-IN-RANKING.sql`
2. Execute no SQL Editor do Supabase
3. Verifique resultado
4. Pronto! Penalidades agora são deduzidas

---

*15 minutos no máximo para corrigir!*
