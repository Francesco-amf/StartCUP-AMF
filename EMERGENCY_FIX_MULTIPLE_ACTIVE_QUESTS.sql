-- ==========================================
-- CORREÇÃO EMERGENCIAL: Múltiplas Quests Ativas
-- ==========================================
-- PROBLEMA DETECTADO:
-- - 5 quests ativas simultaneamente
-- - Boss 2 ativo desde 19/11 (mais de 24h)
-- - Fase 4 com 3 quests ativas (4.2, 4.3, 4.4)
-- - Fase 5 com Quest 5.1 ativa
-- - Timestamps inconsistentes (4.3 antes de 4.2)
-- ==========================================

-- PASSO 1: FECHAR TODAS as quests ativas EXCETO a que deveria estar ativa
-- (vamos manter apenas a Quest 5.1 que é a mais recente)

BEGIN;

-- 1.1 Fechar Boss 2 (antiga, de ontem)
UPDATE quests
SET status = 'closed'
WHERE name = '🎯 BOSS 2 - Demo do Protótipo'
  AND status = 'active';

-- 1.2 Fechar Quest 4.2
UPDATE quests
SET status = 'closed'
WHERE name = 'Quest 4.2 - Validação de Mercado'
  AND status = 'active';

-- 1.3 Fechar Quest 4.3
UPDATE quests
SET status = 'closed'
WHERE name = 'Quest 4.3 - Números que Convencem'
  AND status = 'active';

-- 1.4 Fechar Boss 4.4
UPDATE quests
SET status = 'closed'
WHERE name = '🎯 BOSS 4 - Pitch Sob Pressão'
  AND status = 'active';

-- RESULTADO: Apenas Quest 5.1 permanece ativa
SELECT 
  'APÓS CORREÇÃO' as tipo,
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.status = 'active';

COMMIT;

-- ==========================================
-- PASSO 2: DESATIVAR OS JOBS DE AUTO-ADVANCE
-- ==========================================
-- NOTA: A desativação do pg_cron precisa ser feita via Dashboard do Supabase
-- 
-- Vá em: Database > Cron Jobs
-- E PAUSE/DESATIVE os jobs:
-- - auto_advance_phase
-- - auto_start_next_quest
-- 
-- OU execute via psql com usuário postgres (não funciona no SQL Editor):
-- UPDATE cron.job SET active = false WHERE command LIKE '%auto%';
-- ==========================================

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================
SELECT 
  'VERIFICAÇÃO FINAL' as tipo,
  COUNT(*) FILTER (WHERE status = 'active') as quests_ativas_total,
  STRING_AGG(
    CASE WHEN status = 'active' 
    THEN name 
    END, ', '
  ) as quests_ativas_nomes
FROM quests;

-- ==========================================
-- NOTA IMPORTANTE:
-- ==========================================
-- ✅ Este script fechou as quests problemáticas
-- ⚠️ Você PRECISA desativar os cron jobs manualmente no Dashboard
-- 📍 Depois de executar, o evento ficará em MODO MANUAL
-- 
-- Para investigar a causa raiz, precisamos analisar as funções:
-- - auto_advance_phase()
-- - auto_start_next_quest()
-- ==========================================
