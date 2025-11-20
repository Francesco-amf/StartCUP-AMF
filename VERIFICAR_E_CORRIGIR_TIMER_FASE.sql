-- ==================================================
-- VERIFICAR E CORRIGIR Timer da Fase (zerado)
-- ==================================================

-- 1. Ver estado atual da event_config
SELECT 
  current_phase,
  event_status,
  phase_1_start_time,
  phase_2_start_time,
  phase_3_start_time,
  phase_4_start_time,
  phase_5_start_time
FROM event_config;

-- 2. Ver quando a Fase 2 realmente começou (baseado na primeira quest iniciada)
SELECT 
  q.name,
  q.order_index,
  q.started_at,
  p.duration_minutes as fase_duracao
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.started_at IS NOT NULL
ORDER BY q.started_at ASC
LIMIT 1;

-- 3. CORRIGIR: Setar phase_2_start_time baseado na primeira quest
-- (Use o valor de started_at da query acima)
-- Exemplo: Se Quest 2.1 começou às 14:30:00
UPDATE event_config
SET phase_2_start_time = (
  SELECT MIN(q.started_at)
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2
    AND q.started_at IS NOT NULL
);

-- 4. Verificar se corrigiu
SELECT 
  current_phase,
  phase_2_start_time,
  NOW() as agora,
  EXTRACT(EPOCH FROM (NOW() - phase_2_start_time)) / 60 as minutos_decorridos
FROM event_config;

-- ✅ Timer da Fase 2 deve voltar a funcionar
-- ✅ Mostrará tempo decorrido desde o início real da fase
