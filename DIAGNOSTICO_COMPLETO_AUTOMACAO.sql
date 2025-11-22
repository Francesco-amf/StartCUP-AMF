-- 📋 DIAGNÓSTICO COMPLETO DO SISTEMA DE AUTOMAÇÃO

-- 1️⃣ VER STATUS DE TODOS OS CRON JOBS
SELECT 
  jobname as "Nome do Job",
  schedule as "Schedule",
  active as "Ativo?",
  command as "Comando",
  CASE 
    WHEN jobname = 'auto-advance-phase-job' AND active THEN '✅ Avança fases quando todas quests expiraram'
    WHEN jobname = 'auto-start-next-quest-job' AND active THEN '⚠️ ATIVA PRÓXIMA QUEST (TEM BUG!)'
    WHEN jobname = 'auto-start-next-quest-job' AND NOT active THEN '❌ DESATIVADO (você desativou por causa do bug)'
    WHEN jobname = 'check-evaluations-complete' AND active THEN '✅ Verifica avaliações a cada 30s'
    ELSE '❓ Outro job'
  END as "Função e Status"
FROM cron.job
ORDER BY jobname;

-- 2️⃣ VER ESTADO ATUAL DAS QUESTS DA FASE 2
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.duration_minutes as "Duração",
  q.started_at as "Iniciou em",
  CASE 
    WHEN q.started_at IS NOT NULL 
    THEN ROUND(EXTRACT(EPOCH FROM (
      q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW()
    )) / 60) 
    ELSE NULL 
  END as "Min Restantes",
  CASE 
    WHEN q.status = 'active' AND q.order_index = 1 THEN '▶️ RODANDO AGORA (10min restantes)'
    WHEN q.status = 'closed' THEN '✅ Fechada'
    WHEN q.status = 'scheduled' THEN '📅 Aguardando'
    ELSE '❓ Estado desconhecido'
  END as "Estado Esperado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- 3️⃣ VER PRÓXIMAS AÇÕES NECESSÁRIAS
SELECT 
  '🎯 Quest 2.1' as "Ação Atual",
  'Expira em ~10 minutos' as "Quando",
  'MANUAL: Você precisa ativar Quest 2.2 quando Quest 2.1 expirar' as "O Que Fazer",
  'UPDATE quests SET started_at=NOW(), status=''active'' WHERE phase_id=(SELECT id FROM phases WHERE order_index=2) AND order_index=2' as "Comando SQL"
UNION ALL
SELECT 
  '🎯 Quest 2.2' as "Ação",
  'Depois que Quest 2.1 expirar' as "Quando",
  'MANUAL: Rodar 30 minutos, depois ativar Quest 2.3' as "O Que Fazer",
  'UPDATE quests SET started_at=NOW(), status=''active'' WHERE phase_id=(SELECT id FROM phases WHERE order_index=2) AND order_index=3' as "Comando SQL"
UNION ALL
SELECT 
  '🎯 Quest 2.3' as "Ação",
  'Depois que Quest 2.2 expirar' as "Quando",
  'MANUAL: Rodar 120 minutos, depois ativar BOSS 2.4' as "O Que Fazer",
  'UPDATE quests SET started_at=NOW(), status=''active'' WHERE phase_id=(SELECT id FROM phases WHERE order_index=2) AND order_index=4' as "Comando SQL"
UNION ALL
SELECT 
  '🎯 BOSS 2.4' as "Ação",
  'Depois que Quest 2.3 expirar' as "Quando",
  'MANUAL: Apresentação 25min, depois auto_advance_phase avança para Fase 3' as "O Que Fazer",
  'UPDATE quests SET started_at=NOW(), status=''active'' WHERE phase_id=(SELECT id FROM phases WHERE order_index=2) AND order_index=4' as "Comando SQL";

-- ============================================================================
-- RESUMO DA SITUAÇÃO:
-- ============================================================================
-- ✅ FUNCIONANDO:
--    - auto-advance-phase-job: Avança fases quando todas quests expiraram
--    - check-evaluations-complete: Verifica avaliações
--
-- ❌ DESATIVADO (COM BUG):
--    - auto-start-next-quest-job: Estava pulando quests (ativou 2.2 em vez de 2.1)
--
-- 🔧 SOLUÇÃO TEMPORÁRIA:
--    - Você ativa as quests MANUALMENTE conforme elas expiram
--    - Quando BOSS 2.4 terminar, auto_advance_phase avança para Fase 3 automaticamente
--    - Na Fase 3, você continua ativando manualmente (ou corrigimos o bug antes)
--
-- 🐛 BUG IDENTIFICADO:
--    - A função auto_start_next_quest() tem problema ao determinar qual quest ativar
--    - Precisa investigação mais profunda para corrigir
-- ============================================================================
