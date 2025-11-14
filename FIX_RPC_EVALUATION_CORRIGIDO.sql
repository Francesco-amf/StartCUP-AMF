-- ============================================================================
-- CORRIGIR RPC check_all_submissions_evaluated
-- ============================================================================
-- Problema: O RPC estava contando TODAS as submissões do evento,
-- não apenas da Fase 5. Se não há nenhuma submissão ainda (fase 5 iniciou agora),
-- retorna all_evaluated = true (ERRADO!)
--
-- Solução: Contar apenas submissões de quests da Fase 5
-- ============================================================================

-- PASSO 1: Ver versão atual do RPC
SELECT 'PASSO 1: Versão atual do RPC' as "===";
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'check_all_submissions_evaluated';

-- PASSO 2: DELETAR RPC antigo
SELECT 'PASSO 2: Deletando RPC antigo' as "===";
DROP FUNCTION IF EXISTS check_all_submissions_evaluated();

-- PASSO 3: CRIAR novo RPC corrigido
SELECT 'PASSO 3: Criando novo RPC corrigido' as "===";

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
    -- CORRIGIDO: só retorna true se há submissões E todas estão avaliadas
    -- Se não há submissões (phase 5 começou agora), retorna false
    (COUNT(*) > 0 AND COUNT(*) FILTER (WHERE s.status = 'pending') = 0)::BOOLEAN as all_evaluated
  FROM submissions s
  JOIN quests q ON s.quest_id = q.id
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 5;  -- ← NOVO: Apenas Fase 5
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_all_submissions_evaluated() IS
'Retorna estatísticas sobre o status das submissões da Fase 5.
Corrigido para contar apenas Fase 5 (não todo o evento).
all_evaluated = true APENAS se há submissões E todas foram avaliadas.
Se não há submissões ainda (fase começou agora), retorna false.';

-- PASSO 4: Testar a função
SELECT 'PASSO 4: Testando novo RPC' as "===";
SELECT
  total_submissions,
  evaluated_submissions,
  pending_submissions,
  all_evaluated,
  CASE WHEN all_evaluated THEN '✅ Tudo avaliado' ELSE '⏳ Aguardando avaliações' END as status
FROM check_all_submissions_evaluated();

-- PASSO 5: Resultado esperado
SELECT 'PASSO 5: Resultado esperado' as "===";
SELECT 'Resultado esperado após 5.3 terminar:
├─ total_submissions: [número de submissões da fase 5, 0 é aceitável no teste]
├─ evaluated_submissions: [quantas foram avaliadas]
├─ pending_submissions: [quantas estão pendentes]
└─ all_evaluated: false (até que todas sejam realmente avaliadas)

Se all_evaluated = true quando deveria ser false, RPC ainda está quebrado.
Se all_evaluated = false, RPC está correto!' as explicacao;
