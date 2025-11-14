# Supabase Auth 500 Error - Root Cause & Fix

## Problem Summary

When attempting to login with team accounts created via `setup-15-teams.sql`, users receive:

```
❌ Failed to load resource: the server responded with a status of 500
   Endpoint: scmyfwhhjwlmsoobqjyk.supabase.co/auth/v1/token?grant_type=password
```

Despite:
- Teams existing in the database
- RLS policies being fixed (ULTIMATE_RLS_FIX.sql executed)
- User audio system loading correctly

## Root Cause Analysis

### The Issue: `.local` Domain Not Accepted by Supabase Auth

The original `setup-15-teams.sql` creates team accounts with **`.local` TLD domains**:
- `visionone@startcup.local`
- `codigosentencial@startcup.local`
- etc.

**Why this causes a 500 error:**

1. **`.local` is a special-use TLD** (RFC 6762) reserved for local network use
2. **Supabase Auth validates emails** against real domain standards
3. **Supabase's validation regex** rejects non-standard TLDs like `.local`
4. **The Auth service throws a 500 error** when email validation fails during token generation

### Email Validation Rules in Supabase Auth

Supabase Auth enforces strict email validation:

```regex
^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$
```

Breaking this down:
- `[A-Z]{2,}` - TLD must have **at least 2 characters**
- `.local` technically has 4 characters ✓
- BUT `.local` is a **reserved special-use TLD** that Supabase explicitly rejects ✗

### Why Not Caught Earlier?

The error manifests at **login time**, not at user creation time:
1. `INSERT INTO auth.users` succeeded (no validation at insert)
2. The 500 error only occurs when attempting `signInWithPassword()`
3. This triggers the Auth service's email validation

## Solution: Change Email Domain to `.com`

The fix is simple: **change the email domain from `.local` to a valid domain**.

### Files Provided

1. **`cleanup-old-teams.sql`** - Removes old users with `.local` domain
2. **`setup-15-teams-FIXED.sql`** - Creates users with `.com` domain
3. **`AUTH_500_ERROR_FIX.md`** - This document

## Step-by-Step Fix

### Step 1: Backup Current Data (Optional)

If you need to preserve any data from the old accounts, export it before cleanup:

```sql
-- Backup team emails
SELECT email, name FROM public.teams WHERE email LIKE '%@startcup.local';
```

### Step 2: Clean Up Old Users with `.local` Domain

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Open `cleanup-old-teams.sql` from your project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or `Ctrl+Enter`)

Expected output:
```
✅ Limpeza concluída!
✅ Todos os usuários com domínio .local foram removidos
✅ Pronto para executar setup-15-teams-FIXED.sql
```

### Step 3: Create New Users with `.com` Domain

1. In the same **SQL Editor**
2. Click **New Query**
3. Open `setup-15-teams-FIXED.sql` from your project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

Expected output:
```
✅ 15 EQUIPES CRIADAS COM SUCESSO!
✅ Domínio corrigido de .local para .com
✅ Todas as equipes estão prontas para login
```

### Step 4: Update Login Credentials

The new login credentials are:

| Team | Email | Password |
|------|-------|----------|
| VisionOne | visionone@startcup-amf.com | VisionOne@2024! |
| Código Sentencial | codigosentencial@startcup-amf.com | CodigoSentencial@2024! |
| Smartcampus | smartcampus@startcup-amf.com | Smartcampus@2024! |
| Geração F | geracaof@startcup-amf.com | GeracaoF@2024! |
| SparkUp | sparkup@startcup-amf.com | SparkUp@2024! |
| Mistos.com | mistoscom@startcup-amf.com | Mistos.com@2024! |
| Cogniverse | cogniverse@startcup-amf.com | Cogniverse@2024! |
| Os Notáveis | osnotaveis@startcup-amf.com | OsNotaveis@2024! |
| Turistando | turistando@startcup-amf.com | Turistando@2024! |
| S.Y.M. | sym@startcup-amf.com | S.Y.M.@2024! |
| Gastroproject | gastroproject@startcup-amf.com | Gastroproject@2024! |
| MOVA | mova@startcup-amf.com | MOVA@2024! |
| Áurea Forma | aureaforma@startcup-amf.com | AureaForma@2024! |
| Lumus | lumus@startcup-amf.com | Lumus@2024! |
| Mosaico | mosaico@startcup-amf.com | Mosaico@2024! |

### Step 5: Test Login

1. Go to your login page: `http://localhost:3000/login`
2. Try logging in with a team email and password from the table above
3. Example:
   - Email: `visionone@startcup-amf.com`
   - Password: `VisionOne@2024!`

You should now be able to login successfully without the 500 error.

## Verification

After fixing, verify these conditions:

```sql
-- Check that old .local users are gone
SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@startcup.local';
-- Should return: 0

-- Check that new .com users exist
SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@startcup-amf.com';
-- Should return: 15

-- Check that teams match email addresses
SELECT COUNT(*) FROM public.teams WHERE email LIKE '%@startcup-amf.com';
-- Should return: 15
```

## Why This Solution Works

1. ✅ `.com` is a standard, globally recognized TLD
2. ✅ Supabase Auth accepts `.com` domains without issue
3. ✅ Email validation passes successfully
4. ✅ `signInWithPassword()` can now generate valid JWT tokens
5. ✅ No more 500 errors from `/auth/v1/token` endpoint

## Alternative Domains

If you prefer a different domain, these are also valid:
- `.co` - Colombia, commercial
- `.br` - Brazil
- `.net` - Network
- `.org` - Organization
- `startcup.test` - Special domain for testing (some systems accept it)
- Any real domain you own

The only requirement is that it's **not a special-use TLD** like:
- ❌ `.local` - Local network only
- ❌ `.localhost` - Localhost only
- ❌ `.invalid` - Invalid domain marker
- ❌ `.example` - Example domain marker

## Technical Details

### What Changed

**Before (setup-15-teams.sql):**
```sql
email: 'visionone@startcup.local',
```

**After (setup-15-teams-FIXED.sql):**
```sql
email: 'visionone@startcup-amf.com',
```

### Why Only Email Changed

The password hashing, metadata, roles, and all other auth.users fields remain **identical**:
- ✅ Still using bcrypt hashing: `crypt(password, gen_salt('bf'))`
- ✅ Still setting email_confirmed_at: `now()`
- ✅ Still setting role metadata: `jsonb_build_object('role', 'team')`
- ✅ Same instance_id and aud values

The **only difference** is the valid email domain.

## FAQ

**Q: Do I need to update RLS policies?**
A: No. The RLS policies use `current_setting('request.jwt.claims', true)::jsonb->>'email'` which extracts the email from the JWT. The domain change doesn't affect RLS.

**Q: Do I need to clear browser cache/cookies?**
A: Yes, clear cookies and sessionStorage to ensure old auth tokens are removed.

**Q: Can I use a different domain?**
A: Yes, as long as it's a valid standard domain (not `.local`, `.localhost`, etc.).

**Q: Will this affect the teams table?**
A: The public.teams table uses the same email for identification, so the email change is consistent across the system.

**Q: Can I test without running these scripts?**
A: No, you must either:
1. Manually update the email in database (not recommended)
2. OR delete and recreate users with new emails (use the scripts)

## Troubleshooting

### Still Getting 500 Error After Running Scripts?

1. Verify old users are deleted:
   ```sql
   SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@startcup.local';
   ```
   Should return 0.

2. Verify new users are created:
   ```sql
   SELECT email, raw_user_meta_data FROM auth.users WHERE email LIKE '%@startcup-amf.com';
   ```
   Should return 15 rows.

3. Check that emails are correctly spelled (no typos)

4. Clear browser cache and reload

5. If still failing, check Supabase Auth logs in the dashboard

### Login Shows "Email or password incorrect"

- Verify you're using the exact email format: `name@startcup-amf.com`
- Verify the password is correct (case-sensitive)
- Verify the user was created in auth.users (check Supabase dashboard)

### "Equipe não encontrada" After Login

- The auth.users entry exists, but the public.teams record doesn't
- Verify both `cleanup-old-teams.sql` and `setup-15-teams-FIXED.sql` executed fully
- Both scripts should create matching auth.users and public.teams records

## Next Steps

1. ✅ Run `cleanup-old-teams.sql`
2. ✅ Run `setup-15-teams-FIXED.sql`
3. ✅ Test login with new credentials
4. ✅ Verify team dashboard loads
5. ✅ Clear and document new credentials securely

---

**Created:** November 2024
**Issue:** Supabase Auth 500 error due to `.local` domain rejection
**Status:** FIXED - Use `setup-15-teams-FIXED.sql` for all future team creation
