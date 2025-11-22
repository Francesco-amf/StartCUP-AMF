-- =====================================================
-- AUDITAR INTEGRIDADE DE SUBMISSÕES DAS EQUIPES
-- =====================================================
-- Verifica se há inconsistências causadas pelas mudanças de hoje

-- 1️⃣ VERIFICAR SUBMISSÕES POR EQUIPE/QUEST
SELECT '📊 SUBMISSÕES POR EQUIPE' as "Status";

SELECT 
  t.name as "Equipe",
  COUNT(s.id) as "Total Submissões",
  COUNT(DISTINCT s.quest_id) as "Quests Únicas",
  STRING_AGG(DISTINCT CONCAT('Q', p.order_index, '.', q.order_index), ', ' ORDER BY CONCAT('Q', p.order_index, '.', q.order_index)) as "Quests Submetidas"
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN quests q ON s.quest_id = q.id
LEFT JOIN phases p ON q.phase_id = p.id
GROUP BY t.id, t.name
ORDER BY t.name;

-- 2️⃣ VERIFICAR SUBMISSÕES ÓRFÃS (sem quest válida)
SELECT '─────────────────────────────────────' as "separator";
SELECT '⚠️ SUBMISSÕES ÓRFÃS' as "Status";

SELECT 
  s.id,
  s.team_id,
  s.quest_id,
  CASE 
    WHEN q.id IS NULL THEN '❌ QUEST NÃO EXISTE'
    WHEN t.id IS NULL THEN '❌ EQUIPE NÃO EXISTE'
    ELSE '✅ OK'
  END as "Status"
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
LEFT JOIN teams t ON s.team_id = t.id
WHERE q.id IS NULL OR t.id IS NULL;

-- 3️⃣ VERIFICAR INTEGRIDADE BÁSICA
SELECT '─────────────────────────────────────' as "separator";
SELECT '🔍 INTEGRIDADE BÁSICA' as "Status";

SELECT 
  COUNT(*) as "Total Submissões",
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as "Com team_id válido",
  COUNT(CASE WHEN quest_id IS NOT NULL THEN 1 END) as "Com quest_id válido",
  COUNT(CASE WHEN team_id IS NULL OR quest_id IS NULL THEN 1 END) as "Submissões incompletas"
FROM submissions;

-- 4️⃣ VERIFICAR AVALIAÇÕES ÓRFÃS
SELECT '─────────────────────────────────────' as "separator";
SELECT '📋 AVALIAÇÕES ÓRFÃS' as "Status";

SELECT 
  COUNT(*) as "Total avaliações",
  COUNT(CASE WHEN s.id IS NULL THEN 1 END) as "Avaliações sem submissão",
  COUNT(CASE WHEN e.id IS NULL THEN 1 END) as "Avaliações sem avaliador",
  COUNT(CASE WHEN t.id IS NULL THEN 1 END) as "Avaliações sem equipe"
FROM evaluations ev
LEFT JOIN submissions s ON ev.submission_id = s.id
LEFT JOIN evaluators e ON ev.evaluator_id = e.id
LEFT JOIN teams t ON ev.team_id = t.id;

-- 5️⃣ VERIFICAR CONSISTÊNCIA: Fase/Quest nas Submissões
SELECT '─────────────────────────────────────' as "separator";
SELECT '✅ CONSISTÊNCIA FASE/QUEST' as "Status";

SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  COUNT(s.id) as "Submissões",
  COUNT(DISTINCT s.team_id) as "Equipes que submeteram",
  CASE 
    WHEN COUNT(s.id) = 0 THEN '⏳ Sem submissões ainda'
    WHEN COUNT(DISTINCT s.team_id) = (SELECT COUNT(*) FROM teams) THEN '✅ Todas as equipes submeteram'
    ELSE '⚠️ Apenas ' || COUNT(DISTINCT s.team_id) || ' equipes submeteram'
  END as "Status"
FROM quests q
LEFT JOIN phases p ON q.phase_id = p.id
LEFT JOIN submissions s ON q.id = s.quest_id
GROUP BY p.order_index, q.order_index, q.id
ORDER BY p.order_index, q.order_index;

-- 6️⃣ RESUMO FINAL
SELECT '═════════════════════════════════════' as "separator";
SELECT '🎯 RESUMO DE INTEGRIDADE' as "Status";

SELECT 
  (SELECT COUNT(*) FROM teams) as "Total Equipes",
  (SELECT COUNT(*) FROM submissions) as "Total Submissões",
  (SELECT COUNT(*) FROM submissions WHERE quest_id IS NULL OR team_id IS NULL) as "Submissões Órfãs",
  (SELECT COUNT(*) FROM evaluations) as "Total Avaliações",
  (SELECT COUNT(*) FROM quests) as "Total Quests",
  (SELECT COUNT(*) FROM phases) as "Total Fases"
  
UNION ALL

SELECT 
  NULL,
  NULL,
  (SELECT COUNT(*) FROM submissions s WHERE s.id IS NULL) as "Submissões futuro?",
  (SELECT COUNT(*) FROM submissions s WHERE s.id IS NULL) as "Updated < Created?",
  NULL,
  NULL;

-- 7️⃣ VERIFICAR SE DADOS FORAM DELETADOS INDEVIDAMENTE
SELECT '─────────────────────────────────────' as "separator";
SELECT '🔐 VERIFICAR ESTRUTURA DE DADOS' as "Status";

SELECT 
  COUNT(*) as "Total Submissões",
  COUNT(CASE WHEN id IS NOT NULL THEN 1 END) as "Submissões com ID válido",
  COUNT(CASE WHEN team_id IS NULL THEN 1 END) as "Submissões sem team_id",
  COUNT(CASE WHEN quest_id IS NULL THEN 1 END) as "Submissões sem quest_id"
FROM submissions;

SELECT 
  COUNT(*) as "Total Avaliações",
  COUNT(CASE WHEN id IS NOT NULL THEN 1 END) as "Avaliações com ID válido",
  COUNT(CASE WHEN submission_id IS NULL THEN 1 END) as "Avaliações sem submission_id",
  COUNT(CASE WHEN evaluator_id IS NULL THEN 1 END) as "Avaliações sem evaluator_id"
FROM evaluations;
