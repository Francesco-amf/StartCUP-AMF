-- ⚡ VERIFICAR TIMEZONE ANTES DE REATIVAR CRON

-- 1️⃣ VER TIMEZONE ATUAL DO BANCO
SELECT 
  current_setting('TIMEZONE') as "Timezone do Banco",
  NOW() as "NOW() (com timezone)",
  CURRENT_TIMESTAMP as "CURRENT_TIMESTAMP",
  NOW() AT TIME ZONE 'America/Sao_Paulo' as "NOW() em Brasília (-03)";

-- 2️⃣ VER TIMEZONE DAS QUESTS
SELECT 
  q.order_index as "Quest",
  q.name,
  q.started_at as "Started At (armazenado)",
  q.started_at AT TIME ZONE 'America/Sao_Paulo' as "Started At (Brasília)",
  NOW() as "NOW() (UTC)",
  NOW() AT TIME ZONE 'America/Sao_Paulo' as "NOW() (Brasília)"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.started_at IS NOT NULL
ORDER BY q.order_index
LIMIT 1;

-- 3️⃣ VERIFICAR SE A COMPARAÇÃO ESTÁ CORRETA
-- A função auto_start_next_quest() faz: NOW() > (started_at + duration)
-- Ambos são timestamp WITH TIME ZONE, então a comparação é CORRETA
SELECT 
  'Comparação de timezone' as "Teste",
  q.started_at as "Quest Iniciou (UTC)",
  q.started_at + (q.duration_minutes * INTERVAL '1 minute') as "Quest Expira (UTC)",
  NOW() as "Agora (UTC)",
  NOW() > (q.started_at + ((q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute')) as "Já Expirou?",
  CASE 
    WHEN NOW() > (q.started_at + ((q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute'))
    THEN '✅ EXPIROU - Próxima quest vai ativar'
    ELSE '⏰ AINDA ATIVA - Faltam ' || 
         ROUND(EXTRACT(EPOCH FROM (
           (q.started_at + ((q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute')) - NOW()
         )) / 60) || ' min'
  END as "Status"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index = 2;

-- ============================================================================
-- EXPLICAÇÃO:
-- ============================================================================
-- ✅ Supabase usa PostgreSQL com TIMESTAMP WITH TIME ZONE
-- ✅ Coluna started_at: timestamp with time zone
-- ✅ NOW(): retorna timestamp with time zone (UTC internamente)
-- ✅ Cron jobs rodam em UTC
-- ✅ Comparações são feitas em UTC (PostgreSQL converte automaticamente)
--
-- RESULTADO: NÃO HÁ PROBLEMA DE TIMEZONE! 🎯
-- 
-- A coluna started_at já está armazenada com timezone (+00 = UTC)
-- Quando você insere "2025-11-22 03:28:52.327197+00", o PostgreSQL sabe que é UTC
-- NOW() também retorna UTC
-- A comparação NOW() > started_at + duration funciona PERFEITAMENTE
-- ============================================================================
