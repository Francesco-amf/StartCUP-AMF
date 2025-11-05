# 🐛 Bug Crítico: Cálculo de AMF Coins Duplicado

## 🔍 Problema Identificado

**Sintoma**: Equipe com 200 coins de submissions, gastou 5 + 10 + 20 = 35 coins em mentoria, mas está mostrando **565 coins** em vez de **165 coins**.

**Causa Raiz**: **Produto Cartesiano nos LEFT JOINs**

A view `live_ranking` estava usando múltiplos `LEFT JOIN` que criam todas as combinações possíveis entre submissions, penalties e coin_adjustments, multiplicando os valores incorretamente.

## 📊 Exemplo do Problema

### Dados da Equipe:
- **2 submissions** avaliadas: 100 + 100 = 200 coins
- **3 ajustes** de mentor: -5, -10, -20 = -35 coins
- **Total esperado**: 200 - 35 = **165 coins**

### O que acontecia (ERRADO):
```sql
-- LEFT JOIN cria produto cartesiano: 2 submissions × 3 adjustments = 6 linhas!
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN coin_adjustments ca ON t.id = ca.team_id
```

**Resultado do GROUP BY:**
- `SUM(s.final_points)` = 100 aparece 3 vezes + 100 aparece 3 vezes = **600** ❌
- `SUM(ca.amount)` = (-5 + -10 + -20) aparece 2 vezes = **-70** ❌
- **Total**: 600 - 70 = **530 coins** (ERRADO!)

No seu caso específico (200 coins, 3 deduções):
- Se você tinha **4 submissions** de 50 coins cada
- Com 3 ajustes: 4 × 3 = 12 linhas
- SUM(submissions) = 50 × 12 = **600** coins (em vez de 200)
- SUM(ajustes) = (-35) × 4 = **-140** (mas cada ajuste aparece múltiplas vezes de forma irregular)
- Resultado: valores completamente errados como **565 coins**

## ✅ Solução Implementada

### Nova View (Corrigida):
```sql
CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  
  -- Subconsultas independentes (sem produto cartesiano)
  COALESCE(
    (SELECT SUM(s.final_points) 
     FROM submissions s 
     WHERE s.team_id = t.id AND s.status = 'evaluated'), 
    0
  ) 
  - COALESCE(
    (SELECT SUM(p.points_deduction) 
     FROM penalties p 
     WHERE p.team_id = t.id), 
    0
  ) 
  + COALESCE(
    (SELECT SUM(ca.amount) 
     FROM coin_adjustments ca 
     WHERE ca.team_id = t.id), 
    0
  ) as total_points,
  
  (SELECT COUNT(DISTINCT s.id) 
   FROM submissions s 
   WHERE s.team_id = t.id AND s.status = 'evaluated'
  ) as quests_completed,
  
  0 as power_ups_used
  
FROM teams t
WHERE t.email NOT IN (...)
ORDER BY total_points DESC;
```

### Por que funciona:
- **Cada subconsulta é independente**: não há produto cartesiano
- **SUM é calculado corretamente**: cada tabela é consultada separadamente
- **Não há duplicação de valores**: cada registro é contado apenas uma vez

## 🚀 Como Aplicar a Correção

### Passo 1: Abrir Supabase Dashboard
1. Ir para: **SQL Editor**
2. Criar nova query

### Passo 2: Executar o Fix
1. Abrir arquivo: `FIX_LIVE_RANKING_DUPLICATE_BUG.sql`
2. Copiar **TODO o conteúdo**
3. Colar no SQL Editor
4. Clicar em **Run** (ou Ctrl+Enter)

### Passo 3: Verificar Resultado
```sql
SELECT 
  team_name,
  total_points,
  quests_completed
FROM live_ranking
ORDER BY total_points DESC;
```

**Resultado esperado**: Equipe deve mostrar **165 coins** (200 - 5 - 10 - 20)

## 🧪 Verificação Detalhada (Opcional)

Se quiser confirmar os valores antes de aplicar o fix:

### 1. Identificar o team_id:
```sql
SELECT id, name FROM teams WHERE name LIKE '%nome_da_equipe%';
```

### 2. Executar diagnóstico completo:
- Abrir: `DEBUG_COINS_CALCULATION.sql`
- Substituir `'SEU_TEAM_ID'` pelo ID real
- Executar cada query para ver todas as transações

### 3. Comparar valores:
- **Cálculo manual** (query do PASSO 2)
- **Valor atual no ranking** (query do PASSO 3)
- Se estiverem diferentes = confirma o bug

## 📋 Arquivos Criados

### 1. `FIX_LIVE_RANKING_DUPLICATE_BUG.sql`
- **Propósito**: Corrigir a view `live_ranking`
- **Execução**: Supabase SQL Editor
- **Efeito**: Recria view sem JOINs duplicados

### 2. `DEBUG_COINS_CALCULATION.sql`
- **Propósito**: Diagnosticar valores incorretos
- **Execução**: Manual (substituir team_id)
- **Efeito**: Mostra todas as transações e cálculos

## ⚠️ Impacto da Correção

### Afeta:
- ✅ `live_ranking` view (corrigida)
- ✅ Dashboard da equipe (mostrará valor correto)
- ✅ Ranking ao vivo (valores corretos)
- ✅ Componente `AMFCoinsHistory` (usará dados corretos)

### NÃO afeta:
- ❌ Dados originais (submissions, coin_adjustments, penalties permanecem intactos)
- ❌ Funções (request_mentor continua funcionando)
- ❌ RLS policies (sem alterações)

## 🔬 Explicação Técnica

### Produto Cartesiano:
```
Team A tem:
- Submission 1: 100 coins
- Submission 2: 100 coins
- Adjustment 1: -5 coins
- Adjustment 2: -10 coins

LEFT JOIN cria:
Team A | Sub 1 (100) | Adj 1 (-5)
Team A | Sub 1 (100) | Adj 2 (-10)
Team A | Sub 2 (100) | Adj 1 (-5)
Team A | Sub 2 (100) | Adj 2 (-10)

SUM(final_points) = 100 + 100 + 100 + 100 = 400 (deveria ser 200!)
SUM(amount) = -5 + -10 + -5 + -10 = -30 (deveria ser -15!)
```

### Subconsultas Independentes:
```
SELECT 
  (SELECT SUM(final_points) FROM submissions WHERE team_id = A) -- = 200
  + 
  (SELECT SUM(amount) FROM coin_adjustments WHERE team_id = A) -- = -15
  = 185 ✅
```

## ✅ Checklist de Aplicação

- [ ] Identificar team_id da equipe afetada
- [ ] Executar `DEBUG_COINS_CALCULATION.sql` para confirmar bug
- [ ] Anotar valores esperados vs atuais
- [ ] Executar `FIX_LIVE_RANKING_DUPLICATE_BUG.sql` no Supabase
- [ ] Verificar nova view com `SELECT * FROM live_ranking`
- [ ] Confirmar que equipe agora mostra 165 coins
- [ ] Atualizar página do dashboard (hard refresh: Ctrl+F5)

---

**Status**: ✅ **Bug identificado e correção pronta**  
**Severidade**: 🔴 **Crítica** (afeta cálculo de pontos de todas as equipes)  
**Tempo para aplicar**: ⏱️ **2 minutos**  
**Risco**: 🟢 **Baixo** (apenas recria view, dados originais preservados)
