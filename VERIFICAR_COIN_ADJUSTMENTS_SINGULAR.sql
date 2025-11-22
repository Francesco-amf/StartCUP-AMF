-- 🔍 VERIFICAR: Qual tabela existe - coin_adjustments ou coins_adjustments?

-- Verificar coin_adjustments (singular)
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coin_adjustments'
ORDER BY ordinal_position;

-- Se não existir, criar a tabela coin_adjustments
-- (baseado na definição da view live_ranking)
