-- ============================================================
-- REMOVER APENAS BOSS FINAL (Fase 5, Quest 5.4)
-- ============================================================
-- O Boss Final (Pitch Oficial) não faz parte do projeto
-- Após Quest 5.3, o evento termina presencialmente com Game Over
-- MANTER Boss nas Fases 1-4 (apresentações normais)
-- ============================================================

-- ============================================================
-- PARTE 1: Verificar Boss Final Existente
-- ============================================================

-- Ver APENAS o Boss da Fase 5 (Boss Final)
SELECT 
  p.order_index as fase,
  p.name as fase_nome,
  q.order_index as quest_order,
  q.name as quest_nome,
  q.max_points,
  q.status,
  CASE 
    WHEN q.started_at IS NOT NULL THEN 'SIM'
    ELSE 'NÃO'
  END as foi_iniciada
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4
  AND p.order_index = 5  -- APENAS Fase 5
ORDER BY p.order_index;

-- Ver todos os Boss (para conferência)
SELECT 
  p.order_index as fase,
  q.name as quest_nome,
  q.max_points
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4
ORDER BY p.order_index;

-- ============================================================
-- PARTE 2: Deletar APENAS Boss Final (Fase 5)
-- ============================================================

-- AVISO: Isso vai deletar permanentemente APENAS o Boss da Fase 5
-- Boss das Fases 1-4 serão MANTIDOS!

/*
-- Primeiro, deletar submissões relacionadas ao Boss Final
DELETE FROM submissions
WHERE quest_id IN (
  SELECT q.id 
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE q.order_index = 4 AND p.order_index = 5
);

-- Depois, deletar APENAS o Boss Final (Fase 5)
DELETE FROM quests
WHERE id IN (
  SELECT q.id 
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE q.order_index = 4 AND p.order_index = 5
);
*/

-- ============================================================
-- ALTERNATIVA: Ocultar Boss Final (Sem Deletar)
-- ============================================================

-- Se preferir manter os dados mas ocultar do sistema:

/*
-- Marcar como 'inactive' (nunca será iniciado)
UPDATE quests
SET status = 'inactive'
WHERE id IN (
  SELECT q.id 
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE q.order_index = 4 AND p.order_index = 5
);
*/

-- ============================================================
-- PARTE 3: Verificar Resultado
-- ============================================================

-- Após executar, verificar Boss por fase
SELECT 
  p.order_index as fase,
  p.name as fase_nome,
  COUNT(*) as total_quests,
  COUNT(CASE WHEN q.order_index = 4 THEN 1 END) as boss_quests
FROM phases p
JOIN quests q ON q.phase_id = p.id
GROUP BY p.order_index, p.name
ORDER BY p.order_index;

-- Resultado esperado:
-- Fase 1: 4 quests (3 normais + 1 Boss) ✅
-- Fase 2: 4 quests (3 normais + 1 Boss) ✅
-- Fase 3: 4 quests (3 normais + 1 Boss) ✅
-- Fase 4: 4 quests (3 normais + 1 Boss) ✅
-- Fase 5: 3 quests (3 normais, SEM Boss) ✅

-- ============================================================
-- PARTE 4: Verificar Quest Final (5.3)
-- ============================================================

-- Quest 5.3 será a ÚLTIMA quest do evento
SELECT 
  p.name as fase,
  q.order_index,
  q.name as quest_nome,
  q.max_points,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index;

-- ============================================================
-- ROLLBACK (Se Precisar Restaurar)
-- ============================================================

-- NÃO HÁ ROLLBACK AUTOMÁTICO APÓS DELETE!
-- Se deletou por engano, precisará recriar manualmente
-- ou restaurar backup do banco

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================

/*
APÓS REMOVER BOSS FINAL (Fase 5):

1. ✅ Fases 1-4: Mantêm Boss (apresentações presenciais)
   - Cada uma com 4 quests total (3 normais + 1 Boss)

2. ✅ Fase 5: Apenas 3 quests (SEM Boss Final)
   - Quest 5.3 será a ÚLTIMA quest do evento

3. ✅ Event_end_time será baseado na Quest 5.3
   - Trigger adjust_event_end_time_trigger já implementado

4. ✅ Game Over mostrará vencedor após período de avaliação
   - Sistema já implementado (FIX_PERIODO_AVALIACAO.sql)

5. ⚠️ Frontend: BossQuestCard ainda será usado nas Fases 1-4
   - Precisamos REVERTER as mudanças em SubmissionWrapper.tsx!

6. ⚠️ Se houver submissões em Boss Final, delete-as primeiro

7. ⚠️ Faça backup antes de executar DELETE!
*/
