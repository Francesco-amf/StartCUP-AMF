-- 🔍 DIAGNÓSTICO: Qual quest está REALMENTE ativa?

-- 1️⃣ VER ESTADO ATUAL DE TODAS AS QUESTS DA FASE 2
SELECT 
  q.order_index as "Quest#",
  q.name as "Nome",
  q.status as "Status",
  q.started_at IS NOT NULL as "Iniciada?",
  q.started_at as "Iniciada Em",
  q.started_at + (q.duration_minutes * INTERVAL '1 minute') as "Expira Em",
  NOW() as "Agora",
  CASE 
    WHEN q.started_at IS NULL THEN '⏳ NÃO INICIADA'
    WHEN NOW() >= q.started_at + ((q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute') 
      THEN '❌ EXPIRADA'
    WHEN q.status = 'active' 
      THEN '✅ ATIVA AGORA'
    WHEN q.status = 'closed'
      THEN '🔒 FECHADA'
    ELSE '❓ ' || q.status
  END as "Estado Real"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- 2️⃣ VER QUAL QUEST O SISTEMA CONSIDERA "ATUAL"
-- (Baseado na lógica do page.tsx)
WITH current_quest_logic AS (
  SELECT 
    q.id,
    q.order_index,
    q.name,
    q.status,
    q.started_at,
    -- Verificar se expirou
    CASE 
      WHEN q.started_at IS NOT NULL 
        AND q.duration_minutes IS NOT NULL
        AND NOW() > (q.started_at + (q.duration_minutes * INTERVAL '1 minute'))
      THEN TRUE
      ELSE FALSE
    END as expired,
    -- Verificar se tem submissão
    EXISTS(SELECT 1 FROM submissions s WHERE s.quest_id = q.id) as has_submission
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2
    AND q.started_at IS NOT NULL
  ORDER BY q.order_index DESC
)
SELECT 
  order_index as "Quest#",
  name as "Nome",
  status as "Status",
  expired as "Expirou?",
  has_submission as "Tem Submissão?",
  CASE 
    WHEN NOT expired AND NOT has_submission THEN '🎯 ESTA É A QUEST ATUAL'
    WHEN expired AND NOT has_submission THEN '⏰ Expirou sem submissão'
    WHEN has_submission THEN '✅ Já foi submetida'
    ELSE '❓ Estado desconhecido'
  END as "Análise"
FROM current_quest_logic
ORDER BY order_index DESC
LIMIT 1;

-- 3️⃣ VERIFICAR SE HÁ CONFLITO ENTRE STATUS
SELECT 
  COUNT(CASE WHEN q.status = 'active' THEN 1 END) as "Quests com status=active",
  COUNT(CASE WHEN q.started_at IS NOT NULL AND q.status != 'closed' THEN 1 END) as "Quests iniciadas não fechadas",
  STRING_AGG(
    CASE WHEN q.status = 'active' THEN q.order_index::text END, 
    ', '
  ) as "Quest# com status=active"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2;
