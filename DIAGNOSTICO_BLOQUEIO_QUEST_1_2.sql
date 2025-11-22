-- ============================================================================
-- DIAGNOSTICO_BLOQUEIO_QUEST_1_2.sql
-- ============================================================================
-- Verificar por que Quest 1.2 não aparece mesmo estando ativa
-- e se será liberada quando Quest 1.1 expirar
-- ============================================================================

SELECT '=== 1. ESTADO DO BANCO DE DADOS ===' as secao1;

SELECT 
  q.order_index as quest,
  q.name,
  q.status,
  q.started_at,
  ROUND(EXTRACT(EPOCH FROM (
    q.started_at + 
    (q.planned_deadline_minutes * INTERVAL '1 minute') + 
    (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute') - 
    NOW()
  )) / 60) as minutos_restantes,
  CASE
    WHEN q.started_at IS NULL THEN '❌ NÃO INICIADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN '✅ EXPIRADA'
    ELSE '⏳ ATIVA'
  END as situacao_banco
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index <= 2
ORDER BY q.order_index;

SELECT '' as espacador1;

SELECT '=== 2. LÓGICA DO FRONTEND (SubmissionWrapper.tsx) ===' as secao2;

SELECT 'O Frontend BLOQUEIA a visão de Quest 1.2 SE:' as regra;
SELECT '  ✗ Quest 1.1 NÃO foi submetida' as condicao1;
SELECT '  ✗ E Quest 1.1 NÃO expirou completamente' as condicao2;
SELECT '' as espacador2a;
SELECT 'Ou seja: Quest 1.2 só aparece se:' as regra2;
SELECT '  ✓ Quest 1.1 foi submetida OU' as opcao1;
SELECT '  ✓ Quest 1.1 expirou completamente' as opcao2;

SELECT '' as espacador2b;

SELECT '=== 3. ANÁLISE CURRENT STATE ===' as secao3;

DO $$
DECLARE
  v_q1_1_submitted BOOLEAN;
  v_q1_1_expired BOOLEAN;
  v_q1_1_minutes_remaining NUMERIC;
  v_q1_2_started BOOLEAN;
BEGIN
  -- Verificar se Quest 1.1 foi submetida
  SELECT EXISTS(
    SELECT 1 FROM submissions 
    WHERE quest_id IN (
      SELECT id FROM quests 
      WHERE order_index = 1 
      AND id IN (SELECT id FROM quests WHERE order_index = 1)
    )
  ) INTO v_q1_1_submitted;

  -- Verificar se Quest 1.1 expirou
  SELECT EXISTS(
    SELECT 1 FROM quests q
    WHERE order_index = 1 
    AND started_at IS NOT NULL
    AND NOW() > (q.started_at + INTERVAL '45 minutes')
  ) INTO v_q1_1_expired;

  -- Calcular minutos restantes de Quest 1.1
  SELECT ROUND(EXTRACT(EPOCH FROM (
    q.started_at + INTERVAL '45 minutes' - NOW()
  )) / 60)
  INTO v_q1_1_minutes_remaining
  FROM quests q
  WHERE order_index = 1;

  -- Verificar se Quest 1.2 foi iniciada no banco
  SELECT EXISTS(
    SELECT 1 FROM quests 
    WHERE order_index = 2 AND started_at IS NOT NULL
  ) INTO v_q1_2_started;

  RAISE NOTICE '';
  RAISE NOTICE '📊 ANÁLISE ATUAL:';
  RAISE NOTICE '';
  RAISE NOTICE 'Quest 1.1:';
  RAISE NOTICE '  Submetida?: %', v_q1_1_submitted;
  RAISE NOTICE '  Expirada?: %', v_q1_1_expired;
  RAISE NOTICE '  Minutos restantes: %', v_q1_1_minutes_remaining;
  RAISE NOTICE '';
  RAISE NOTICE 'Quest 1.2:';
  RAISE NOTICE '  Iniciada no banco?: %', v_q1_2_started;
  RAISE NOTICE '';
  RAISE NOTICE '🔍 CONCLUSÃO:';
  
  IF v_q1_2_started AND NOT v_q1_1_submitted AND NOT v_q1_1_expired THEN
    RAISE NOTICE '❌ Quest 1.2 está ativa no banco MAS bloqueada no frontend!';
    RAISE NOTICE '   Motivo: Quest 1.1 não foi submetida E não expirou ainda';
    RAISE NOTICE '';
    RAISE NOTICE '✅ SOLUÇÃO: Quando Quest 1.1 expirar em % min:', ROUND(v_q1_1_minutes_remaining);
    RAISE NOTICE '   → Frontend liberará automaticamente a visão de Quest 1.2';
  ELSIF v_q1_1_expired THEN
    RAISE NOTICE '✅ Quest 1.1 JÁ EXPIROU!';
    RAISE NOTICE '   Frontend DEVE estar mostrando Quest 1.2 agora';
  ELSIF v_q1_1_submitted THEN
    RAISE NOTICE '✅ Quest 1.1 FOI SUBMETIDA!';
    RAISE NOTICE '   Frontend DEVE estar mostrando Quest 1.2 agora';
  ELSE
    RAISE NOTICE '⏳ Quest 1.1 ainda em andamento...';
    RAISE NOTICE '   Aguarde % minutos para expirar', ROUND(v_q1_1_minutes_remaining);
  END IF;

END $$;

SELECT '' as espacador3;

SELECT '=== 4. O QUE ACONTECEU ===' as secao4;

SELECT '📌 Resumo do Problema:' as titulo;
SELECT '  1. A função auto_start_next_quest() avançava por SUBMISSÃO (bug)' as ponto1;
SELECT '  2. Quest 1.2 foi ativada quando equipe submete 1.1 (indevido)' as ponto2;
SELECT '  3. Quest 1.2 ficou ativa no banco, mas invisible no frontend' as ponto3;
SELECT '  4. Frontend bloqueia porque 1.1 não expirou ainda' as ponto4;
SELECT '' as espacador4a;
SELECT '✅ Solução Aplicada:' as solucao;
SELECT '  • FIX_ADVANCE_ONLY_TIME.sql: Muda função para avançar POR TEMPO' as sol1;
SELECT '  • Agora Quest 1.2 SÓ ativa quando 1.1 expirar (correto)' as sol2;
SELECT '' as espacador4b;
SELECT '🎯 Resultado Esperado:' as resultado;
SELECT '  • Quest 1.1 expira em ~1 minuto (após REGREDIR_QUEST_1_1_PARA_1MIN.sql)' as res1;
SELECT '  • Quest 1.2 é ativada automaticamente pelo CRON' as res2;
SELECT '  • Frontend libera visão de Quest 1.2' as res3;
SELECT '  • Equipe vê Quest 1.2 normalmente' as res4;
