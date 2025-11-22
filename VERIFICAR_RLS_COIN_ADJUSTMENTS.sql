-- 🔍 VERIFICAR: RLS policies para coin_adjustments

-- Ver se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'coin_adjustments';

-- Ver políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'coin_adjustments';
