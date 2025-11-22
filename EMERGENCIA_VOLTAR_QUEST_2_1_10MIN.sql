-- 🚨 EMERGÊNCIA: VOLTAR QUEST 2.1 COM 10 MINUTOS RESTANTES

-- 1️⃣ FECHAR Quest 2.2 (que está ativa errada)
UPDATE quests
SET status = 'closed',
    started_at = NULL
WHERE id = '3d6c0072-9468-48f5-b9fa-2645f302c03e';  -- Quest 2.2

-- 2️⃣ REATIVAR Quest 2.1 com started_at ajustado para ter 10min restantes
-- Quest 2.1 tem 50min de duração + 15min janela = 65min total
-- Para ter 10min restantes: NOW() - (50min - 10min) = NOW() - 40min
UPDATE quests
SET started_at = NOW() - INTERVAL '40 minutes',
    status = 'active'
WHERE id = 'ce2b7ad6-5c26-4ec6-a4d8-81a2b69fd565';  -- Quest 2.1

-- 3️⃣ CONFIRMAR
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciou",
  q.started_at + (q.duration_minutes * INTERVAL '1 minute') as "Expira Prazo Normal",
  q.started_at + ((q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute') as "Expira com Atraso",
  EXTRACT(EPOCH FROM (
    q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW()
  )) / 60 as "Minutos Restantes (prazo normal)",
  CASE 
    WHEN q.status = 'active' AND q.order_index = 1 THEN '✅ Quest 2.1 ATIVA!'
    WHEN q.status = 'closed' AND q.order_index = 2 THEN '✅ Quest 2.2 FECHADA!'
    ELSE '❌ Verificar'
  END as "Status"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index IN (1, 2)
ORDER BY q.order_index;

-- ============================================================================
-- EXPLICAÇÃO:
-- ============================================================================
-- Quest 2.1: 50min duração + 15min janela atraso = 65min total
-- Para ter 10min RESTANTES do prazo normal (não contando atraso):
--   started_at = NOW() - 40 minutos
--   Expira em: NOW() - 40min + 50min = NOW() + 10min ✅
--
-- A janela de atraso (15min) começa DEPOIS dos 10min, então equipes têm:
--   - 10min para submeter no prazo
--   - +15min de janela de atraso depois
-- ============================================================================
