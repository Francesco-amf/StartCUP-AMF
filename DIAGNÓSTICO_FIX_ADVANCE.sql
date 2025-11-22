-- ============================================================================
-- DIAGNÓSTICO_FIX_ADVANCE.sql
-- ============================================================================
-- Comparação ANTES vs DEPOIS da correção
-- Mostrar impacto da mudança na lógica de avanço

SELECT 'ANTES (PROBLEMA)' as diagnostico;
SELECT '❌ LÓGICA INCORRETA:' as ponto;
SELECT '   v_current_quest_finished := v_current_quest_expired OR v_current_quest_submitted;' as detalhe;
SELECT '   Quest avança SE:' as condicao;
SELECT '     - Expirou por prazo OU' as opcao_1;
SELECT '     - Alguma equipe fez submissão ⚠️ PROBLEMA AQUI' as opcao_2;
SELECT '   Resultado: Team jumparia quest quando fez entrega' as resultado;

SELECT '' as espacador;

SELECT 'DEPOIS (CORRIGIDO)' as diagnostico;
SELECT '✅ LÓGICA CORRIGIDA:' as ponto;
SELECT '   v_current_quest_finished := v_current_quest_expired;' as detalhe;
SELECT '   Quest avança APENAS SE:' as condicao;
SELECT '     - Expirou por prazo (chegou fim do deadline + late window)' as opcao_unica;
SELECT '   Resultado: Múltiplas equipes podem submeter em paralelo sem pular quest' as resultado;

SELECT '' as espacador2;

SELECT 'IMPACTO DA MUDANÇA' as titulo_impacto;
SELECT '1. Equipes podem submeter a qualquer hora dentro do prazo' as impacto_1;
SELECT '2. Quest avança de forma determinística (por tempo, não por ação)' as impacto_2;
SELECT '3. Todas as equipes veem a quest até prazo expirar' as impacto_3;
SELECT '4. CRON job auto_start_next_quest() controla o avanço' as impacto_4;
SELECT '5. Sem más interações com frontend (QuestAutoAdvancer)' as impacto_5;

SELECT '' as espacador3;

SELECT 'COMPORTAMENTO ESPERADO' as comportamento_titulo;
SELECT '⏳ FASE 1 - QUEST 1.1 (30 min + 15 min atraso = 45 min total):' as timeline_1;
SELECT '   00:00 - Quest começa' as tempo_1;
SELECT '   00:01-00:30 - Equipes podem submeter (prazo regular)' as tempo_2;
SELECT '   00:30-00:45 - Equipes podem submeter com penalidade (janela de atraso)' as tempo_3;
SELECT '   00:45:01 - Quest 1.1 expira, Quest 1.2 é ativada automaticamente' as tempo_4;
SELECT '   ✅ Apenas prazo controla avanço, não submissão' as resultado_timing;

SELECT '' as espacador4;

-- Ver quests atuais e seus prazos
SELECT 'CONFIGURAÇÃO ATUAL DE QUESTS:' as debug_title;
SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.planned_deadline_minutes as prazo_min,
  q.late_submission_window_minutes as atraso_min,
  COALESCE(q.planned_deadline_minutes, 0) + COALESCE(q.late_submission_window_minutes, 0) as total_min,
  q.status,
  q.started_at,
  CASE 
    WHEN q.started_at IS NULL THEN '❌ Não iniciada'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN '⏸️ EXPIRADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '⚠️ ATRASADA'
    ELSE '✅ ATIVA'
  END as situacao
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = (SELECT COALESCE(current_phase, 1) FROM event_config LIMIT 1)
ORDER BY p.order_index, q.order_index;

SELECT '' as espacador5;
SELECT 'FIM DO DIAGNÓSTICO - Aguardando execução de FIX_ADVANCE_ONLY_TIME.sql' as final_msg;
