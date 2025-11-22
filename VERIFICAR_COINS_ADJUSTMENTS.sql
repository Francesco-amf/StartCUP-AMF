-- 🔍 VERIFICAR: Tabela coins_adjustments e view live_ranking

-- 1️⃣ Ver se a tabela coins_adjustments existe
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coins_adjustments'
ORDER BY ordinal_position;

-- 2️⃣ Ver definição da view live_ranking
SELECT pg_get_viewdef('live_ranking', true);

-- 3️⃣ Ver como live_ranking calcula total_points
SELECT definition
FROM pg_views
WHERE viewname = 'live_ranking';
