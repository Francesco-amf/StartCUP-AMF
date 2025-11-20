-- ============================================================================
-- DIAGNÓSTICO: Erro ao avaliar Boss Battle
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor para diagnosticar o problema
-- ============================================================================

-- 1. Verificar se as policies existem
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('submissions', 'evaluations')
ORDER BY tablename, policyname;

-- 2. Verificar função get_my_claim
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_my_claim';

-- 3. Testar criação de submission como avaliador
-- (Substitua os valores pelos dados reais)
DO $$
DECLARE
  v_submission_id uuid;
BEGIN
  -- Tente criar uma submission
  INSERT INTO submissions (
    team_id,
    quest_id,
    file_url,
    text_content,
    status,
    submitted_at,
    final_points
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Substitua pelo team_id real
    '00000000-0000-0000-0000-000000000000', -- Substitua pelo quest_id real
    NULL,
    'Boss Battle - Teste',
    'evaluated',
    NOW(),
    85
  )
  RETURNING id INTO v_submission_id;
  
  RAISE NOTICE 'Submission criada com sucesso: %', v_submission_id;
  
  -- Rollback para não criar dados de teste
  RAISE EXCEPTION 'Teste concluído (rollback proposital)';
END $$;
