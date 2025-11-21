-- CRÍTICO: Verificar se função auto_start_next_quest() tem proteção
-- Execute no Supabase SQL Editor

SELECT 
  CASE 
    WHEN prosrc LIKE '%order_index = 4%' THEN '✅ Tem validação order_index=4'
    ELSE '❌ FALTA validação order_index=4'
  END as validacao_1,
  CASE 
    WHEN prosrc LIKE '%presentation%' THEN '✅ Tem validação presentation'
    ELSE '❌ FALTA validação presentation'
  END as validacao_2,
  CASE 
    WHEN prosrc LIKE '%BLOQUEADO%' OR prosrc LIKE '%BLOCKED%' THEN '✅ Tem mensagem de bloqueio'
    ELSE '⚠️ Sem mensagem de bloqueio (pode ser ok)'
  END as mensagem,
  LENGTH(prosrc) as tamanho_funcao
FROM pg_proc
WHERE proname = 'auto_start_next_quest';
