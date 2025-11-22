-- =====================================================
-- 🚨 EMERGÊNCIA: PAUSAR AUTO-ADVANCE DESCONTROLADO
-- =====================================================

-- PASSO 1: Desabilitar CRON Jobs que estão causando avanço duplo
SELECT cron.unschedule('auto-start-next-quest-job');
SELECT cron.unschedule('auto-advance-phase-job');

SELECT '✅ Cron jobs desabilitados!' as status;

-- PASSO 2: Verificar qual equipe avançou
SELECT 
  't.name as "Equipe",
  COUNT(DISTINCT s.quest_id) as "Quests com submissão",
  STRING_AGG(DISTINCT CONCAT(p.order_index, '.', q.order_index), ' → ' ORDER BY CONCAT(p.order_index, '.', q.order_index)) as "Sequência"
FROM teams t
JOIN submissions s ON t.id = s.team_id
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
GROUP BY t.id, t.name
HAVING COUNT(DISTINCT s.quest_id) > 1;

-- PASSO 3: RESETAR STATE DAS QUESTS (REMOVER AVANÇOSDUPLICADOS)
-- ⚠️ Marcar quests ativas múltiplas como "closed" (exceto a quest atual que deveria estar ativa)

SELECT 
  'ANTES DE EXECUTAR, VERIFIQUE OS RESULTADOS ACIMA!' as "⚠️ AVISO";

-- PASSO 4 (OPCIONAL): Se precisar desfazer submissões recentes de uma equipe:
-- DELETE FROM submissions WHERE team_id = 'ID_DA_EQUIPE_AQUI' AND quest_id = 'ID_QUEST_QUE_NAODEVERIA_TER_SUBMETIDO';

-- PASSO 5: Verificar configuração de FASE
SELECT 
  current_phase,
  event_started,
  (SELECT name FROM phases WHERE order_index = current_phase LIMIT 1) as "Fase Ativa",
  COUNT(*) FILTER (WHERE is_active = true) as "Quests Ativas"
FROM event_config, quests
GROUP BY current_phase, event_started;

SELECT '✅ Sistema pausado. Aguardando instruções!' as status;
