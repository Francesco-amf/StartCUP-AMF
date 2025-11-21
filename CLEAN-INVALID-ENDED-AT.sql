-- ============================================================================
-- LIMPEZA URGENTE: Remover ended_at inválido de quests não finalizadas
-- ============================================================================
-- PROBLEMA: Quests que nunca foram iniciadas (started_at = NULL) ou que
--           estão ativas têm ended_at preenchido com valores antigos de testes
-- SOLUÇÃO: Limpar ended_at de todas as quests que:
--   1. Ainda não iniciaram (status = 'scheduled' E started_at IS NULL)
--   2. Estão ativas (status = 'active')
-- ============================================================================

-- BACKUP: Ver dados antes da limpeza
SELECT 
  phase_id,
  order_index,
  name,
  status,
  started_at,
  ended_at,
  CASE 
    WHEN status = 'scheduled' AND ended_at IS NOT NULL THEN '❌ LIXO (não iniciou mas tem ended_at)'
    WHEN status = 'active' AND ended_at IS NOT NULL THEN '❌ LIXO (ativa mas tem ended_at)'
    WHEN status = 'closed' AND ended_at IS NULL THEN '⚠️ PROBLEMA (fechada sem ended_at)'
    ELSE '✅ OK'
  END as diagnostico
FROM quests
ORDER BY phase_id, order_index;

-- LIMPEZA 1: Remover ended_at de quests agendadas que nunca iniciaram
UPDATE quests
SET ended_at = NULL
WHERE status = 'scheduled' 
  AND started_at IS NULL
  AND ended_at IS NOT NULL;

-- LIMPEZA 2: Remover ended_at de quests ativas
UPDATE quests
SET ended_at = NULL
WHERE status = 'active'
  AND ended_at IS NOT NULL;

-- VERIFICAÇÃO PÓS-LIMPEZA
SELECT 
  phase_id,
  order_index,
  name,
  status,
  started_at,
  ended_at,
  CASE 
    WHEN status = 'scheduled' AND ended_at IS NOT NULL THEN '❌ AINDA TEM PROBLEMA'
    WHEN status = 'active' AND ended_at IS NOT NULL THEN '❌ AINDA TEM PROBLEMA'
    WHEN status = 'closed' AND ended_at IS NULL THEN '⚠️ FECHADA SEM ended_at'
    ELSE '✅ OK'
  END as resultado
FROM quests
ORDER BY phase_id, order_index;
