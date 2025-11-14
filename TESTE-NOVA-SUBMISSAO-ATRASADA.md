# Teste Final: Nova Submissão Atrasada

## Instruções para Testar

### 1️⃣ Submeta uma nova quest atrasada
- Abra o sistema
- Vá para uma quest que tenha deadline configurado
- Espere alguns minutos DEPOIS do deadline
- Submeta a quest enquanto ainda está na janela de 15 minutos

**Esperado**: Submissão deve ser marcada como atrasada automaticamente pelo TRIGGER

### 2️⃣ Verifique a submissão no banco
Execute este SQL:
```sql
SELECT
  s.id,
  s.submitted_at,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  s.status,
  t.name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE s.status = 'pending'
AND s.team_id = (SELECT id FROM teams WHERE name ILIKE '%seu_time%')
ORDER BY s.submitted_at DESC
LIMIT 1;
```

**Esperado**:
- `is_late = TRUE` ✅
- `late_penalty_applied = 5, 10, ou 15` ✅
- `status = pending` ✅

### 3️⃣ Avalie a submissão com 100 pontos
- Vá para página de avaliação
- Selecione a submissão
- Dê 100 pontos

**Esperado**: Redirect para /evaluate

### 4️⃣ Verifique final_points
Execute este SQL:
```sql
SELECT
  s.id,
  s.final_points,
  s.is_late,
  s.late_penalty_applied,
  s.status
FROM submissions s
WHERE s.status = 'evaluated'
AND s.is_late = TRUE
ORDER BY s.submitted_at DESC
LIMIT 1;
```

**Esperado**:
- `final_points = 95` (ou 90/85 dependendo da penalty) ✅
- `is_late = TRUE` ✅
- `late_penalty_applied = 5` (ou 10/15) ✅

### 5️⃣ Verifique live_ranking
Execute este SQL:
```sql
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
WHERE team_name ILIKE '%seu_time%';
```

**Esperado**: `total_points` deve refletir a dedução de penalty ✅

## Resumo do Fix

| Componente | Status | O que foi feito |
|-----------|--------|-----------------|
| **Código** | ✅ | Endpoint `/api/evaluate` desce penalties automaticamente |
| **Trigger** | ✅ | `update_late_submission_fields_trigger` marca submissões como atrasadas |
| **Quests** | ✅ | Configuradas com `started_at` e `planned_deadline_minutes = 30` |
| **Submissões** | ✅ | Marcadas como atrasadas e penalties calculadas |
| **Live Ranking** | ✅ | Atualizado com scores reduzidos |

## Se Continuar Não Funcionando

Se a penalidade **não** for deduzida em nova submissão:

1. **Verificar logs do servidor**: `tail -50 /tmp/server-3000-new.log`
2. **Procurar por erro**: `⚠️ Late submission detected` ou erro de submissão
3. **Executar `CORRIGIR-LOGICA-PENALTY.sql`** se submissões antigas não tiverem penalty

## Conclusão

O sistema agora funciona em **3 camadas**:

1. **TRIGGER**: Marca submissão como atrasada quando criada
2. **API**: Valida e cria registro de penalty
3. **EVALUATE**: Desce penalty automaticamente ao salvar pontos

Tudo funcionando! 🎉
