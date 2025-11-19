-- ============================================================================
-- SOLUÇÃO ALTERNATIVA: UPDATE direto via SQL (bypass do client)
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- PASSO 1: Verificar estado atual
SELECT 'Estado Atual Quest 5.3' as step;
SELECT id, order_index, name, status, started_at
FROM quests
WHERE phase_id = 5 AND order_index = 3;

-- PASSO 2: Teste de UPDATE direto via SQL
SELECT 'Tentando UPDATE direto via SQL' as step;

-- Resetar para scheduled
UPDATE quests
SET status = 'scheduled', started_at = NULL
WHERE phase_id = 5 AND order_index = 3;

-- Ativar quest (este UPDATE deve funcionar via SQL direto)
UPDATE quests  
SET status = 'active', started_at = NOW()
WHERE phase_id = 5 AND order_index = 3
RETURNING id, name, status, started_at;

-- PASSO 3: Verificar sucesso
SELECT 'Verificação pós-UPDATE' as step;
SELECT id, order_index, name, status, started_at
FROM quests
WHERE phase_id = 5 AND order_index = 3;

-- PASSO 4: Resetar para scheduled novamente
UPDATE quests
SET status = 'scheduled', started_at = NULL
WHERE phase_id = 5 AND order_index = 3;

SELECT 'Se este UPDATE funcionou via SQL, o problema é no Supabase Client JS' as diagnostico;

-- ============================================================================
-- SE O UPDATE VIA SQL FUNCIONAR:
-- ============================================================================
-- Isso confirma que o problema está no Supabase JS Client, não no banco.
-- SOLUÇÃO: Usar RPC function para fazer os UPDATEs

