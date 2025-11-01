# 🔴 THE REAL ISSUE FOUND!

## What's Actually Happening

You're getting: **"Invalid API key"**

This means your `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is wrong!

---

## ⚡ Quick Fix (1 Minute)

### Step 1: Get the Correct Key from Supabase

1. Go to: https://app.supabase.com/
2. Select your **startcup-amf** project
3. Click **Settings** (gear icon) in left sidebar
4. Click **API** in the menu
5. Look for **"Service Role (secret)"**
6. Click **COPY** button next to it
7. You now have the correct key ✅

### Step 2: Update Your .env.local

Open the file: `.env.local` in your project root

Find this line:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandzbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c
```

Replace everything after the `=` sign with the key you just copied from Supabase.

### Step 3: Restart Dev Server

In your terminal:
```bash
# Press Ctrl+C (stops the running server)
Ctrl+C

# Start it again
npm run dev

# Wait for "Ready in Xs" message
```

### Step 4: Test Again

1. Open http://localhost:3000
2. Login as admin
3. Go to Control Panel
4. Try to update a phase
5. Should work now! ✅

---

## 🎯 What's the Problem?

The service role key in your `.env.local` is **different** from what Supabase has now.

This can happen because:
- Key was regenerated in Supabase
- Key was copied incorrectly
- `.env.local` file has an old/wrong key

## Solution

Get the **current** key from Supabase dashboard and use that.

---

## ✅ How to Know It's Fixed

After restarting the dev server, you should see a **different error** or **success**:

### ✅ Best Case (Success)
```
✅ Evento atualizado para: Fase 1: Descoberta
```

### ⚠️ Different Error (Still Needs DB Fix)
```
❌ Erro ao buscar configuração do evento: No rows found
```
This means the API key is now OK, but the database needs the SQL fix.
→ Run the SQL from `RUN_THIS_FIRST.md`

### ❌ Same Error (Key Still Wrong)
```
❌ Erro ao buscar configuração do evento: Invalid API key
```
Double-check that you:
- Got the key from Supabase Settings > API
- Copied the FULL key (it's very long)
- Pasted it correctly in `.env.local`
- Restarted the dev server

---

## 📝 Checklist

- [ ] Logged into Supabase.com
- [ ] Opened Settings > API
- [ ] Copied the "Service Role" key
- [ ] Updated `.env.local` with the new key
- [ ] Saved `.env.local`
- [ ] Pressed Ctrl+C to stop dev server
- [ ] Ran `npm run dev` again
- [ ] Waited for "Ready" message
- [ ] Tested the phase update

---

## If It's Still Not Working

There might be TWO issues:
1. ❌ Invalid API key (you're fixing this now)
2. ❌ Missing database record (you'll fix this next)

### After Fixing the API Key:
1. If you get a **different error**, that's progress! ✅
2. Then use `RUN_THIS_FIRST.md` to fix the database
3. Then test again

---

## The Order of Fixes

```
1. Fix API Key (this document) ← Do this first
   ↓
2. (Restart dev server)
   ↓
3. If you still get error, run SQL fix (RUN_THIS_FIRST.md)
   ↓
4. (Restart dev server again)
   ↓
5. Test - should work! ✅
```

---

## Where Is .env.local?

Your project structure:
```
startcup-amf/
├── startcup-amf/          ← Your actual project
│   ├── .env.local         ← This file! ← Edit this
│   ├── src/
│   ├── package.json
│   ├── next.config.js
│   └── ...
└── ...
```

It's in the `startcup-amf` folder (the inner one with `src/`, `package.json`, etc.)

---

## Important Security Note

⚠️ **NEVER:**
- Share your `SUPABASE_SERVICE_ROLE_KEY` publicly
- Commit `.env.local` to Git (it's in `.gitignore`)
- Paste it in chat or bug reports

---

## Quick Visual Guide

```
Supabase Dashboard              Your Computer
┌─────────────────┐            ┌──────────────────┐
│ Settings > API  │            │ .env.local file  │
│                 │            │                  │
│ Service Role:   │            │ SERVICE_ROLE=... │
│ eyJhbGc... [📋] │────────────→│ eyJhbGc...      │
│ (COPY button)   │ Copy-paste  │                  │
└─────────────────┘            └──────────────────┘
                                       ↓
                                  Restart npm
                                       ↓
                                    Test! ✅
```

---

**Next Step:** Fix the API key as shown above, then let me know the result! 👉

If you get a different error, share it and we'll fix the database next.
