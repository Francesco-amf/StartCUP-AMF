-- ==========================================
-- RESET MANUAL DO SISTEMA
-- ==========================================
-- Execute este script no Supabase SQL Editor para resetar tudo

-- Deletar avaliações
DELETE FROM evaluations;

-- Deletar submissions
DELETE FROM submissions;

-- Tentar deletar das tabelas novas (se existirem)
DELETE FROM penalties WHERE true;
DELETE FROM achievements WHERE true;
DELETE FROM power_ups WHERE true;
DELETE FROM final_pitch WHERE true;
DELETE FROM boss_battles WHERE true;

-- Resetar event_config (se existir)
UPDATE event_config
SET
  current_phase = 0,
  event_started = false,
  event_ended = false,
  phase_1_start_time = null,
  phase_2_start_time = null,
  phase_3_start_time = null,
  phase_4_start_time = null,
  phase_5_start_time = null,
  event_start_time = null,
  event_end_time = null,
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verificar resultado
SELECT
  'Reset completo!' as status,
  (SELECT COUNT(*) FROM evaluations) as avaliacoes_restantes,
  (SELECT COUNT(*) FROM submissions) as submissoes_restantes,
  (SELECT current_phase FROM event_config WHERE id = '00000000-0000-0000-0000-000000000001') as fase_atual;
