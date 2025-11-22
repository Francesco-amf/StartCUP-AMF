-- ⚡ REVERTER PARA FASE 1 - EMERGÊNCIA
-- O sistema avançou para Fase 2 prematuramente

-- 1️⃣ VERIFICAR ESTADO ATUAL
SELECT 
  current_phase as "Fase Atual",
  phase_1_start_time as "F1 Start",
  phase_2_start_time as "F2 Start"
FROM event_config;

-- 2️⃣ VOLTAR PARA FASE 1
UPDATE event_config
SET current_phase = 1,
    phase_2_start_time = NULL;  -- Limpar timestamp da Fase 2

-- 3️⃣ FECHAR TODAS AS QUESTS DA FASE 2
UPDATE quests
SET status = 'pending',
    started_at = NULL
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2);

-- 4️⃣ REABRIR FASE 1 (se necessário)
UPDATE quests
SET status = 'active'
WHERE id = (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1
    AND q.order_index = 4  -- BOSS 1.4
  LIMIT 1
);

-- 5️⃣ CONFIRMAR
SELECT 
  current_phase as "Fase Atual",
  phase_1_start_time as "F1 Start",
  phase_2_start_time as "F2 Start (deve ser NULL)"
FROM event_config;

SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name,
  q.status,
  q.started_at
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index IN (1, 2)
ORDER BY p.order_index, q.order_index;
