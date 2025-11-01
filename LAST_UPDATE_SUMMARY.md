# Summary of Latest Changes

## Issue
Error "Erro ao buscar configuração do evento" when trying to update event phases in the admin panel.

## Root Cause
The `/api/admin/start-phase` endpoint couldn't fetch the `event_config` record from Supabase because:
1. The record with ID `00000000-0000-0000-0000-000000000001` doesn't exist in the database, OR
2. RLS policies on the `event_config` table were blocking access

## Solution Implemented

### 1. Enhanced Error Logging
**File:** `src/app/api/admin/start-phase/route.ts`

Added detailed logging at lines 44-70:
```typescript
- Logs when query starts
- Logs full query result (data and error)
- Returns detailed error info to frontend (code, message, details, hint)
```

Now when an error occurs, you'll see in server logs:
```
🔍 Query result: { config, configError: { message: "...", code: "...", details: "..." } }
```

### 2. Improved Client Error Display
**File:** `src/components/PhaseController.tsx`

Enhanced error handling at lines 54-66:
```typescript
- Logs full error response to browser console
- Shows detailed error message to user (includes error details)
- Makes debugging much easier
```

Now when an error occurs, you'll see in browser console:
```javascript
API Error Response: {
  status: 500,
  error: "Erro ao buscar configuração do evento",
  details: "...",
  code: "...",
  hint: "..."
}
```

### 3. Database Fix Script
**File:** `fix-event-config-service-role.sql`

Contains SQL to:
- Drop overly restrictive RLS policies
- Create permissive policies that allow all access
- Ensure the default `event_config` record exists
- Set it to Phase 0 (Preparação)

### 4. Documentation
Created 4 new guide documents:

- **`RUN_THIS_FIRST.md`** ⭐ **START HERE**
  - Quick 2-minute fix with exact SQL to copy-paste
  - Step-by-step Supabase instructions
  - Simple verification

- **`FIX_INSTRUCTIONS.md`**
  - Detailed explanation of what was changed
  - Step-by-step instructions for applying the fix
  - Expected results and next steps

- **`VERIFY_DATABASE.md`**
  - SQL queries to check database state
  - Troubleshooting matrix
  - Environment variable verification

- **`TROUBLESHOOTING_EVENT_CONFIG.md`**
  - Root cause analysis
  - Detailed debugging steps
  - Manual verification in Supabase

## What You Need To Do

### Option 1: Quick Fix (Recommended)
1. Open `RUN_THIS_FIRST.md` in your project
2. Follow the 4 steps (takes ~2 minutes)
3. Test the admin panel

### Option 2: Manual Fix
If you prefer, run the SQL from `fix-event-config-service-role.sql` directly in Supabase SQL Editor.

### Option 3: Understand the Issue First
Read `FIX_INSTRUCTIONS.md` for detailed explanation before applying the fix.

## Files Modified/Created

### Modified (2 files):
- ✏️ `src/app/api/admin/start-phase/route.ts` - Enhanced error logging
- ✏️ `src/components/PhaseController.tsx` - Better error handling

### Created (5 files):
- 📄 `fix-event-config-service-role.sql` - Database fix SQL
- 📄 `RUN_THIS_FIRST.md` - ⭐ Quick start guide
- 📄 `FIX_INSTRUCTIONS.md` - Detailed instructions
- 📄 `VERIFY_DATABASE.md` - Verification queries
- 📄 `TROUBLESHOOTING_EVENT_CONFIG.md` - Troubleshooting guide

## Build Status
✅ **Successfully compiled** (2.6s, no errors)

## Testing
After applying the fix:
1. Restart `npm run dev`
2. Login as admin
3. Go to Control Panel
4. Try to update a phase
5. Should work without error! ✅

## Error Codes (for debugging)
If the error persists after applying the fix:
- **No error in console** = Fix worked! Try again
- **PGRST116** = Record not found (SQL didn't create it)
- **42501/42502** = Permission/RLS error (policies still restrictive)
- **Connection error** = Supabase credentials or network issue

## Questions?
Check these documents in order:
1. `RUN_THIS_FIRST.md` - For quick fix
2. `VERIFY_DATABASE.md` - To check database state
3. `TROUBLESHOOTING_EVENT_CONFIG.md` - For detailed help

## Quick Reference

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://scmyfwhhjwlmsoobqjyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ← MUST BE CORRECT
NEXT_PUBLIC_EVENT_CONFIG_ID=00000000-0000-0000-0000-000000000001
```

### Default event_config Record
```sql
id: 00000000-0000-0000-0000-000000000001
event_name: StartCup AMF 2025
current_phase: 0 (Preparação)
event_started: false
event_ended: false
```

### API Endpoint
- **POST** `/api/admin/start-phase`
- **Body:** `{ "phase": 0-5 }`
- **Returns:** Success message or detailed error

---

## Next Steps
👉 **Start with:** Open `RUN_THIS_FIRST.md` and follow the instructions!

Everything else is ready. You just need to:
1. Run the SQL in Supabase
2. Restart the dev server
3. Test the phase update

**That's it!** 🎉
