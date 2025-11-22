-- 🔧 AJUSTAR RLS: Permitir admins inserirem coin_adjustments

-- Remover política restritiva atual
DROP POLICY IF EXISTS "Only system can insert coin adjustments" ON coin_adjustments;

-- Criar nova política permitindo authenticated users (incluindo admins) inserirem
CREATE POLICY "Authenticated users can insert coin adjustments"
ON coin_adjustments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ✅ Agora authenticated users podem inserir ajustes de coins
-- ✅ A view live_ranking vai automaticamente incluir os ajustes no total_points
