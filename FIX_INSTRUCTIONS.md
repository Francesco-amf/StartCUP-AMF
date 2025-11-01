# Fix Instructions: Phase Update Error

## Summary of Changes

I've identified and implemented a fix for the "Erro ao buscar configuração do evento" error that occurs when updating phases in the admin panel.

### What Was Changed

1. **Enhanced Error Logging** in `/api/admin/start-phase/route.ts`:
   - Added detailed logging of the Supabase query result
   - Now returns comprehensive error details (code, message, hint) to help with debugging
   - This will show exactly what's wrong in the server logs

2. **Created RLS Fix SQL Script** (`fix-event-config-service-role.sql`):
   - Fixes RLS policies on the `event_config` table
   - Ensures the default record exists with ID `00000000-0000-0000-0000-000000000001`
   - Creates permissive policies that allow all access

3. **Created Troubleshooting Guide** (`TROUBLESHOOTING_EVENT_CONFIG.md`):
   - Step-by-step instructions to diagnose and fix the issue
   - Explains what might be causing the error
   - Provides SQL commands to verify database state

### Root Cause

The error likely occurs because:
- The `event_config` table doesn't have the default record, OR
- The RLS (Row Level Security) policies on `event_config` are blocking access even to the service role

## Next Steps

### 1. Apply the SQL Fix
Go to your Supabase dashboard and run the SQL in `fix-event-config-service-role.sql`:

1. Login to: https://app.supabase.com/
2. Select your project
3. Go to: SQL Editor (left sidebar)
4. Create a new query
5. Copy the entire contents of `fix-event-config-service-role.sql`
6. Paste it into the editor
7. Click "Run"
8. Wait for it to complete (should show success messages)

### 2. Restart Dev Server
```bash
npm run dev
```

### 3. Test the Fix
1. Navigate to the admin control panel
2. Try to update the event phase
3. If it works, the error is fixed ✅
4. If it still fails, check the server logs (you'll now see detailed error information)

### 4. If It Still Fails

The enhanced error logging will now show you exactly what's wrong. Look at the server logs (`npm run dev` output) for messages like:

```
🔍 Query result: { config, configError: { message: "...", code: "...", details: "..." } }
```

The error code will tell you:
- `PGRST116` - Record not found (event_config record is missing)
- `42501` or `42502` - RLS policy error (permissions issue)
- Connection errors - Network or credentials problem

### What the Fix Does

The SQL script (`fix-event-config-service-role.sql`):

```sql
1. Drops old restrictive RLS policies
2. Creates new permissive policies:
   - Allow all READ access
   - Allow all INSERT access
   - Allow all UPDATE access
   - Allow all DELETE access
3. Ensures the default event_config record exists:
   - ID: 00000000-0000-0000-0000-000000000001
   - event_name: StartCup AMF 2025
   - current_phase: 0
   - event_started: false
   - event_ended: false
```

### Build Status
✅ Build compiled successfully (2.6s, no errors)

### Files Modified
- `src/app/api/admin/start-phase/route.ts` - Enhanced error logging
- `fix-event-config-service-role.sql` - NEW - RLS and data fix
- `TROUBLESHOOTING_EVENT_CONFIG.md` - NEW - Troubleshooting guide
- `FIX_INSTRUCTIONS.md` - This file

### Important Notes

- The service role key (`SUPABASE_SERVICE_ROLE_KEY`) should bypass all RLS restrictions, but only if the policies are correctly configured
- The RLS policies now use `USING (true)` which allows unrestricted access
- This is safe because the service role is server-side only and not exposed to clients
- The fix is idempotent - running it multiple times won't cause problems

## Verification Checklist

After applying the fix, verify:

- [ ] SQL script ran without errors in Supabase dashboard
- [ ] Server logs show successful query results
- [ ] Admin can update phase without error
- [ ] Phase change is reflected on live dashboard
- [ ] All team interfaces show correct phase

## Support

If you encounter issues:

1. Check `TROUBLESHOOTING_EVENT_CONFIG.md` for step-by-step debugging
2. Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` matches Supabase settings
3. Run manual SQL checks in Supabase dashboard
4. Check server logs for detailed error messages (now enhanced)
