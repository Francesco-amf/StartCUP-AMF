-- ==========================================
-- VERIFICAÇÃO: Sistema de penalidades por atraso
-- ==========================================

-- 1. Verificar se campos existem na tabela submissions
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions'
  AND column_name IN ('is_late', 'late_minutes', 'late_penalty_applied', 'quest_deadline', 'submitted_at')
ORDER BY column_name;

-- 2. Verificar funções de penalidade
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname IN ('calculate_late_penalty', 'update_late_submission_fields', 'calculate_quest_deadline')
ORDER BY proname;

-- 3. Verificar triggers
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'submissions'
  AND t.tgname LIKE '%late%'
ORDER BY t.tgname;

-- 4. Testar submissões com atraso
SELECT 
  s.id,
  t.name as team_name,
  q.name as quest_name,
  s.submitted_at,
  s.quest_deadline,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  s.status,
  CASE 
    WHEN s.is_late THEN '🔴 ATRASADA'
    ELSE '🟢 NO PRAZO'
  END as status_atraso
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
WHERE s.is_late = true
ORDER BY s.submitted_at DESC
LIMIT 10;

-- 5. Verificar se penalidades são aplicadas corretamente
-- (deve mostrar -5, -10 ou -15 conforme atraso)
SELECT 
  late_minutes,
  late_penalty_applied,
  COUNT(*) as quantidade
FROM submissions
WHERE is_late = true
GROUP BY late_minutes, late_penalty_applied
ORDER BY late_minutes;

-- ==========================================
-- DIAGNÓSTICO:
-- ==========================================
-- Se campos is_late, late_minutes, late_penalty_applied NÃO existirem:
--   → Execute add-late-submission-system.sql primeiro
--
-- Se campos existem mas is_late sempre FALSE:
--   → Trigger não está funcionando ou quest_deadline não está setado
--
-- Se late_penalty_applied sempre 0:
--   → Função calculate_late_penalty() pode não estar sendo chamada
-- ==========================================
