-- ==========================================
-- CORREÇÃO: check_all_submissions_evaluated() - TODAS as fases
-- ==========================================
-- PROBLEMA IDENTIFICADO:
-- - RPC verifica apenas "WHERE p.order_index = 5" (Fase 5)
-- - Mas submissões pendentes podem ser de QUALQUER fase (1, 2, 3, 4, 5)
-- - Resultado: Não mostra submissões pendentes de fases anteriores
--
-- SOLUÇÃO:
-- - Remover filtro "WHERE p.order_index = 5"
-- - Contar TODAS as submissões do evento
-- ==========================================

DROP FUNCTION IF EXISTS check_all_submissions_evaluated();

CREATE OR REPLACE FUNCTION check_all_submissions_evaluated()
RETURNS TABLE(
  total_submissions BIGINT,
  evaluated_submissions BIGINT,
  pending_submissions BIGINT,
  all_evaluated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_submissions,
    COUNT(*) FILTER (WHERE s.status = 'evaluated')::BIGINT as evaluated_submissions,
    COUNT(*) FILTER (WHERE s.status = 'pending')::BIGINT as pending_submissions,
    -- Retorna true APENAS se há submissões E todas estão avaliadas
    -- Se não há submissões, retorna false (aguardando)
    (COUNT(*) > 0 AND COUNT(*) FILTER (WHERE s.status = 'pending') = 0)::BOOLEAN as all_evaluated
  FROM submissions s;
  -- ✅ REMOVIDO: JOIN com phases e filtro "WHERE p.order_index = 5"
  -- Agora conta TODAS as submissões do evento inteiro
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_all_submissions_evaluated() IS
'Retorna estatísticas sobre TODAS as submissões do evento.
all_evaluated = true APENAS se há submissões E todas foram avaliadas.
Se não há submissões ou há pendentes, retorna false.';

-- ==========================================
-- VERIFICAÇÃO
-- ==========================================
SELECT 'RPC check_all_submissions_evaluated() corrigido!' as status;

-- Testar:
SELECT
  total_submissions,
  evaluated_submissions,
  pending_submissions,
  all_evaluated,
  CASE 
    WHEN all_evaluated THEN '✅ Tudo avaliado'
    WHEN total_submissions = 0 THEN '⏳ Sem submissões ainda' 
    ELSE '⏳ Aguardando avaliações' 
  END as status_descricao
FROM check_all_submissions_evaluated();

-- Verificar submissões pendentes por fase:
SELECT 
  p.order_index as fase,
  q.name as quest,
  s.status,
  COUNT(*) as quantidade
FROM submissions s
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
WHERE s.status = 'pending'
GROUP BY p.order_index, q.name, s.status
ORDER BY p.order_index, q.name;

-- ==========================================
-- PRÓXIMOS PASSOS:
-- ==========================================
-- 1. Execute este script no Supabase
-- 2. Verifique que agora mostra as submissões pendentes
-- 3. Live dashboard deve mostrar contagem correta
-- ==========================================
