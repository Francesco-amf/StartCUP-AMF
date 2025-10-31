-- ⚠️ SCRIPT DE RESET DO SISTEMA - USE COM EXTREMA CAUTELA ⚠️
-- Este script deleta TODAS as avaliações e submissões do sistema
-- É IRREVERSÍVEL - não há como recuperar os dados após executar

-- ===========================================================
-- VERIFICAÇÃO DE SEGURANÇA
-- ===========================================================
-- Antes de executar, certifique-se de que você realmente quer deletar todos os dados!

-- ===========================================================
-- PASSO 1: Ver estatísticas ANTES do reset
-- ===========================================================
SELECT
  'ANTES DO RESET' as momento,
  (SELECT COUNT(*) FROM evaluations) as total_avaliacoes,
  (SELECT COUNT(*) FROM submissions) as total_submissoes,
  (SELECT COUNT(*) FROM teams) as total_equipes,
  (SELECT COUNT(*) FROM evaluators) as total_avaliadores;

-- ===========================================================
-- PASSO 2: DELETAR AVALIAÇÕES (primeiro, por causa de foreign keys)
-- ===========================================================
DELETE FROM evaluations;

-- ===========================================================
-- PASSO 3: DELETAR SUBMISSÕES
-- ===========================================================
DELETE FROM submissions;

-- ===========================================================
-- PASSO 4: RESETAR PONTUAÇÕES DAS EQUIPES (se houver campo de pontos)
-- ===========================================================
-- Se a tabela teams tiver campos de pontuação, descomente as linhas abaixo:
-- UPDATE teams SET total_points = 0;
-- UPDATE teams SET bonus_points = 0;

-- ===========================================================
-- PASSO 5: Ver estatísticas DEPOIS do reset
-- ===========================================================
SELECT
  'DEPOIS DO RESET' as momento,
  (SELECT COUNT(*) FROM evaluations) as total_avaliacoes,
  (SELECT COUNT(*) FROM submissions) as total_submissoes,
  (SELECT COUNT(*) FROM teams) as total_equipes,
  (SELECT COUNT(*) FROM evaluators) as total_avaliadores;

-- ===========================================================
-- OPCIONAL: Limpar arquivos do storage
-- ===========================================================
-- Para limpar arquivos do storage bucket "submissions", você precisa fazer manualmente:
-- 1. Ir no Supabase Dashboard
-- 2. Storage > submissions
-- 3. Selecionar todas as pastas/arquivos
-- 4. Delete

-- ===========================================================
-- NOTAS IMPORTANTES:
-- ===========================================================
-- ✅ Avaliações deletadas
-- ✅ Submissions deletadas
-- ⚠️ Equipes NÃO foram deletadas (apenas resetadas)
-- ⚠️ Avaliadores NÃO foram deletados
-- ⚠️ Quests NÃO foram deletadas
-- ⚠️ Fases NÃO foram deletadas
-- ⚠️ Arquivos no storage NÃO foram deletados (fazer manualmente)

-- Para deletar TUDO (incluindo equipes e avaliadores):
-- CUIDADO: Isso vai remover todos os usuários do sistema!
-- DELETE FROM teams;
-- DELETE FROM evaluators;
