# 🔑 Fix: "Invalid API key" Error

## The Real Problem

The error "Invalid API key" means your `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is incorrect, expired, or corrupted.

## Solution: Get the Correct Service Role Key

### Step 1: Login to Supabase Dashboard
- Go to: https://app.supabase.com/
- Select your **startcup-amf** project

### Step 2: Go to Settings > API Keys

In the left sidebar:
```
Project Settings (gear icon)
    ↓
API
    ↓
Project API Keys
```

Or direct URL path:
```
https://app.supabase.com/project/[project-id]/settings/api
```

### Step 3: Copy the Service Role Key

You should see:
```
┌─────────────────────────────────────────┐
│ Project API Keys                        │
│                                         │
│ Anon Key                                │
│ eyJhbGciOiJIUzI1NiIs...                │
│                                         │
│ Service Role (secret)                   │
│ eyJhbGciOiJIUzI1NiIs...  [COPY] ← HERE│
│                                         │
│ ⚠️ NEVER share this key publicly!       │
└─────────────────────────────────────────┘
```

Click the **[COPY]** button next to "Service Role"

### Step 4: Update Your .env.local

Open your `.env.local` file and replace the `SUPABASE_SERVICE_ROLE_KEY`:

**Before:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandzbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c
```

**After (paste the key you just copied):**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....[YOUR_NEW_KEY_HERE]....
```

### Step 5: Restart Development Server

```bash
# Press Ctrl+C to stop the current server
Ctrl+C

# Start it again
npm run dev

# Wait for "Ready in Xs" message
```

### Step 6: Test the Fix

1. Open http://localhost:3000
2. Login as admin
3. Go to Control Panel
4. Try to update the phase
5. Should work now! ✅

---

## ⚠️ Important Notes

- The Service Role Key is **secret** - never share it or commit it to Git
- The `.env.local` file should **never** be committed to version control (it's in `.gitignore`)
- The key should be the full token starting with `eyJhbGc...`
- Keys may expire or be regenerated - always get them from the Supabase dashboard

---

## Still Getting Error?

### Check These Things:

1. **Did you copy the whole key?**
   - Make sure you have the entire token
   - It should be very long (several hundred characters)

2. **Did you restart the dev server?**
   - Changes to `.env.local` only take effect after restart
   - Press Ctrl+C and run `npm run dev` again

3. **Is the key correct?**
   - Compare it with what's shown in Supabase dashboard
   - They should be identical

4. **Check for extra spaces:**
   - Make sure there are no spaces before or after the key
   - Format should be: `SUPABASE_SERVICE_ROLE_KEY=eyJhb...`

---

## Verify the Key Format

A valid Service Role key should:
- ✅ Start with `eyJhbGc`
- ✅ Be very long (400+ characters)
- ✅ Contain only alphanumeric characters, `-`, `_`, and `.`
- ✅ Have exactly 2 dots (.) dividing 3 parts

Example format:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandzbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.
aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c
```

---

## Quick Checklist

- [ ] Logged into Supabase.com
- [ ] Went to Project Settings > API
- [ ] Copied Service Role key
- [ ] Pasted into `.env.local` (replacing the old key)
- [ ] Saved `.env.local`
- [ ] Stopped dev server (Ctrl+C)
- [ ] Restarted dev server (`npm run dev`)
- [ ] Waited for "Ready" message
- [ ] Tested phase update
- [ ] ✅ It works!

---

## If It Still Doesn't Work

1. Check the exact error in browser console (F12 > Console)
2. Note the error message
3. Check `ERROR_CODES_REFERENCE.md` for that specific error
4. Follow the solution for that error code

Most likely you'll see one of:
- ✅ Success! (error is fixed)
- ❌ "Invalid API key" (key is still wrong - repeat steps 1-5)
- ❌ "PGRST116" (missing database record - run the SQL fix)
- ❌ RLS policy error (need to run database fix SQL)

---

## Your .env.local Should Look Like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://scmyfwhhjwlmsoobqjyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandzbXNvb2JxanlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDUwMDksImV4cCI6MjA3NzQyMTAwOX0.9ibCEN9XzONOmJE0TWNWdZnn5RD5OlaXhiI1tGZJmBM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandzbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c
NEXT_PUBLIC_EVENT_CONFIG_ID=00000000-0000-0000-0000-000000000001
```

The ONLY thing that might need updating is the `SUPABASE_SERVICE_ROLE_KEY`.

---

## Next Steps After Fixing the Key

1. ✅ Update `.env.local` with correct key
2. ✅ Restart dev server
3. Then run the database fix SQL from `RUN_THIS_FIRST.md`
4. Then test the phase update

You might need to do both:
- Fix the API key (this document) ← You are here
- Fix the database (RUN_THIS_FIRST.md) ← Do this next

---

**Let me know once you've updated the key and restarted the server!** 👉
