# 🔴 CRITICAL BUG: Penalidades Não Deduzidas do Score Final

**Status:** 🔴 CRÍTICO - Impactando resultado final
**Reportado:** 14/11/2025
**Severidade:** Alta

---

## O Problema

Você descobriu que:

> **Tarefa enviada em atraso → Avaliador deu 100 pontos → Mas deveria ser 95 (100 - 5 de penalidade)**

**Exemplo:**
- Equipe "Áurea Forma" submeteu após deadline
- Recebeu 100 pontos na avaliação
- Sistema registrou `late_penalty_applied = 5`
- MAS no ranking final: **ainda aparece 100 pontos** (sem deduzir os 5)
- **Deveria ser: 95 pontos**

---

## Causa Raiz

### O que está acontecendo:

1. ✅ **Penalidade é registrada corretamente:**
   - `submissions.late_penalty_applied = 5` ✅
   - Tabela `penalties` tem registro com `points_deduction = 5` ✅

2. ❌ **MAS penalidade NÃO é deduzida do ranking:**
   - View `live_ranking` usa: `SUM(final_points)`
   - **NÃO subtrai** as penalidades!

### A View Atual (ERRADA):

```sql
CREATE VIEW live_ranking AS
SELECT
  t.id,
  t.name,
  t.course,
  COALESCE(SUM(s.final_points), 0) as total_points,  -- ❌ SEM deduzir penalidades!
  ...
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
...
```

### O que deveria ser (CORRETO):

```sql
CREATE VIEW live_ranking AS
SELECT
  t.id,
  t.name,
  t.course,
  COALESCE(SUM(s.final_points), 0) - COALESCE(SUM(p.points_deduction), 0) as total_points,
  -- ✅ Subtrai as penalidades!
  ...
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN penalties p ON t.id = p.team_id  -- ✅ Precisa fazer LEFT JOIN nas penalidades
...
```

---

## Solução

### SQL Fix

Executar o arquivo: `FIX-PENALTY-DEDUCTION-IN-RANKING.sql`

**O que faz:**
1. Dropa a view `live_ranking` antiga
2. Recriar com cálculo correto:
   ```sql
   COALESCE(SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END), 0) -
   COALESCE(SUM(CASE WHEN p.penalty_type = 'atraso' THEN p.points_deduction ELSE 0 END), 0) as total_points
   ```
3. Adiciona `LEFT JOIN penalties` table
4. Verifica resultado

### Passo a Passo:

```bash
# 1. Abrir SQL Editor do Supabase
# 2. Copiar conteúdo de: FIX-PENALTY-DEDUCTION-IN-RANKING.sql
# 3. Executar todo o script
# 4. Verificar resultado - deve mostrar pontos DEDUZIDOS
```

---

## Verificação Antes vs Depois

### ANTES (COM BUG):

```
Equipe: Áurea Forma
Submissões avaliadas: 100 pontos
Penalidades: -5 pontos
RANKING FINAL: 100 ❌ (deveria ser 95)
```

### DEPOIS (CORRIGIDO):

```
Equipe: Áurea Forma
Submissões avaliadas: 100 pontos
Penalidades: -5 pontos
RANKING FINAL: 95 ✅ (CORRETO!)
```

---

## Impacto

### Afetados:
- ✅ Todas as equipes com submissões atrasadas
- ✅ Todas as equipes com penalidades aplicadas
- ✅ Ranking final (live_ranking view)

### Escopo:
- Dashboard ao vivo (live_ranking)
- Histórico de scores
- Rankings finais

---

## Dados para Testar

### Query para Verificar Penalidades Não Deduzidas:

```sql
SELECT
  t.name as team_name,
  s.final_points as points_earned,
  COALESCE(SUM(p.points_deduction), 0) as penalties_applied,
  s.final_points - COALESCE(SUM(p.points_deduction), 0) as should_be_score,
  s.is_late
FROM submissions s
JOIN teams t ON s.team_id = t.id
LEFT JOIN penalties p ON t.id = p.team_id AND p.penalty_type = 'atraso'
WHERE s.is_late = TRUE
AND s.status = 'evaluated'
GROUP BY s.id, t.id, t.name, s.final_points, s.is_late;
```

**Esperado depois do fix:** Coluna `should_be_score` deve ser o score final no ranking.

---

## Arquivos Criados

1. **`FIX-PENALTY-DEDUCTION-IN-RANKING.sql`** ← **Execute ISTO**
   - SQL script com a view corrigida
   - Inclui verificações
   - Pronto para executar no Supabase

2. **`diagnose-penalty-deduction.sql`** ← Para diagnosticar
   - Queries para verificar status atual
   - Encontra equipes afetadas
   - Valida cálculos

3. **`CRITICAL-BUG-PENALTY-NOT-DEDUCTED.md`** ← Este arquivo
   - Explicação completa do bug
   - Como corrigir
   - Validação

---

## Checklist de Fix

- [ ] Executar `FIX-PENALTY-DEDUCTION-IN-RANKING.sql` no Supabase
- [ ] Verificar que script executou sem erros
- [ ] Verificar que Áurea Forma agora tem score correto (95, não 100)
- [ ] Verificar outras equipes com atraso também estão corretas
- [ ] Recarregar live-dashboard no navegador
- [ ] Confirmar que ranking mostra pontos DEDUZIDOS

---

## Notas Técnicas

### Por que isto aconteceu?

A view `live_ranking` foi criada ANTES da tabela `penalties` ser implementada completamente. Quando `penalties` foi adicionada depois, a view não foi atualizada para incluir a lógica de dedução.

### Estrutura das Tabelas:

```
submissions
├─ id
├─ team_id
├─ quest_id
├─ final_points (pontos da avaliação)
├─ is_late (booleano)
├─ late_penalty_applied (número, ex: 5)
└─ status ('evaluated', 'pending', etc)

penalties
├─ id
├─ team_id
├─ penalty_type ('atraso', 'regra_violada', etc)
├─ points_deduction (número, ex: 5)
└─ created_at

live_ranking (VIEW)
├─ team_id
├─ team_name
├─ total_points ← AQUI DEVERIA SUBTRAIR PENALTIES!
└─ quests_completed
```

### Como funciona o fix:

```sql
COALESCE(SUM(s.final_points), 0)  -- Soma todos os pontos earned
-
COALESCE(SUM(p.points_deduction), 0)  -- Subtrai todas as penalidades
=
total_points  -- Score final CORRETO
```

---

## Impacto em Produção

**CRÍTICO PARA:** Rankings justos e resultados finais
**DEVE SER CORRIGIDO ANTES:** Finalizar evento

---

## Próximos Passos

1. **AGORA:** Execute `FIX-PENALTY-DEDUCTION-IN-RANKING.sql`
2. **VALIDAR:** Verifique que penalidades estão sendo deduzidas
3. **COMUNICAR:** Informe equipes se houve reajuste de scores
4. **MONITOR:** Fique atento para novos atrasos (devem deduzir automaticamente agora)

---

**Severity:** 🔴 CRÍTICO
**Impact:** Alto (afeta resultado final)
**Fix Difficulty:** Baixa (1 linha SQL)
**Testing:** Essencial

---

*Identificado e analisado: 14/11/2025*
