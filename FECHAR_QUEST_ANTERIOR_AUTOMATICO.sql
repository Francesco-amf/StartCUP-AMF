-- 🔧 FECHAR QUEST ANTERIOR AUTOMATICAMENTE
-- Execute ANTES de ativar a próxima quest para garantir que apenas 1 quest esteja ativa

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1️⃣ FECHAR TODAS AS QUESTS ATIVAS EXCETO A MAIS RECENTE
-- ═══════════════════════════════════════════════════════════════════════════════

WITH active_quests AS (
  SELECT 
    q.id,
    q.name,
    q.started_at,
    ROW_NUMBER() OVER (ORDER BY q.started_at DESC) as rn
  FROM quests q
  WHERE q.status = 'active'
)
UPDATE quests
SET status = 'closed'
WHERE id IN (
  SELECT id 
  FROM active_quests 
  WHERE rn > 1  -- Fecha todas exceto a mais recente
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2️⃣ VERIFICAR RESULTADO - Deve mostrar APENAS 1 QUEST ATIVA
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  to_char(q.started_at, 'HH24:MI:SS') as "Iniciou",
  CASE 
    WHEN q.started_at IS NOT NULL THEN
      ROUND(EXTRACT(EPOCH FROM (NOW() - q.started_at)) / 60, 1)
    ELSE NULL
  END as "Min Decorridos",
  CASE 
    WHEN q.started_at IS NOT NULL AND q.duration_minutes IS NOT NULL THEN
      ROUND(EXTRACT(EPOCH FROM ((q.started_at + (q.duration_minutes * INTERVAL '1 minute')) - NOW())) / 60, 1)
    ELSE NULL
  END as "Min Restantes"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.status IN ('active', 'paused')
ORDER BY p.order_index, q.order_index;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INSTRUÇÕES DE USO
-- ═══════════════════════════════════════════════════════════════════════════════

/*
📋 QUANDO USAR:

1. ANTES de ativar uma nova quest manualmente
2. Quando ver "duas quests ativas" no diagnóstico
3. Quando telão e dashboard mostrarem quests diferentes

🎯 O QUE FAZ:

- Fecha automaticamente todas as quests ativas antigas
- Mantém SOMENTE a quest ativada mais recentemente
- Garante que apenas 1 quest esteja ativa por vez

✅ RESULTADO ESPERADO:

Query de verificação deve mostrar APENAS 1 linha (1 quest ativa)
*/
