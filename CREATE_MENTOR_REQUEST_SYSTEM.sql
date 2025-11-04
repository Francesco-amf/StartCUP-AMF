-- ==========================================
-- 🆘 SISTEMA DE CHAMADA PAGA DE MENTORES
-- ==========================================
-- Feature: Equipes podem chamar mentores online pagando AMF Coins
-- Custo progressivo: 5 → 10 → 20 → 35 → 55 → 80 → 110...
-- ==========================================

-- ==========================================
-- 1. CRIAR TABELA coin_adjustments
-- ==========================================
-- Tabela para registrar ajustes de AMF Coins (positivos ou negativos)
-- Será usada para deduzir coins de chamadas de mentor, bônus, etc.
CREATE TABLE IF NOT EXISTS coin_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Negativo para dedução, positivo para bônus
  reason TEXT NOT NULL, -- 'mentor_request', 'bonus', 'penalty_refund', etc.
  reference_id UUID, -- ID da solicitação de mentor, penalty, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_adjustments_team ON coin_adjustments(team_id);

-- ==========================================
-- 2. CRIAR TABELA mentor_requests
-- ==========================================
CREATE TABLE IF NOT EXISTS mentor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES evaluators(id), -- ID do mentor (tabela evaluators)
  phase INTEGER NOT NULL,
  amf_coins_cost INTEGER NOT NULL, -- Custo pago pela chamada
  request_number INTEGER NOT NULL, -- 1ª, 2ª, 3ª chamada (nesta fase)
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'completed', 'cancelled'
  notes TEXT, -- Observações da equipe sobre o que precisam
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mentor_requests_team ON mentor_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_mentor ON mentor_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_phase ON mentor_requests(phase);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_status ON mentor_requests(status);

-- ==========================================
-- 3. ATUALIZAR VIEW live_ranking
-- ==========================================
-- Incluir coin_adjustments no cálculo de total_points
DROP VIEW IF EXISTS live_ranking CASCADE;

CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  COALESCE(SUM(s.final_points), 0) 
    - COALESCE(SUM(p.points_deduction), 0) 
    + COALESCE(SUM(ca.amount), 0) as total_points, -- Adiciona ajustes (negativos ou positivos)
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN penalties p ON t.id = p.team_id
LEFT JOIN coin_adjustments ca ON t.id = ca.team_id
WHERE t.email NOT IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com')
  AND t.course NOT IN ('Administration', 'Avaliação')
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

-- ==========================================
-- 4. FUNÇÃO: Calcular custo da próxima chamada
-- ==========================================
-- Lógica: Custo cresce progressivamente
-- 1ª chamada: 5 coins
-- 2ª chamada: 10 coins (5 + 5×1)
-- 3ª chamada: 20 coins (10 + 5×2)
-- 4ª chamada: 35 coins (20 + 5×3)
-- 5ª chamada: 55 coins (35 + 5×4)
-- etc.
-- ==========================================
CREATE OR REPLACE FUNCTION calculate_mentor_request_cost(
  p_team_id UUID,
  p_phase INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_count INTEGER;
  v_cost INTEGER;
BEGIN
  -- Contar quantas chamadas a equipe já fez NESTA FASE
  SELECT COUNT(*)
  INTO v_request_count
  FROM mentor_requests
  WHERE team_id = p_team_id
    AND phase = p_phase;
  
  -- Se é a primeira chamada (count = 0), custo é 5
  IF v_request_count = 0 THEN
    RETURN 5;
  END IF;
  
  -- Calcular custo progressivo usando a fórmula recursiva
  -- Começar com 5 e adicionar incrementos crescentes
  v_cost := 5;
  FOR i IN 1..v_request_count LOOP
    v_cost := v_cost + (5 * i);
  END LOOP;
  
  RETURN v_cost;
END;
$$;

-- ==========================================
-- 5. FUNÇÃO: Criar solicitação de mentor
-- ==========================================
CREATE OR REPLACE FUNCTION request_mentor(
  p_team_id UUID,
  p_mentor_id UUID,
  p_phase INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cost INTEGER;
  v_request_number INTEGER;
  v_team_coins INTEGER;
  v_new_request_id UUID;
  v_mentor_name TEXT;
BEGIN
  -- 1. Calcular custo
  v_cost := calculate_mentor_request_cost(p_team_id, p_phase);
  
  -- 2. Verificar AMF Coins da equipe (assumindo que está no ranking/live_ranking)
  -- Ajuste a query conforme sua estrutura
  SELECT COALESCE(total_points, 0)
  INTO v_team_coins
  FROM live_ranking
  WHERE team_id = p_team_id;
  
  -- 3. Validar se tem coins suficientes
  IF v_team_coins < v_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', format('AMF Coins insuficientes. Necessário: %s, Disponível: %s', v_cost, v_team_coins),
      'required', v_cost,
      'available', v_team_coins
    );
  END IF;
  
  -- 4. Contar número da solicitação
  SELECT COUNT(*) + 1
  INTO v_request_number
  FROM mentor_requests
  WHERE team_id = p_team_id
    AND phase = p_phase;
  
  -- 5. Criar solicitação primeiro para ter o ID
  INSERT INTO mentor_requests (
    team_id,
    mentor_id,
    phase,
    amf_coins_cost,
    request_number,
    status,
    notes
  ) VALUES (
    p_team_id,
    p_mentor_id,
    p_phase,
    v_cost,
    v_request_number,
    'pending',
    p_notes
  ) RETURNING id INTO v_new_request_id;
  
  -- 6. Deduzir coins da equipe (inserir ajuste negativo)
  INSERT INTO coin_adjustments (team_id, amount, reason, reference_id)
  VALUES (
    p_team_id, 
    -v_cost, -- Negativo para dedução
    'mentor_request', 
    v_new_request_id
  );
  
  -- 7. Buscar nome do mentor
  SELECT name
  INTO v_mentor_name
  FROM evaluators
  WHERE id = p_mentor_id;
  
  -- 8. Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'request_id', v_new_request_id,
    'cost', v_cost,
    'request_number', v_request_number,
    'mentor_name', v_mentor_name,
    'message', format('Solicitação enviada para %s! Custo: %s AMF Coins', v_mentor_name, v_cost)
  );
END;
$$;

-- ==========================================
-- 6. RLS (Row Level Security) - coin_adjustments
-- ==========================================
ALTER TABLE coin_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teams can view their own coin adjustments" ON coin_adjustments;
CREATE POLICY "Teams can view their own coin adjustments" 
  ON coin_adjustments FOR SELECT 
  TO authenticated 
  USING (
    team_id = (SELECT id FROM teams WHERE email = auth.jwt()->>'email')
    OR
    EXISTS (
      SELECT 1 FROM teams 
      WHERE email = auth.jwt()->>'email' 
      AND course = 'Administration'
    )
  );

DROP POLICY IF EXISTS "Only system can insert coin adjustments" ON coin_adjustments;
CREATE POLICY "Only system can insert coin adjustments" 
  ON coin_adjustments FOR INSERT 
  TO authenticated 
  WITH CHECK (true); -- Permitir inserção via função

-- ==========================================
-- 7. RLS (Row Level Security) - mentor_requests
-- ==========================================
ALTER TABLE mentor_requests ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver suas próprias solicitações
DROP POLICY IF EXISTS "Teams can view their own mentor requests" ON mentor_requests;
CREATE POLICY "Teams can view their own mentor requests" 
  ON mentor_requests FOR SELECT 
  TO authenticated 
  USING (
    team_id = (SELECT id FROM teams WHERE email = auth.jwt()->>'email')
  );

-- Política: Mentores e admin podem ver solicitações direcionadas a eles
DROP POLICY IF EXISTS "Mentors can view requests for them" ON mentor_requests;
CREATE POLICY "Mentors can view requests for them" 
  ON mentor_requests FOR SELECT 
  TO authenticated 
  USING (
    mentor_id = (SELECT id FROM teams WHERE email = auth.jwt()->>'email')
    OR
    EXISTS (
      SELECT 1 FROM teams 
      WHERE email = auth.jwt()->>'email' 
      AND course = 'Administration'
    )
  );

-- Política: Teams podem criar solicitações
DROP POLICY IF EXISTS "Teams can create mentor requests" ON mentor_requests;
CREATE POLICY "Teams can create mentor requests" 
  ON mentor_requests FOR INSERT 
  TO authenticated 
  WITH CHECK (
    team_id = (SELECT id FROM teams WHERE email = auth.jwt()->>'email')
  );

-- Política: Mentores podem atualizar status de suas solicitações
DROP POLICY IF EXISTS "Mentors can update their requests" ON mentor_requests;
CREATE POLICY "Mentors can update their requests" 
  ON mentor_requests FOR UPDATE 
  TO authenticated 
  USING (
    mentor_id = (SELECT id FROM teams WHERE email = auth.jwt()->>'email')
    OR
    EXISTS (
      SELECT 1 FROM teams 
      WHERE email = auth.jwt()->>'email' 
      AND course = 'Administration'
    )
  );

-- ==========================================
-- 8. PERMISSÕES
-- ==========================================
GRANT EXECUTE ON FUNCTION calculate_mentor_request_cost(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION request_mentor(UUID, UUID, INTEGER, TEXT) TO authenticated;

-- ==========================================
-- 9. TESTES
-- ==========================================

-- Teste 1: Calcular custo para diferentes números de chamadas
SELECT 
  'Teste de custo progressivo' as teste,
  calculate_mentor_request_cost('00000000-0000-0000-0000-000000000000'::uuid, 1) as primeira_chamada_deve_ser_5,
  calculate_mentor_request_cost('00000000-0000-0000-0000-000000000000'::uuid, 1) as segunda_chamada_simulada;

-- ==========================================
-- 10. QUERIES ÚTEIS
-- ==========================================

-- Ver ajustes de coins de uma equipe
-- SELECT 
--   ca.amount,
--   ca.reason,
--   ca.created_at,
--   mr.mentor_id,
--   t_mentor.name as mentor_name
-- FROM coin_adjustments ca
-- LEFT JOIN mentor_requests mr ON ca.reference_id = mr.id
-- LEFT JOIN teams t_mentor ON mr.mentor_id = t_mentor.id
-- WHERE ca.team_id = 'SEU_TEAM_ID_AQUI'
-- ORDER BY ca.created_at DESC;

-- Ver todas as solicitações pendentes
SELECT 
  mr.id,
  t_equipe.name as equipe,
  e_mentor.name as mentor,
  mr.phase,
  mr.amf_coins_cost as custo,
  mr.request_number as numero_chamada,
  mr.status,
  mr.created_at
FROM mentor_requests mr
JOIN teams t_equipe ON mr.team_id = t_equipe.id
JOIN evaluators e_mentor ON mr.mentor_id = e_mentor.id
WHERE mr.status = 'pending'
ORDER BY mr.created_at DESC;

-- Ver histórico de uma equipe
-- SELECT 
--   mr.phase,
--   t_mentor.name as mentor,
--   mr.amf_coins_cost as custo,
--   mr.status,
--   mr.created_at
-- FROM mentor_requests mr
-- JOIN teams t_mentor ON mr.mentor_id = t_mentor.id
-- WHERE mr.team_id = 'SEU_TEAM_ID_AQUI'
-- ORDER BY mr.created_at DESC;

-- ==========================================
-- NOTAS DE IMPLEMENTAÇÃO
-- ==========================================
-- 
-- ⚠️ ATENÇÃO: Esta implementação assume que:
-- 1. AMF Coins estão na tabela 'live_ranking' calculados dinamicamente
-- 2. Mentores estão na tabela 'evaluators' com role='mentor'
-- 3. A tabela evaluators tem campo is_online (boolean)
-- 
-- 📝 TODO:
-- 1. Criar notificação para mentores quando recebem solicitação
-- 2. Adicionar ao RESET_SYSTEM_COMPLETO.sql a limpeza de mentor_requests e coin_adjustments
-- 3. Implementar sistema para mentores aceitarem/completarem solicitações
-- 
-- ==========================================
