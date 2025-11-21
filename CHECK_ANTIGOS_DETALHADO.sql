-- Verificar EXATAMENTE o que são "dados antigos"
-- Para entender por que ANÁLISE FINAL diz "TEM DADOS ANTIGOS"

-- 1. Quests com started_at (deveria estar limpo se reset)
SELECT 'QUESTS COM STARTED_AT' as "Tipo",
  COUNT(*) as "Total",
  STRING_AGG(DISTINCT name, ', ') as "Quests"
FROM quests
WHERE started_at IS NOT NULL;

-- 2. Submissions com submitted_at (deveria estar zerado se reset)
SELECT 'SUBMISSIONS COM DATA' as "Tipo",
  COUNT(*) as "Total",
  MAX(submitted_at) as "Mais recente"
FROM submissions
WHERE submitted_at IS NOT NULL;

-- 3. Evaluations com data (deveria estar zerado se reset)
SELECT 'EVALUATIONS COM DATA' as "Tipo",
  COUNT(*) as "Total",
  MAX(created_at) as "Mais recente"
FROM evaluations
WHERE created_at IS NOT NULL;

-- 4. Boss Battles (deveria estar zerado)
SELECT 'BOSS BATTLES' as "Tipo",
  COUNT(*) as "Total",
  MAX(created_at) as "Mais recente"
FROM boss_battles;

-- 5. Detalhe de quests OLD (>1h, mas a query anterior disse 0)
SELECT 'QUESTS OLD (>1H)' as "Tipo",
  COUNT(*) as "Total",
  MIN(started_at) as "Mais antigo",
  MAX(started_at) as "Mais recente"
FROM quests
WHERE started_at IS NOT NULL 
  AND NOW() - started_at > INTERVAL '1 hour';

-- 6. Detalhe de submissions OLD (>1h, mas a query anterior disse 0)
SELECT 'SUBMISSIONS OLD (>1H)' as "Tipo",
  COUNT(*) as "Total",
  MIN(submitted_at) as "Mais antigo",
  MAX(submitted_at) as "Mais recente"
FROM submissions
WHERE submitted_at IS NOT NULL
  AND NOW() - submitted_at > INTERVAL '1 hour';

-- 7. E se for Phase anterior? Quests de Phase 0?
SELECT 'QUESTS DE PHASES ANTIGAS' as "Tipo",
  COUNT(*) as "Total",
  STRING_AGG(DISTINCT p.name || ' (Q' || q.order_index || ')', ', ') as "Fases/Quests"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 0;

-- 8. Checksum final: Tudo zerado mesmo?
SELECT 
  (SELECT COUNT(*) FROM quests WHERE started_at IS NOT NULL) as "Quests com data",
  (SELECT COUNT(*) FROM submissions) as "Submissions total",
  (SELECT COUNT(*) FROM evaluations) as "Evaluations total",
  (SELECT COUNT(*) FROM boss_battles) as "Boss battles total",
  CASE 
    WHEN (SELECT COUNT(*) FROM quests WHERE started_at IS NOT NULL) = 0
      AND (SELECT COUNT(*) FROM submissions) = 0
      AND (SELECT COUNT(*) FROM evaluations) = 0
      AND (SELECT COUNT(*) FROM boss_battles) = 0
    THEN '✅ TUDO ZERADO - Dados limpos'
    ELSE '⚠️ TEM DADOS'
  END as "Resultado"
;
