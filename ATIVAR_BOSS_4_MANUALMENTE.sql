-- ==========================================
-- ATIVAR BOSS 4 MANUALMENTE PARA TESTE
-- ==========================================

-- Verificar estado ANTES
SELECT 
  'ANTES' as momento,
  q.name,
  q.order_index,
  q.status,
  q.started_at
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 4
ORDER BY q.order_index;

-- OPÇÃO 1: Ativar BOSS 4 SEM fechar as outras (para teste)
-- Isso permite avaliar o Boss enquanto outras quests ainda estão ativas
UPDATE quests
SET 
  status = 'active',
  started_at = NOW()
WHERE name = '🎯 BOSS 4 - Pitch Sob Pressão';

-- Verificar estado DEPOIS
SELECT 
  'DEPOIS' as momento,
  q.name,
  q.order_index,
  q.status,
  q.started_at
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 4
ORDER BY q.order_index;

-- ==========================================
-- VERIFICAR SE BOSS APARECE AGORA
-- ==========================================
SELECT 
  '🎯 BOSS ATIVO?' as verificacao,
  id,
  name,
  order_index,
  status
FROM quests
WHERE status = 'active'
  AND order_index = 4;
