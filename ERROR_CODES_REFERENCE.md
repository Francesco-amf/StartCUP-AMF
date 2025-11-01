# Error Codes Reference

When the phase update fails, the error response includes a code that tells you exactly what's wrong.

## Common Error Codes

### ✅ Success (No Code)
```javascript
{
  success: true,
  message: "Evento atualizado para: Fase 1: Descoberta",
  phase: 1
}
```
**What it means:** Phase updated successfully!
**Action:** None needed.

---

### 🔍 PGRST116 - Not Found
```javascript
{
  error: "Erro ao buscar configuração do evento",
  details: "No rows found matching the query",
  code: "PGRST116",
  hint: null
}
```
**What it means:** The `event_config` record with ID `00000000-0000-0000-0000-000000000001` doesn't exist in the database.

**Fix:**
1. Run the SQL from `RUN_THIS_FIRST.md`
2. The SQL will create the missing record
3. Restart dev server
4. Try again

---

### 🔐 42501 - Insufficient Privileges (SELECT)
```javascript
{
  error: "Erro ao buscar configuração do evento",
  details: "new row violates row-level security policy \"...\""
  code: "42501",
  hint: "Check the current role's permissions..."
}
```
**What it means:** RLS policies are blocking the SELECT query.

**Fix:**
1. Run the SQL from `RUN_THIS_FIRST.md`
2. The SQL will replace restrictive policies with permissive ones
3. Restart dev server
4. Try again

---

### 🔐 42502 - Insufficient Privileges (INSERT/UPDATE)
```javascript
{
  error: "Erro ao atualizar fase",
  details: "new row violates row-level security policy"
  code: "42502",
  hint: "Check the current role's permissions..."
}
```
**What it means:** RLS policies are blocking the UPDATE query.

**Fix:**
1. Run the SQL from `RUN_THIS_FIRST.md`
2. The SQL will replace restrictive policies with permissive ones
3. Restart dev server
4. Try again

---

### 🌐 Connection Errors
```javascript
{
  error: "Erro ao buscar configuração do evento",
  details: "Failed to connect to Supabase",
  code: "ECONNREFUSED"
}
```
**What it means:** Can't connect to Supabase (network or credentials issue).

**Check:**
1. `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY` is not corrupted or expired
3. Your internet connection is working
4. Supabase is not having an outage

**Fix:**
1. Verify environment variables in `.env.local`
2. Get fresh credentials from Supabase > Settings > API Keys
3. Restart dev server
4. Try again

---

### 👤 403 Forbidden (Authentication)
```javascript
{
  error: "Acesso negado"
}
```
**What it means:** User is not authenticated or not an admin.

**Fix:**
1. Make sure you're logged in
2. Make sure your user has `role: 'admin'` in Supabase auth
3. Logout and login again
4. Try again

---

### ❌ Unknown Error
```javascript
{
  error: "Erro interno do servidor",
  details: null,
  code: null
}
```
**What it means:** Something unexpected happened. Check the server logs.

**Action:**
1. Check `npm run dev` output for error messages
2. Look for stack traces
3. Report the specific error if you need help

---

## How to Read Error Messages

### In Browser Console (F12 > Console)
```javascript
API Error Response: {
  status: 500,
  error: "Erro ao buscar configuração do evento",    // ← What went wrong
  details: "No rows found matching...",               // ← Why it went wrong
  code: "PGRST116",                                   // ← Error code
  hint: "..."                                         // ← How to fix it
}
```

### In Server Logs (npm run dev output)
```
🔍 Query result: {
  config: null,
  configError: {
    message: "...",
    code: "PGRST116",
    details: "..."
  }
}
```

---

## Troubleshooting by Error Code

| Code | Meaning | Solution |
|------|---------|----------|
| ✅ (none) | Success | Reload page |
| PGRST116 | Record not found | Run `RUN_THIS_FIRST.md` SQL |
| 42501 | Read denied | Run `RUN_THIS_FIRST.md` SQL |
| 42502 | Write denied | Run `RUN_THIS_FIRST.md` SQL |
| ECONNREFUSED | Can't connect | Check credentials |
| 403 | Not authorized | Verify user is admin |
| ETIMEDOUT | Timeout | Check network |
| (empty) | Unknown error | Check server logs |

---

## Quick Debug Checklist

When you get an error:

1. ✅ **Check the error code** - See what it means above
2. ✅ **Check the details** - It usually explains what's wrong
3. ✅ **Check browser console** - F12 > Console tab
4. ✅ **Check server logs** - Look at `npm run dev` output
5. ✅ **Try the fix** - Usually running `RUN_THIS_FIRST.md` SQL
6. ✅ **Restart dev server** - Ctrl+C then `npm run dev`
7. ✅ **Test again** - Try updating the phase

---

## Still Having Issues?

1. Read `RUN_THIS_FIRST.md` - Quick fix for most errors
2. Read `TROUBLESHOOTING_EVENT_CONFIG.md` - Detailed troubleshooting
3. Run queries from `VERIFY_DATABASE.md` - Check database state
4. Share the full error message (code + details + hint) for help

Most errors are fixed by running the SQL from `RUN_THIS_FIRST.md`!
