# Troubleshooting: "Erro ao buscar configuração do evento"

## Problem
When attempting to update the event phase in the admin panel, the following error appears:
```
Erro ao buscar configuração do evento
```

## Root Cause Analysis
This error occurs when the `/api/admin/start-phase` endpoint fails to fetch the `event_config` record from Supabase with ID `00000000-0000-0000-0000-000000000001`.

The API uses the service_role key to bypass RLS policies, but the query is still failing. This can happen due to:

1. **Missing Record**: The `event_config` table doesn't have the default record
2. **RLS Policies**: The table has overly restrictive RLS policies
3. **Invalid Service Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is incorrect or expired
4. **Table Structure Mismatch**: The table schema doesn't match what the API expects

## Solution

### Step 1: Access Supabase Dashboard
Go to: https://app.supabase.com/ and select your project

### Step 2: Open SQL Editor
Click on "SQL Editor" in the left sidebar

### Step 3: Run the Fix Script
Copy and paste the contents of `fix-event-config-service-role.sql` into the SQL editor and click "Run".

This script will:
- Drop any existing restrictive RLS policies on event_config
- Enable RLS with permissive policies that allow all access
- Ensure the default event_config record exists with ID `00000000-0000-0000-0000-000000000001`
- Verify the record and policies were created correctly

### Step 4: Verify Environment Variables
Check that your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=https://scmyfwhhjwlmsoobqjyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_EVENT_CONFIG_ID=00000000-0000-0000-0000-000000000001
```

The `SUPABASE_SERVICE_ROLE_KEY` must match the one from Supabase Dashboard > Settings > API Keys > service_role

### Step 5: Restart Development Server
```bash
npm run dev
```

The development server will automatically reload and pick up the SQL changes.

### Step 6: Test the Fix
1. Go to the admin control panel
2. Try to update the phase
3. Check the browser console for detailed error messages
4. If it still fails, the error details should now show more information about what went wrong

## Debugging

If the issue persists, check the server logs (`npm run dev` output) for detailed error information:

```
🔍 Query result: { config, configError: { message: "...", code: "...", details: "..." } }
```

The error code and message will indicate:
- `PGRST116` - Record not found (event_config doesn't exist)
- RLS policy errors - Permissions issue
- Connection errors - Network or credentials issue

## Quick Checklist

- [ ] Service role key is correct (copy from Supabase Settings > API Keys)
- [ ] `event_config` table has the record with ID `00000000-0000-0000-0000-000000000001`
- [ ] RLS policies on `event_config` table allow read/update access
- [ ] Environment variables are correctly set in `.env.local`
- [ ] Development server has been restarted after changes

## Alternative: Manual Check in Supabase

If you want to manually verify without running SQL:

1. Go to Supabase Dashboard > SQL Editor
2. Run:
```sql
SELECT * FROM event_config WHERE id = '00000000-0000-0000-0000-000000000001';
```

If this returns no rows, the record is missing and needs to be inserted.

3. Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'event_config';
```

The policies should use `USING (true)` to allow all access.
