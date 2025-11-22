-- 🧪 AUDITORIA: Verificar se botões do ManualQuestControl funcionaram

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1️⃣ VERIFICAR QUEST ATUAL - Todos os campos devem estar sincronizados
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome da Quest",
  q.status as "Status",
  to_char(q.started_at, 'HH24:MI:SS') as "Hora Início",
  q.duration_minutes as "Duration (min)",
  q.planned_deadline_minutes as "Planned Deadline (min)",
  -- Verificar sincronização
  CASE 
    WHEN q.duration_minutes = q.planned_deadline_minutes THEN '✅ SINC'
    WHEN q.planned_deadline_minutes IS NULL THEN '⚠️ NULL'
    ELSE '❌ DESSINC'
  END as "Sync Status",
  -- Tempo decorrido
  CASE 
    WHEN q.started_at IS NOT NULL THEN
      ROUND(EXTRACT(EPOCH FROM (NOW() - q.started_at)) / 60, 1)
    ELSE NULL
  END as "Min Decorridos",
  -- Tempo restante
  CASE 
    WHEN q.started_at IS NOT NULL AND q.duration_minutes IS NOT NULL THEN
      ROUND(EXTRACT(EPOCH FROM ((q.started_at + (q.duration_minutes * INTERVAL '1 minute')) - NOW())) / 60, 1)
    ELSE NULL
  END as "Min Restantes"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.status IN ('active', 'paused')
ORDER BY p.order_index, q.order_index;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2️⃣ VERIFICAR HISTÓRICO DE MUDANÇAS - Últimas 10 quests modificadas
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  to_char(q.started_at, 'DD/MM HH24:MI:SS') as "Iniciou Em",
  q.duration_minutes as "Duration",
  q.planned_deadline_minutes as "Planned",
  CASE 
    WHEN q.duration_minutes = q.planned_deadline_minutes THEN '✅'
    WHEN q.planned_deadline_minutes IS NULL THEN '⚠️'
    ELSE '❌'
  END as "OK?"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.started_at IS NOT NULL
ORDER BY q.started_at DESC
LIMIT 10;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3️⃣ VERIFICAR QUESTS COM PROBLEMAS - Devem estar vazias após correções
-- ═══════════════════════════════════════════════════════════════════════════════

-- Quests com planned_deadline_minutes = NULL (PROBLEMA)
SELECT 
  '❌ NULL planned_deadline' as "Tipo Problema",
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.duration_minutes as "Duration",
  q.planned_deadline_minutes as "Planned"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.started_at IS NOT NULL 
  AND q.planned_deadline_minutes IS NULL

UNION ALL

-- Quests com duration != planned_deadline (DESSINC)
SELECT 
  '❌ Duration ≠ Planned' as "Tipo Problema",
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.duration_minutes as "Duration",
  q.planned_deadline_minutes as "Planned"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.started_at IS NOT NULL 
  AND q.duration_minutes != q.planned_deadline_minutes

ORDER BY "Fase", "Quest";


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4️⃣ TESTAR BOTÃO: +10 MINUTOS (addTime)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Antes de clicar em "+10 min", anote:
-- - Duration atual: ______
-- - Planned atual: ______

-- Depois de clicar em "+10 min", execute novamente query #1
-- Espera-se:
-- ✅ started_at deve MUDAR (diminuir 10 min)
-- ✅ duration_minutes deve AUMENTAR +10
-- ✅ planned_deadline_minutes deve AUMENTAR +10
-- ✅ Tempo restante deve AUMENTAR ~10 min


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5️⃣ TESTAR BOTÃO: -10 MINUTOS (addTime com valor negativo)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Antes de clicar em "-10 min", anote:
-- - Duration atual: ______
-- - Planned atual: ______

-- Depois de clicar em "-10 min", execute novamente query #1
-- Espera-se:
-- ✅ started_at deve MUDAR (aumentar 10 min)
-- ✅ duration_minutes deve DIMINUIR -10
-- ✅ planned_deadline_minutes deve DIMINUIR -10
-- ✅ Tempo restante deve DIMINUIR ~10 min


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6️⃣ TESTAR BOTÃO: ⏸️ PAUSAR (pauseQuest)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Antes de pausar, anote quest ativa e tempo restante
-- Depois de clicar em "⏸️ PAUSAR", execute query #1
-- Espera-se:
-- ✅ status deve mudar para 'paused'
-- ✅ Timer deve PARAR de diminuir


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7️⃣ TESTAR BOTÃO: ▶️ RETOMAR (resumeQuest)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Com quest pausada, clicar em "▶️ RETOMAR"
-- Espera-se:
-- ✅ status deve mudar para 'active'
-- ✅ started_at deve SER AJUSTADO (NOW - tempo já decorrido)
-- ✅ planned_deadline_minutes deve ESTAR SETADO (não NULL)
-- ✅ Timer deve VOLTAR a diminuir


-- ═══════════════════════════════════════════════════════════════════════════════
-- 8️⃣ TESTAR BOTÃO: 🚀 AVANÇAR PARA PRÓXIMA FASE (advancePhase)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ANTES de clicar, verificar fase atual:
SELECT 
  current_phase as "Fase Atual",
  event_status as "Status Evento",
  phase_started_at as "Fase Iniciou"
FROM event_config;

-- Depois de clicar em "🚀 AVANÇAR PARA FASE X":
-- Execute query acima novamente
-- Espera-se:
-- ✅ current_phase deve AUMENTAR +1
-- ✅ phase_started_at deve ser NOW()
-- ✅ Quest X.1 deve estar 'active'
-- ✅ Quest X.1 deve ter planned_deadline_minutes setado


-- ═══════════════════════════════════════════════════════════════════════════════
-- 9️⃣ TESTAR BOTÃO: ▶️ ATIVAR QUEST (activateQuest)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Com quest 'scheduled', clicar em "▶️ ATIVAR QUEST X"
-- Execute query #1
-- Espera-se:
-- ✅ status deve mudar para 'active'
-- ✅ started_at deve ser NOW()
-- ✅ duration_minutes deve estar preenchido
-- ✅ planned_deadline_minutes = duration_minutes
-- ✅ Timer deve começar a diminuir


-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔟 TIMESTAMP DO SERVIDOR (para comparar com frontend)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  NOW() as "Servidor UTC",
  to_char(NOW(), 'HH24:MI:SS') as "Hora UTC",
  EXTRACT(EPOCH FROM NOW()) as "Unix Timestamp";


-- ═══════════════════════════════════════════════════════════════════════════════
-- 📋 CHECKLIST DE CORREÇÕES APLICADAS
-- ═══════════════════════════════════════════════════════════════════════════════

/*
COMMIT 5c75067: "fix: corrige todos botões ManualQuestControl"

✅ activateQuest()
   - Seta planned_deadline_minutes = duration_minutes ao ativar

✅ addTime(minutes)
   - Atualiza started_at (ajusta para manter deadline)
   - Atualiza duration_minutes
   - Atualiza planned_deadline_minutes

✅ advancePhase()
   - Usa endpoint /api/admin/start-phase-with-quests
   - Mesmo código que PhaseController (working)

✅ resumeQuest()
   - Ajusta started_at considerando tempo decorrido
   - Seta planned_deadline_minutes ao retomar

✅ pauseQuest()
   - Simples mudança de status (já funcionava)

✅ closeCurrentQuest()
   - Simples mudança de status (já funcionava)
*/


-- ═══════════════════════════════════════════════════════════════════════════════
-- 🎯 INSTRUÇÕES DE TESTE
-- ═══════════════════════════════════════════════════════════════════════════════

/*
PASSO A PASSO:

1. Execute query #1 (Quest Atual) e anote valores
2. No Admin Panel, clique em um botão
3. Execute query #1 novamente
4. Compare os valores ANTES e DEPOIS
5. Verifique se mudanças correspondem ao esperado

VALORES ESPERADOS:

+10 min:
  - started_at: 10 min ANTES (ex: 14:00:00 → 13:50:00)
  - duration: +10 (ex: 60 → 70)
  - planned_deadline: +10 (ex: 60 → 70)
  - Tempo restante: ~+10 min

-10 min:
  - started_at: 10 min DEPOIS (ex: 14:00:00 → 14:10:00)
  - duration: -10 (ex: 60 → 50)
  - planned_deadline: -10 (ex: 60 → 50)
  - Tempo restante: ~-10 min

PAUSAR:
  - status: 'active' → 'paused'
  - started_at, duration, planned: SEM MUDANÇA

RETOMAR:
  - status: 'paused' → 'active'
  - started_at: AJUSTADO (NOW - tempo decorrido antes de pausar)
  - planned_deadline: SETADO (não NULL)

ATIVAR QUEST:
  - status: 'scheduled' → 'active'
  - started_at: NOW()
  - planned_deadline = duration

AVANÇAR FASE:
  - event_config.current_phase: +1
  - event_config.phase_started_at: NOW()
  - Quest X.1: status='active', planned_deadline setado
*/
