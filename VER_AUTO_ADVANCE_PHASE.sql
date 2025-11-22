-- 🔍 VER CÓDIGO DA FUNÇÃO auto_advance_phase()
-- Ela pode estar ativando a primeira quest da próxima fase

SELECT 
  proname as "Função",
  prosrc as "Código SQL"
FROM pg_proc
WHERE proname = 'auto_advance_phase';
