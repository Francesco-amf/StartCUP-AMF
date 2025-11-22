-- ========================================
-- POSSÍVEIS CAUSAS DE ERRO 500 AO FAZER UPLOAD
-- ========================================
-- Data: 2025-11-22

/*
ERRO 500 pode ocorrer em:

1. ❌ UPLOAD DO ARQUIVO (Supabase Storage)
   - Bucket 'submissions' não existe ou sem permissões
   - RLS bloqueando upload
   - Tamanho > 5MB
   - Tipo de arquivo não permitido
   - Conexão lenta/timeout

2. ❌ INSERT NA TABELA submissions
   - RLS bloqueando insert
   - Campos obrigatórios NULL
   - Violação de chave estrangeira (team_id ou quest_id inválidos)
   - Trigger na tabela causando erro

3. ❌ INSERT NA TABELA penalties
   - RLS bloqueando insert de penalidade
   - Campos obrigatórios NULL
   - Erro no cálculo de penalidade

4. ⚠️ TIMEOUT DE REDE
   - Upload de arquivo grande em internet lenta
   - Vercel function timeout (max 60s no free tier)
*/

-- ========================================
-- VERIFICAR 1: Bucket de Storage existe?
-- ========================================
SELECT 
  '=== VERIFICAR BUCKET SUBMISSIONS ===' as info;

-- Não é possível verificar via SQL, mas vamos verificar RLS

-- ========================================
-- VERIFICAR 2: RLS na tabela submissions
-- ========================================
SELECT 
  '=== POLICIES NA TABELA SUBMISSIONS ===' as info;

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
WHERE tablename = 'submissions'
ORDER BY policyname;

-- ========================================
-- VERIFICAR 3: RLS na tabela penalties
-- ========================================
SELECT 
  '=== POLICIES NA TABELA PENALTIES ===' as info;

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
WHERE tablename = 'penalties'
ORDER BY policyname;

-- ========================================
-- VERIFICAR 4: Constraints que podem falhar
-- ========================================
SELECT 
  '=== CONSTRAINTS NA TABELA SUBMISSIONS ===' as info;

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
  END as tipo,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'submissions'::regclass
ORDER BY conname;

-- ========================================
-- VERIFICAR 5: Triggers ativos
-- ========================================
SELECT 
  '=== TRIGGERS NA TABELA SUBMISSIONS ===' as info;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'submissions'
ORDER BY trigger_name;

-- ========================================
-- TESTE MANUAL: Simular insert
-- ========================================
SELECT 
  '=== TESTAR INSERT MANUAL ===' as info;

DO $$
DECLARE
  v_team_id UUID;
  v_quest_id UUID;
  v_submission_id UUID;
BEGIN
  -- Pegar primeira equipe e quest ativa
  SELECT id INTO v_team_id FROM teams WHERE name != 'Outsiders' LIMIT 1;
  SELECT id INTO v_quest_id FROM quests WHERE status = 'active' ORDER BY started_at DESC LIMIT 1;
  
  RAISE NOTICE 'Testando insert com:';
  RAISE NOTICE '  team_id: %', v_team_id;
  RAISE NOTICE '  quest_id: %', v_quest_id;
  
  -- Tentar insert (vai falhar se RLS bloquear)
  BEGIN
    INSERT INTO submissions (
      team_id,
      quest_id,
      content,
      file_url,
      status,
      submitted_at
    ) VALUES (
      v_team_id,
      v_quest_id,
      'TESTE - Deletar depois',
      'https://exemplo.com/teste.pdf',
      'pending',
      NOW()
    ) RETURNING id INTO v_submission_id;
    
    RAISE NOTICE '✅ INSERT funcionou! submission_id: %', v_submission_id;
    
    -- Deletar teste
    DELETE FROM submissions WHERE id = v_submission_id;
    RAISE NOTICE '✅ Teste deletado';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO no INSERT:';
    RAISE NOTICE '   SQLSTATE: %', SQLSTATE;
    RAISE NOTICE '   SQLERRM: %', SQLERRM;
  END;
END $$;

-- ========================================
-- CONCLUSÃO
-- ========================================
SELECT 
  '=== POSSÍVEIS SOLUÇÕES ===' as info;

SELECT '1. Se RLS bloqueia: Adicionar policy allow_team_insert_own_submissions' as solucao_1;
SELECT '2. Se timeout: Arquivo muito grande ou internet lenta (Vercel max 60s)' as solucao_2;
SELECT '3. Se constraint: Verificar team_id e quest_id válidos' as solucao_3;
SELECT '4. Se trigger: Desabilitar temporariamente para testar' as solucao_4;
SELECT '5. Verificar logs do Vercel para ver erro exato (console.error)' as solucao_5;
