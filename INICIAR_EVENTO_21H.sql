-- 🚀 INICIAR EVENTO - EXECUTAR ÀS 21:00 BRT (21 NOV 2025)
-- =====================================================
-- Cronograma: 21:00 BRT (21 NOV) até 09:20 BRT (22 NOV)
-- Duração: 12 horas 20 minutos (740 minutos)
-- Total de quests: 720 min + 20 min avaliação = 740 min

-- PASSO 1: Definir event_end_time = NOW() + 12h 20min
-- Resolve o NULL que estava em event_end_time
UPDATE event_config 
SET event_end_time = NOW() + INTERVAL '12 hours 20 minutes'
WHERE id = (SELECT id FROM event_config LIMIT 1);

-- PASSO 2: ✅ VERIFICAR que event_end_time foi definido
SELECT 
  'event_end_time' as "Campo",
  event_end_time as "Valor UTC",
  TO_CHAR(event_end_time, 'HH24:MI:SS DD/MM/YYYY') as "Formato legível",
  (event_end_time - NOW()) as "Tempo até término",
  TO_CHAR((event_end_time - NOW()), 'HH24:MI:SS') as "Em horas:min:seg"
FROM event_config;

-- PASSO 3: Ativar evento (Phase 1 + event_started = true)
-- Vai disparar o CRON para auto-ativar Quest 1.1
UPDATE event_config 
SET current_phase = 1, event_started = true
WHERE id = (SELECT id FROM event_config LIMIT 1);

-- PASSO 4: ✅ STATUS FINAL - EVENTO LIVE
SELECT 
  '🎬 EVENTO INICIADO' as "Status",
  current_phase as "Phase Ativa",
  event_started as "Event Started",
  TO_CHAR(NOW(), 'HH24:MI:SS DD/MM/YYYY') as "Início",
  TO_CHAR(event_end_time, 'HH24:MI:SS DD/MM/YYYY') as "Término",
  TO_CHAR((event_end_time - NOW()), 'HH24:MI:SS') as "Duração Total"
FROM event_config;

-- 🟢 PRONTO PARA GO! 
-- ✅ event_end_time = NOW() + 12h 20min (NULL resolvido)
-- ✅ Phase 1 ativada
-- ✅ event_started = true
-- ✅ CRON vai auto-ativar Quest 1.1 no próximo minuto
-- ✅ Sistema rodará automaticamente por 12h 20min
