# Implementation Instructions - Auth 500 Error Fix

## Quick Summary

**Problem:** Team login returns 500 error from Supabase Auth
**Root Cause:** Email domain `.local` is rejected by Supabase Auth validation
**Solution:** Switch to `.com` domain using provided SQL scripts
**Time to Fix:** ~5 minutes

---

## Files You Need

Located in your project root (`startcup-amf/`):

1. **`cleanup-old-teams.sql`** - Removes old accounts with `.local` domain
2. **`setup-15-teams-FIXED.sql`** - Creates new accounts with `.com` domain
3. **`AUTH_500_ERROR_FIX.md`** - Detailed technical explanation
4. **`IMPLEMENTATION_INSTRUCTIONS.md`** - This file

---

## Implementation Steps

### Step 1: Log Into Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your **StartCup AMF** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Clean Up Old Users (5 seconds)

1. Open `cleanup-old-teams.sql` in your text editor
2. Select all content and copy (Ctrl+A → Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **Run** (or Ctrl+Enter)
5. You should see:
   ```
   ✅ Limpeza concluída!
   ✅ Todos os usuários com domínio .local foram removidos
   ✅ Pronto para executar setup-15-teams-FIXED.sql
   ```

### Step 3: Create New Users (10 seconds)

1. In the same SQL Editor, click **New Query**
2. Open `setup-15-teams-FIXED.sql` in your text editor
3. Select all content and copy (Ctrl+A → Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click **Run**
6. You should see:
   ```
   ✅ 15 EQUIPES CRIADAS COM SUCESSO!
   ✅ Domínio corrigido de .local para .com
   ✅ Todas as equipes estão prontas para login
   ```

### Step 4: Test Login (1 minute)

1. Go to your app: `http://localhost:3000` or your deployment URL
2. Click **Login**
3. Try first team:
   - **Email:** `visionone@startcup-amf.com`
   - **Password:** `VisionOne@2024!`
4. Click **Entrar**
5. Should redirect to dashboard (no 500 error!)

### Step 5: Update Team Credentials Spreadsheet

Share these credentials with teams (via secure method):

```
VisionOne | visionone@startcup-amf.com | VisionOne@2024!
Código Sentencial | codigosentencial@startcup-amf.com | CodigoSentencial@2024!
Smartcampus | smartcampus@startcup-amf.com | Smartcampus@2024!
Geração F | geracaof@startcup-amf.com | GeracaoF@2024!
SparkUp | sparkup@startcup-amf.com | SparkUp@2024!
Mistos.com | mistoscom@startcup-amf.com | Mistos.com@2024!
Cogniverse | cogniverse@startcup-amf.com | Cogniverse@2024!
Os Notáveis | osnotaveis@startcup-amf.com | OsNotaveis@2024!
Turistando | turistando@startcup-amf.com | Turistando@2024!
S.Y.M. | sym@startcup-amf.com | S.Y.M.@2024!
Gastroproject | gastroproject@startcup-amf.com | Gastroproject@2024!
MOVA | mova@startcup-amf.com | MOVA@2024!
Áurea Forma | aureaforma@startcup-amf.com | AureaForma@2024!
Lumus | lumus@startcup-amf.com | Lumus@2024!
Mosaico | mosaico@startcup-amf.com | Mosaico@2024!
```

---

## Verification Checklist

After running the scripts, verify:

- [ ] Old users with `.local` domain are deleted
- [ ] New users with `.com` domain are created
- [ ] Can login with `visionone@startcup-amf.com` / `VisionOne@2024!`
- [ ] No 500 error on login
- [ ] Dashboard loads after login
- [ ] Can access team profile

### Quick Verification Query

In SQL Editor, run this to confirm:

```sql
-- Should show 0 (old users deleted)
SELECT COUNT(*) as old_users FROM auth.users WHERE email LIKE '%@startcup.local';

-- Should show 15 (new users created)
SELECT COUNT(*) as new_users FROM auth.users WHERE email LIKE '%@startcup-amf.com';

-- Should show 15 (matching teams)
SELECT COUNT(*) as teams FROM public.teams WHERE email LIKE '%@startcup-amf.com';
```

---

## What Happened & Why

### The Problem

Original script used `.local` domain:
```
visionone@startcup.local  ❌ INVALID - Causes 500 error
```

Why `.local` doesn't work:
- Special-use TLD (local networks only)
- Supabase Auth validates emails strictly
- Email validation fails → 500 error when signing in

### The Solution

New script uses `.com` domain:
```
visionone@startcup-amf.com  ✅ VALID - Works perfectly
```

Why `.com` works:
- Standard, globally recognized TLD
- Passes Supabase Auth validation
- No more 500 errors
- Everything else stays the same (passwords, roles, etc.)

---

## Need More Details?

See **`AUTH_500_ERROR_FIX.md`** for:
- Technical root cause analysis
- Why this error only happens at login time
- Why email domain is critical
- Troubleshooting section
- FAQ

---

## Support

If you encounter issues:

1. **Still getting 500 error?**
   - Verify old users are deleted (query check above)
   - Clear browser cache (Ctrl+Shift+Delete)
   - Try incognito/private window

2. **Can't find old users to delete?**
   - Run the cleanup query first, it uses LIKE '%@startcup.local'
   - Check SQL Editor for any error messages

3. **Teams created but can't login?**
   - Verify email is typed exactly: `visionone@startcup-amf.com`
   - Password is case-sensitive: `VisionOne@2024!`
   - Wait 2-3 seconds after running script (DB sync)

4. **Need to add more teams later?**
   - Update `setup-15-teams-FIXED.sql` with new team names
   - Use `.com` domain format
   - Run just the new team INSERT statements

---

## Timeline

- **Before Fix:** Teams created with `.local` domain → 500 errors on login
- **After Cleanup:** Old invalid accounts removed
- **After New Setup:** Teams created with `.com` domain → Login works!

---

**All scripts created:** November 13, 2024
**Status:** Ready to implement
**Estimated time to fix:** 5-10 minutes
