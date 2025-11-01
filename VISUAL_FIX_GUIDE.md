# 🎯 Visual Step-by-Step Fix Guide

## The Problem

```
Admin tries to update phase
           ↓
API queries event_config
           ↓
❌ Record not found OR ❌ Permission denied
           ↓
Error: "Erro ao buscar configuração do evento"
```

## The Solution

```
Run SQL Fix
    ↓
Create/update event_config record
    ↓
Fix RLS policies to allow access
    ↓
Restart dev server
    ↓
Try again
    ↓
✅ Phase updates successfully!
```

---

## 📍 Step-by-Step Visual Guide

### STEP 1: Open Supabase Dashboard

```
1. Go to: https://app.supabase.com/
2. Login with your account
3. Select your "startcup-amf" project

You should see a dashboard like:
┌─────────────────────────────────────┐
│ startcup-amf                        │
│                                     │
│ [SQL Editor] ← CLICK HERE          │
│ [Table Editor]                      │
│ [Authentication]                    │
│ [Database]                          │
└─────────────────────────────────────┘
```

### STEP 2: Open SQL Editor

```
Left sidebar menu:
├─ [Project]
├─ [API Keys]
├─ [SQL Editor] ← CLICK HERE
│   ├─ + New Query
│   ├─ Quickstarts
│   └─ [Recent Queries]
```

### STEP 3: Create New Query

```
In SQL Editor:
┌─────────────────────────────────────┐
│ [+ New Query]  [Run]  [Share]      │
│                                     │
│ SQL Editor                          │
│                                     │
│ [Paste your SQL here]               │
│                                     │
│ Ctrl+Enter to Run                   │
└─────────────────────────────────────┘

Click "+ New Query"
```

### STEP 4: Copy and Paste SQL

```
Find and open: fix-event-config-service-role.sql
in your project directory

Copy ALL the SQL code

Paste it in the SQL Editor
```

### STEP 5: Run the SQL

```
In SQL Editor:
┌─────────────────────────────────────┐
│ [+ New Query]  [Run] ← CLICK HERE  │
│                                     │
│ -- Drop existing policies...        │
│ DROP POLICY IF EXISTS ...           │
│ ALTER TABLE event_config...         │
│ ...                                 │
│                                     │
│ Ctrl+Enter also works               │
└─────────────────────────────────────┘

Wait for result...
```

### STEP 6: Verify It Worked

```
You should see a message like:
┌─────────────────────────────────────┐
│ Results (1 row)                     │
│                                     │
│ status  | Setup Complete!           │
│ id      | 00000000-0000-000...      │
│ event_name | StartCup AMF 2025      │
│ current_phase | 0                   │
│ event_started | false               │
│ event_ended   | false               │
└─────────────────────────────────────┘

If you see this, the SQL worked! ✅
```

### STEP 7: Restart Dev Server

```
In your terminal where npm run dev is running:

Press: Ctrl+C

Then run:
$ npm run dev

Wait for:
✓ Ready in Xs
```

### STEP 8: Test the Fix

```
1. Open: http://localhost:3000
2. Login as admin
3. Click: Control Panel
4. Click: Phase button (any phase)
5. Confirm: Click OK
6. Wait...
7. Should see: ✅ Success message!

If error: Check browser console (F12 > Console)
```

---

## 🎨 Visual Status Indicators

### ✅ All Good
```
✅ Phase update successful
✅ No errors in console
✅ Live dashboard updated
✅ Phase shows correct value
```

### ⚠️ Still Getting Error
```
❌ Error in browser console
→ Check error code
→ Look up code in ERROR_CODES_REFERENCE.md
→ Follow the solution for that code
```

---

## 📊 Timeline

```
Before SQL:                      After SQL:
┌──────────────┐                ┌──────────────┐
│ event_config │                │ event_config │
│              │                │              │
│ (missing)    │    SQL Fix     │ (exists!)    │
│              │    -------->   │              │
│              │                │ id:00000000  │
│              │                │ phase: 0     │
│              │                │ started: false
└──────────────┘                └──────────────┘
      ❌                              ✅
   Query fails                    Query works
```

---

## 🔄 What Happens Behind Scenes

```
Your Code                     Supabase
┌────────────┐               ┌──────────┐
│  Browser   │               │Database  │
│ (admin)    │               │          │
└────────────┘               └──────────┘
      │                           │
      │ Phase = 1                 │
      └──────────────────────────>│
                                  │
                            Query event_config
                                  │
                    Before Fix: ❌ Not found
                    After Fix:  ✅ Found!
                                  │
                    Return event_config data
      ┌──────────────────────────<│
      │                           │
      │ Update phase_1_start_time
      │ Update current_phase = 1
      └──────────────────────────>│
                                  │
                            Data updated
                                  │
      ┌──────────────────────────<│
      │
   ✅ Success!
```

---

## 🎯 Quick Visual Checklist

```
Your Task                              Status
─────────────────────────────────────────────
☐ Open Supabase.com
☐ Go to SQL Editor
☐ Create New Query
☐ Copy SQL from fix-event-config...
☐ Paste into editor
☐ Click Run
☐ See "Setup Complete!" message       ✅
☐ Stop npm run dev (Ctrl+C)
☐ Run npm run dev again
☐ Open http://localhost:3000
☐ Login as admin
☐ Go to Control Panel
☐ Update a phase                      ✅
☐ See success message                 ✅
```

---

## 🚨 If Something Goes Wrong

```
Error in console?

Step 1: Note the error code
        Example: PGRST116

Step 2: Find it in ERROR_CODES_REFERENCE.md
        Example: PGRST116 = Record not found

Step 3: Follow the solution
        Example: "Run the SQL fix script"

Step 4: Try again
        Ctrl+C → npm run dev → test again
```

---

## ✨ Expected Output

### Browser Alert (Success)
```
✅ Evento atualizado para: Fase 1: Descoberta
[OK]
```

### Browser Alert (Error)
```
❌ Erro ao buscar configuração do evento: [details]
[OK]
```

### Console Log (Success)
```
🔍 Query result: {
  config: { id: "...", current_phase: 0, ... },
  configError: null
}
```

### Console Log (Error)
```
API Error Response: {
  status: 500,
  error: "Erro ao buscar configuração do evento",
  details: "No rows found matching...",
  code: "PGRST116",
  hint: null
}
```

---

## 🎬 Animation-Style Flow

```
Step 1: User clicks "Update Phase 1"
        └─> Sends request to API

Step 2: API tries to fetch event_config
        ├─ BEFORE FIX: ❌ Can't find record
        └─ AFTER FIX:  ✅ Finds record!

Step 3: API updates phase and timestamps
        └─> Returns success

Step 4: Browser shows success message
        └─> Page reloads with new phase

Step 5: Live dashboard updates
        └─> All teams see new phase! 🎉
```

---

## 📱 Mobile-Friendly Note

Even on mobile/tablet:
1. Open Supabase.com in browser
2. SQL Editor works the same way
3. Copy-paste SQL
4. Click Run
5. Done!

Works on any device with a browser.

---

## ⏱️ Time Breakdown

```
Reading this guide:     2-3 min ⏱️
Going to Supabase:      30 sec ⏱️
Copying SQL:            30 sec ⏱️
Running SQL:            10-30 sec ⏱️
Restarting dev:         5-10 sec ⏱️
Testing:                1 min ⏱️
─────────────────────────────
Total:                  4-5 minutes ⏱️
```

**That's it!** Very quick fix.

---

## 🎯 Remember

- ✅ The SQL is safe (can run multiple times)
- ✅ It only creates/updates records
- ✅ It doesn't delete anything
- ✅ Changes are instant
- ✅ Dev server picks up changes automatically

**You've got this! 🚀**
