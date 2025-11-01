# Verify Database Configuration

## Quick Verification in Supabase

To verify that the fix was applied correctly, run these queries in your Supabase SQL Editor.

### 1. Check if event_config Record Exists

```sql
SELECT
  id,
  event_name,
  current_phase,
  event_started,
  event_ended,
  created_at,
  updated_at
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Expected Result:** One row with the default event configuration

```
id: 00000000-0000-0000-0000-000000000001
event_name: StartCup AMF 2025
current_phase: 0
event_started: false
event_ended: false
created_at: [some timestamp]
updated_at: [some timestamp]
```

If this returns **no rows**, the record is missing and the fix SQL script should be run.

### 2. Check RLS Policies on event_config

```sql
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'event_config'
ORDER BY cmd, policyname;
```

**Expected Result:** Four policies, all with `USING (true)` condition

```
- Allow all delete access (DELETE)
- Allow all insert access (INSERT)
- Allow all read access (SELECT)
- Allow all update access (UPDATE)
```

All should use `true` in the USING clause, allowing unrestricted access.

### 3. Check RLS Status on Table

```sql
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'event_config';
```

**Expected Result:**

```
tablename: event_config
rowsecurity: true
```

RLS should be enabled (true), but with permissive policies (true conditions).

### 4. Verify Service Role Can Access

This query uses the service role (run via Supabase dashboard):

```sql
-- This should return the event_config record
SELECT * FROM event_config WHERE id = '00000000-0000-0000-0000-000000000001';
```

If this fails, there's an RLS policy issue.

### 5. Full event_config Table Structure

```sql
-- Check the table columns and constraints
\d event_config
```

Should show:

```sql
CREATE TABLE event_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) DEFAULT 'StartCup AMF 2025',
  current_phase INTEGER DEFAULT 0,
  event_started BOOLEAN DEFAULT FALSE,
  event_ended BOOLEAN DEFAULT FALSE,
  phase_1_start_time TIMESTAMP,
  phase_2_start_time TIMESTAMP,
  phase_3_start_time TIMESTAMP,
  phase_4_start_time TIMESTAMP,
  phase_5_start_time TIMESTAMP,
  event_start_time TIMESTAMP,
  event_end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## What Each Timestamp Column Is For

- **event_start_time** - When the event officially started (phase >= 1)
- **phase_1_start_time** - When phase 1 was activated
- **phase_2_start_time** - When phase 2 was activated
- **phase_3_start_time** - When phase 3 was activated
- **phase_4_start_time** - When phase 4 was activated
- **phase_5_start_time** - When phase 5 was activated
- **event_end_time** - When event ended (usually when phase goes back to 0)
- **created_at** - When this config record was created (should be early)
- **updated_at** - When this record was last updated

## Full Diagnostic Query

Run this to check everything at once:

```sql
-- 1. Check record exists
SELECT 'EVENT_CONFIG_RECORD' as test, COUNT(*) as count FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001'

UNION ALL

-- 2. Check RLS is enabled
SELECT 'RLS_ENABLED' as test,
  CASE WHEN rowsecurity THEN 1 ELSE 0 END as count
FROM pg_tables WHERE tablename = 'event_config'

UNION ALL

-- 3. Check RLS policies exist
SELECT 'RLS_POLICIES' as test, COUNT(*) as count FROM pg_policies
WHERE tablename = 'event_config';
```

## Troubleshooting

### If record doesn't exist:
Run the fix SQL script: `fix-event-config-service-role.sql`

### If RLS policies are wrong:
Run the fix SQL script: `fix-event-config-service-role.sql`

### If RLS is disabled (rowsecurity = false):
The table doesn't have RLS protection. The fix script will enable it with permissive policies.

## Environment Variables to Verify

In your `.env.local`, verify these exist and are correct:

```env
NEXT_PUBLIC_SUPABASE_URL=https://scmyfwhhjwlmsoobqjyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your anon key]
SUPABASE_SERVICE_ROLE_KEY=[your service role key - MUST BE CORRECT]
NEXT_PUBLIC_EVENT_CONFIG_ID=00000000-0000-0000-0000-000000000001
```

The `SUPABASE_SERVICE_ROLE_KEY` must match exactly what's in:
- Supabase Dashboard > Settings > API > Project API Keys > service_role

## Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No event_config record found | Record not created | Run fix SQL script |
| RLS policy error (PGRST) | Restrictive policies | Run fix SQL script |
| 403 Forbidden error | Authentication/credentials issue | Verify service role key |
| Timeout errors | Network/connection issue | Verify Supabase URL is correct |
| "Record not found" error | Querying wrong ID | Verify ID is `00000000-0000-0000-0000-000000000001` |

## Testing the API Locally

Once the database is fixed, restart your dev server and test:

```bash
npm run dev
```

Then in your browser or using curl:

```bash
curl -X POST http://localhost:3000/api/admin/start-phase \
  -H "Content-Type: application/json" \
  -H "Cookie: [your auth cookie]" \
  -d '{"phase": 1}'
```

You should get either:
- Success: `{ "success": true, "message": "...", "phase": 1 }`
- Or a detailed error if there's still an issue (check server logs)
