-- SQL para testar fim do evento
-- Define event_end_time para 2 minutos no futuro
-- Define evaluation_period_end_time para NOW (já passou, para testar a tela dos 20 minutos)

-- OPÇÃO 1: Testar tela de Evaluation Period (20 minutos) - tempo JÁ PASSOU
UPDATE event_config
SET 
  event_ended = false,
  event_end_time = NOW() + INTERVAL '2 minutes',           -- Evento termina em 2 minutos
  evaluation_period_end_time = NOW() - INTERVAL '30 seconds', -- Período já passou 30s atrás
  all_submissions_evaluated = false
WHERE id = '00000000-0000-0000-0000-000000000001';

-- OPÇÃO 2: Testar tela de Evaluation Period (20 minutos) - com tempo ATIVO (10 segundos restantes)
-- Descomenta as linhas abaixo e comenta as de cima se quiser ver o countdown ativo
/*
UPDATE event_config
SET 
  event_ended = false,
  event_end_time = NOW() + INTERVAL '2 minutes',
  evaluation_period_end_time = NOW() + INTERVAL '10 seconds', -- 10 segundos para testar countdown
  all_submissions_evaluated = false
WHERE id = '00000000-0000-0000-0000-000000000001';
*/

-- OPÇÃO 3: Testar countdown final de 60 segundos (quando avaliações terminam)
-- Descomenta as linhas abaixo para testar a fase final
/*
UPDATE event_config
SET 
  event_ended = false,
  event_end_time = NOW() + INTERVAL '1 minute',  -- 60 segundos para game over
  evaluation_period_end_time = NOW() - INTERVAL '5 minutes', -- Período já passou
  all_submissions_evaluated = true  -- Todas avaliações completas
WHERE id = '00000000-0000-0000-0000-000000000001';
*/

-- OPÇÃO 4: Testar GAME OVER final
-- Descomenta as linhas abaixo para ver a tela de vencedor
/*
UPDATE event_config
SET 
  event_ended = true,
  event_end_time = NOW() - INTERVAL '1 minute',  -- Evento já terminou há 1 minuto
  evaluation_period_end_time = NOW() - INTERVAL '5 minutes',
  all_submissions_evaluated = true
WHERE id = '00000000-0000-0000-0000-000000000001';
*/

-- Verificar estado atual
SELECT 
  event_ended,
  event_end_time,
  evaluation_period_end_time,
  all_submissions_evaluated,
  NOW() as current_time,
  event_end_time - NOW() as time_until_end,
  evaluation_period_end_time - NOW() as time_until_eval_end
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
