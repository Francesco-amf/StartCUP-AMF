-- Adicionar campo duration_minutes na tabela quests
-- Este campo controla por quanto tempo cada quest fica disponível

-- Adicionar a coluna se não existir
ALTER TABLE quests
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

-- Atualizar quests existentes com durações padrão
-- A soma das durações deve ser igual ao duration_minutes da fase
-- Exemplo: se a fase tem 120 minutos e 4 quests, cada uma terá 30 minutos
UPDATE quests
SET duration_minutes = CASE
  WHEN order_index = 1 THEN 30
  WHEN order_index = 2 THEN 30
  WHEN order_index = 3 THEN 30
  WHEN order_index = 4 THEN 30
  ELSE 0
END
WHERE duration_minutes = 0;

-- Verificar os dados atualizados
SELECT
  q.id,
  q.name,
  q.order_index,
  q.duration_minutes,
  p.name AS phase_name,
  p.duration_minutes AS phase_duration
FROM quests q
LEFT JOIN phases p ON q.phase_id = p.id
ORDER BY q.phase_id, q.order_index;
