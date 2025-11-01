-- ==========================================
-- FIX EVENT_CONFIG RLS AND ENSURE RECORD EXISTS
-- ==========================================
-- This script fixes RLS policies to allow service_role access
-- and ensures the default record exists

-- 1. Drop existing restrictive policies on event_config
DROP POLICY IF EXISTS "Todos podem ver config do evento" ON event_config;
DROP POLICY IF EXISTS "Admin pode atualizar config" ON event_config;
DROP POLICY IF EXISTS "Enable read event_config" ON event_config;
DROP POLICY IF EXISTS "Enable update event_config" ON event_config;

-- 2. Enable RLS on event_config (if not already enabled)
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policies that allow all access
-- These policies use USING (true) which means anyone can read/update
-- The service_role key will bypass RLS entirely anyway, but this ensures
-- normal authenticated users can also access the event config

CREATE POLICY "Allow all read access" ON event_config
  FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert access" ON event_config
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update access" ON event_config
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all delete access" ON event_config
  FOR DELETE
  USING (true);

-- 4. Ensure the default event_config record exists
-- First, delete any existing records
DELETE FROM event_config WHERE id != '00000000-0000-0000-0000-000000000001';

-- Then insert the default if it doesn't exist
INSERT INTO event_config (
  id,
  event_name,
  current_phase,
  event_started,
  event_ended,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'StartCup AMF 2025',
  0,
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- 5. Verify the record exists
SELECT
  'Event Config Status' as status,
  id,
  event_name,
  current_phase,
  event_started,
  event_ended,
  event_start_time,
  phase_1_start_time,
  phase_2_start_time,
  phase_3_start_time,
  phase_4_start_time,
  phase_5_start_time,
  created_at,
  updated_at
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 6. Verify RLS policies
SELECT
  'RLS Policies' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'event_config'
ORDER BY cmd, policyname;
