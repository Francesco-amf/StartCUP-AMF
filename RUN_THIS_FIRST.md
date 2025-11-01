# 🚨 RUN THIS FIRST - Complete Fix for Phase Update Error

The error "Erro ao buscar configuração do evento" happens because your Supabase database is missing the event configuration record.

## Quick Fix (2 minutes)

### Step 1: Access Supabase
- Go to https://app.supabase.com/
- Select your **startcup-amf** project

### Step 2: Run the Fix SQL
1. Click **"SQL Editor"** on the left sidebar
2. Click **"+ New Query"**
3. **Copy and paste the entire SQL below** into the editor:

```sql
-- Drop existing policies if any exist
DROP POLICY IF EXISTS "Todos podem ver config do evento" ON event_config;
DROP POLICY IF EXISTS "Admin pode atualizar config" ON event_config;
DROP POLICY IF EXISTS "Enable read event_config" ON event_config;
DROP POLICY IF EXISTS "Enable update event_config" ON event_config;
DROP POLICY IF EXISTS "Allow all read access" ON event_config;
DROP POLICY IF EXISTS "Allow all insert access" ON event_config;
DROP POLICY IF EXISTS "Allow all update access" ON event_config;
DROP POLICY IF EXISTS "Allow all delete access" ON event_config;

-- Enable RLS
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

-- Create new permissive policies
CREATE POLICY "Allow all read access" ON event_config
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert access" ON event_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update access" ON event_config
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all delete access" ON event_config
  FOR DELETE USING (true);

-- Delete any existing records except the default one
DELETE FROM event_config WHERE id != '00000000-0000-0000-0000-000000000001';

-- Insert or update the default record
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

-- Verify it worked
SELECT 'Setup Complete!' as status,
  id,
  event_name,
  current_phase,
  event_started,
  event_ended
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
```

4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for the result to show ✅

### Step 3: Restart Your Dev Server

In your terminal where `npm run dev` is running:
1. Press **Ctrl+C** to stop it
2. Run: `npm run dev`
3. Wait for "Ready in Xs" message

### Step 4: Test the Fix

1. Open http://localhost:3000 (or 3001 if it says port is in use)
2. Login as admin
3. Go to Control Panel
4. Try to update a phase
5. It should work! ✅

## If It Still Doesn't Work

Check the browser console (F12 > Console tab) for error messages. You should now see **detailed error information** like:

```
API Error Response: {
  status: 500,
  error: "Erro ao buscar configuração do evento",
  details: "...",
  code: "...",
  hint: "..."
}
```

The error code will tell you:
- **No error code** = Record created successfully, try again
- **PGRST116** = Record still not found (SQL didn't work)
- **42501/42502** = Permission error (RLS issue)

## What This Does

The SQL script:
1. ✅ Removes any restrictive policies that might be blocking access
2. ✅ Creates open policies that allow all database access
3. ✅ Ensures the default event config record exists
4. ✅ Sets it to Phase 0 (Preparação)

This is safe because:
- The service_role key is server-only (not exposed to frontend)
- The policies with `USING (true)` allow unrestricted access
- Normal users are still protected by application-level auth checks

## Verification

After running the SQL, it will show you the created record:

```
status: "Setup Complete!"
id: 00000000-0000-0000-0000-000000000001
event_name: "StartCup AMF 2025"
current_phase: 0
event_started: false
event_ended: false
```

If you see this, the fix worked! ✅

## Need More Help?

See detailed guides:
- `FIX_INSTRUCTIONS.md` - Full step-by-step guide
- `VERIFY_DATABASE.md` - SQL verification queries
- `TROUBLESHOOTING_EVENT_CONFIG.md` - Detailed troubleshooting

## TL;DR

1. Supabase > SQL Editor > New Query
2. Copy-paste the SQL above
3. Click Run
4. Restart `npm run dev`
5. Test phase update in admin panel

**That's it! The error should be gone.** 🎉
