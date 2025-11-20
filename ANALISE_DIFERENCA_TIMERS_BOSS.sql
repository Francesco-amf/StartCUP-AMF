-- ==================================================
-- INVESTIGAÇÃO: Diferença de timers Boss (apenas análise)
-- ==================================================
-- Situação: Boss mostrava 5 min na live e ~30s na página da equipe
-- Após refresh: sincronizou
-- ==================================================

-- 1. Ver configuração exata do Boss 2.4
SELECT 
  q.id,
  q.name,
  q.started_at,
  q.planned_deadline_minutes,
  q.duration_minutes,
  q.late_submission_window_minutes,
  -- Calcular deadline baseado em planned_deadline
  CASE 
    WHEN q.started_at IS NOT NULL AND q.planned_deadline_minutes IS NOT NULL THEN
      q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')
    WHEN q.started_at IS NOT NULL AND q.duration_minutes IS NOT NULL THEN
      q.started_at + (q.duration_minutes * INTERVAL '1 minute')
    ELSE NULL
  END as deadline_calculado,
  -- Tempo restante agora
  CASE 
    WHEN q.started_at IS NOT NULL AND q.planned_deadline_minutes IS NOT NULL THEN
      EXTRACT(EPOCH FROM (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') - NOW())) / 60
    WHEN q.started_at IS NOT NULL AND q.duration_minutes IS NOT NULL THEN
      EXTRACT(EPOCH FROM (q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW())) / 60
    ELSE NULL
  END as minutos_restantes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.order_index = 4;

-- ==================================================
-- ANÁLISE DO PROBLEMA
-- ==================================================
-- Possíveis causas da diferença de timers:
--
-- 1. CACHE DO NAVEGADOR:
--    - Live dashboard: Cache mais antigo com started_at incorreto
--    - Página equipe: Cache desatualizado
--    - Refresh forçou busca de dados atualizados
--
-- 2. POLLING DESINCRONIZADO:
--    - Live: polling de 500ms pode ter pegado dados diferentes
--    - Equipe: polling diferente ou disabled
--
-- 3. CAMPOS DIFERENTES:
--    - Live usa: planned_deadline_minutes
--    - Equipe usa: deadlineMinutes (prop passada)
--    - Se valores diferentes → timers diferentes
--
-- 4. TIMEZONE:
--    - started_at pode ter sido interpretado em timezones diferentes
--    - Live: UTC
--    - Equipe: Local time
--    - Diferença de 4-5 min seria timezone offset parcial
--
-- 5. UPDATES CONCORRENTES:
--    - Boss foi desativado/reativado durante troubleshooting
--    - Live pegou started_at antigo
--    - Equipe pegou started_at novo
--    - Refresh sincronizou ambos
--
-- ==================================================
-- CONCLUSÃO MAIS PROVÁVEL:
-- ==================================================
-- Durante os SQLs de DESATIVAR_BOSS e FIX_BOSS_AUTO_ACTIVATION,
-- o Boss teve started_at modificado múltiplas vezes.
-- 
-- Live dashboard tinha cached o started_at ORIGINAL (16:30)
-- Página equipe tinha cached started_at MODIFICADO
-- 
-- Refresh limpou cache e ambos buscaram mesmo valor atual do DB
-- ==================================================
