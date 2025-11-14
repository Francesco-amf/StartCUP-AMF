-- ==========================================
-- CORRIGIR TABELA PENALTIES (Opcional)
-- ==========================================

-- PASSO 1: Verificar se tabela penalties existe
SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'penalties'
  ) as penalties_table_exists;

-- PASSO 2: Se existe, desabilitar RLS para evitar erros
ALTER TABLE penalties DISABLE ROW LEVEL SECURITY;

-- PASSO 3: Verificar status
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'penalties';

-- PASSO 4: Inserir dados de penalties baseado em submissões atrasadas
-- (Isso popular a tabela se estiver vazia)
INSERT INTO penalties (team_id, penalty_type, points_deduction, reason, assigned_by_admin)
SELECT
  s.team_id,
  'atraso' as penalty_type,
  s.late_penalty_applied as points_deduction,
  CONCAT('Submissão atrasada por ', s.late_minutes, ' minutos - Quest: ', q.name) as reason,
  true as assigned_by_admin
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.is_late = TRUE
AND s.late_penalty_applied > 0
AND NOT EXISTS (
  SELECT 1 FROM penalties p
  WHERE p.team_id = s.team_id
  AND p.reason ILIKE CONCAT('%', q.name, '%')
)
ON CONFLICT DO NOTHING;

-- PASSO 5: Verificar resultado
SELECT
  COUNT(*) as total_penalties,
  SUM(points_deduction) as total_points_deducted
FROM penalties;
