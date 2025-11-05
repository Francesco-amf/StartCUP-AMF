-- ==========================================
-- 🏁 TESTAR CONTAGEM REGRESSIVA FINAL DO EVENTO
-- ==========================================
-- Este script permite testar a tela de GAME OVER
-- ==========================================

-- ==========================================
-- TESTE 1: Definir término do evento em 15 segundos
-- ==========================================
-- Isso ativará a contagem regressiva nos últimos 10 segundos

UPDATE event_config
SET event_end_time = NOW() + INTERVAL '15 seconds'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verificar
SELECT 
  event_ended,
  event_end_time,
  NOW() as agora,
  event_end_time - NOW() as tempo_restante
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ==========================================
-- O QUE ACONTECERÁ:
-- ==========================================
-- 
-- Segundos 15-11: Nada (evento continua normal)
-- Segundos 10-1:  CONTAGEM REGRESSIVA aparece em tela cheia
--                 - Números gigantes
--                 - Animação de bounce
--                 - Efeitos de blur
--                 - Mensagem "ÚLTIMOS SEGUNDOS! 🚨"
-- 
-- Segundo 0:      GAME OVER
--                 - Tela vermelha e preta
--                 - Texto "GAME OVER" com efeito glitch
--                 - 🏁 Emoji de bandeira
--                 - Mensagem "O EVENTO TERMINOU!"
--                 - Efeito de scanlines (arcade)
--                 - Som de game over (se disponível)
-- ==========================================

-- ==========================================
-- TESTE 2: Marcar evento como terminado AGORA
-- ==========================================
-- Mostra tela de GAME OVER imediatamente

UPDATE event_config
SET 
  event_ended = true,
  event_end_time = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ==========================================
-- TESTE 3: Reiniciar evento (voltar ao normal)
-- ==========================================
-- Remove tela de GAME OVER e volta ao evento normal

UPDATE event_config
SET 
  event_ended = false,
  event_end_time = NOW() + INTERVAL '2 hours'  -- Ajuste conforme necessário
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ==========================================
-- TESTE 4: Simular evento terminando em 5 minutos
-- ==========================================
-- Útil para ver o comportamento antes da contagem final

UPDATE event_config
SET 
  event_ended = false,
  event_end_time = NOW() + INTERVAL '5 minutes'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ==========================================
-- INSTRUÇÕES DE TESTE
-- ==========================================
-- 
-- 1. Execute TESTE 1 no Supabase SQL Editor
-- 2. Abra qualquer página do app (dashboard, submit, etc.)
-- 3. Aguarde e observe:
--    - 5 segundos: nada acontece
--    - Aos 10 segundos restantes: contagem regressiva aparece
--    - Aos 0 segundos: GAME OVER
-- 
-- 4. Para voltar ao normal, execute TESTE 3
-- 
-- 5. Para testar GAME OVER instantâneo, execute TESTE 2
-- 
-- DICA: Abra múltiplas abas (equipe, avaliador, admin)
--       para ver o efeito em todas simultaneamente!
-- ==========================================

-- ==========================================
-- VERIFICAR SE event_end_time EXISTE
-- ==========================================
-- Se der erro, execute isto primeiro:

-- ALTER TABLE event_config 
-- ADD COLUMN IF NOT EXISTS event_end_time TIMESTAMP WITH TIME ZONE;

-- Depois defina um valor inicial:
-- UPDATE event_config 
-- SET event_end_time = NOW() + INTERVAL '24 hours'
-- WHERE event_end_time IS NULL;
-- ==========================================
