-- ============================================================================
-- TESTE: Reduzir deadline das quests da Fase 5 para 1 minuto
-- ============================================================================

-- Ver deadlines atuais da Fase 5
SELECT 
  order_index,
  name,
  status,
  planned_deadline_minutes,
  duration_minutes,
  started_at,
  CASE 
    WHEN status = 'active' AND started_at IS NOT NULL 
    THEN started_at + (planned_deadline_minutes * INTERVAL '1 minute')
    ELSE NULL
  END as deadline_calculado
FROM quests
WHERE phase_id = 5
ORDER BY order_index;

-- Reduzir deadline para 1 minuto (para testar auto-advance rápido)
UPDATE quests
SET 
  planned_deadline_minutes = 1,
  duration_minutes = 1
WHERE phase_id = 5;

-- Verificar mudanças
SELECT 
  order_index,
  name,
  status,
  planned_deadline_minutes,
  duration_minutes,
  started_at,
  CASE 
    WHEN status = 'active' AND started_at IS NOT NULL 
    THEN started_at + (planned_deadline_minutes * INTERVAL '1 minute')
    ELSE NULL
  END as deadline_calculado,
  CASE 
    WHEN status = 'active' AND started_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM ((started_at + (planned_deadline_minutes * INTERVAL '1 minute')) - NOW())) || ' segundos restantes'
    ELSE 'N/A'
  END as tempo_restante
FROM quests
WHERE phase_id = 5
ORDER BY order_index;

SELECT '✅ Deadlines da Fase 5 reduzidos para 1 minuto' as status;
SELECT '⏰ Quest ativa vai expirar em ~1 minuto' as info;
SELECT '🧪 Aguarde para ver auto-advance Quest 5.2 → 5.3' as teste;
