# Quest Automation Integration - Summary

**Date:** November 2, 2025
**Status:** ✅ Frontend Integration Complete - Ready for Database Migrations

---

## What Was Done

### ✅ Phase 1: Architecture Correction

After the user's feedback that there's already an existing login-protected admin dashboard, I pivoted the approach:

**Previous Approach (Incorrect):**
- Created new `/admin` route (page without login protection)
- Created standalone `QuestControlPanel` component
- Duplicated admin functionality

**New Approach (Correct):**
- Integrated quest controls into existing `/control-panel` page
- Used server-side data fetching from existing admin page
- Removed conflicting routes

### ✅ Phase 2: Files Modified

#### **Updated: `src/app/(admin)/control-panel/page.tsx`**
- Added import for `QuestControlPanelWrapper` component
- Added server-side queries to fetch `phases` and `quests` data
- Added new "Controle de Quests (Automação)" section after PhaseController
- Passes data to wrapper component with `eventStarted` flag

#### **Created: `src/components/admin/QuestControlPanelWrapper.tsx`**
- **Type:** Client component ('use client')
- **Purpose:** Interactive quest control panel for admin dashboard
- **Props:**
  - `quests: Quest[]` - List of all quests with status
  - `phases: Phase[]` - List of all phases
  - `eventStarted: boolean` - Event status flag
- **Features:**
  - 🟢 Active Quests section (with STOP buttons)
  - ⏳ Scheduled Quests section (with START buttons)
  - 🔴 Closed Quests section (display only)
  - Success/error message display
  - Real-time state updates
  - RPC function calls: `start_quest()`, `end_quest()`

#### **Deleted: Conflicting Files**
- ❌ `src/app/(admin)/admin/page.tsx` - Removed duplicate admin page
- ❌ `src/components/admin/QuestControlPanel.tsx` - Removed standalone component
- ❌ `src/app/(admin)/layout.tsx` - Removed unnecessary layout

### ✅ Phase 3: Component Integration

The `QuestControlPanelWrapper` now:
1. Receives server-side data from `/control-panel`
2. Handles client-side interactions (START/STOP quest buttons)
3. Calls Supabase RPC functions: `start_quest()` and `end_quest()`
4. Updates quest status in real-time
5. Shows success/error feedback messages
6. Conditionally renders based on event status

---

## Next Steps (Database Setup)

Before the quest controls will work, you need to apply the SQL migrations to your Supabase database:

### 1. Apply Migration: `add-quest-automation-system.sql`

This migration adds:
- New quest fields: `status`, `started_at`, `started_by`, `ended_at`, `auto_start_enabled`, `auto_start_delay_minutes`
- New table: `quest_activity_log` (for audit trail)
- New RPC functions: `start_quest()`, `end_quest()`, `get_active_quest_by_timing()`
- New view: `quest_status_by_phase`
- RLS policies for quests and quest_activity_log tables

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy and paste content of `add-quest-automation-system.sql`
4. Click "RUN"

**Expected Output:**
```
✅ Query executed successfully
Quest Automation System instalado com sucesso!
```

### 2. Apply Migration: `fix-teams-rls.sql`

This migration enables RLS on the teams table to fix nested query issues.

**Steps:**
1. Create new query in SQL Editor
2. Copy and paste content of `fix-teams-rls.sql`
3. Click "RUN"

### 3. Configure Admin User

Make sure your user account has admin role in the database:

```sql
-- In Supabase SQL Editor
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';  -- Change this!
```

---

## How to Use

### Admin Workflow:

1. **Access Admin Panel:**
   - Go to `http://localhost:3000/control-panel`
   - Log in with admin credentials

2. **Start Event:**
   - Click "INICIAR EVENTO" (or control using PhaseController)
   - Event status becomes "Iniciado"

3. **Quest Controls Appear:**
   - New "Controle de Quests (Automação)" section becomes active
   - Shows three sections: Active, Scheduled, and Closed quests

4. **Start a Quest:**
   - In "Próximas Quests" section, click "▶️ INICIAR"
   - Quest moves to "Quests Ativas" section
   - Teams can now submit responses for this quest
   - History recorded in `quest_activity_log` table

5. **End a Quest:**
   - In "Quests Ativas" section, click "⏹️ ENCERRAR"
   - Quest moves to "Quests Fechadas" section
   - Teams can no longer submit responses
   - Proceed to next quest

6. **End Event:**
   - When all quests are complete, click "ENCERRAR EVENTO"

---

## Database Architecture

### Modified Tables:

**`quests` table - New Columns:**
- `status` (VARCHAR): 'scheduled', 'active', 'closed', 'completed'
- `started_at` (TIMESTAMP): When quest was started
- `started_by` (UUID FK): Admin who started it
- `ended_at` (TIMESTAMP): When quest was ended
- `auto_start_enabled` (BOOLEAN): For future automation
- `auto_start_delay_minutes` (INTEGER): Delay for auto-start

**`event_config` table - Changes:**
- REMOVED: `current_phase`, `phase_1_start_time` through `phase_5_start_time`, `phase_start_time`
- ADDED: `active_quest_id` (UUID FK)
- KEPT: `event_started`, `event_ended`, `event_start_time`, `event_end_time`

### New Tables:

**`quest_activity_log` - Audit Trail:**
- `id` (UUID PK)
- `quest_id` (UUID FK) → quests
- `action` (VARCHAR): 'started', 'ended', 'auto_started', 'auto_ended'
- `triggered_by` (UUID FK) → auth.users
- `triggered_at` (TIMESTAMP)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)

### New Functions (RPC):

1. **`start_quest(quest_id_param, started_by_user_id)`**
   - Updates quest status to 'active'
   - Sets started_at timestamp
   - Records in quest_activity_log

2. **`end_quest(quest_id_param)`**
   - Updates quest status to 'closed'
   - Sets ended_at timestamp
   - Records in quest_activity_log

3. **`get_active_quest_by_timing(phase_id_param)`**
   - Calculates which quest should be active based on timing
   - Used for potential automation features

---

## Frontend Updates Still Needed

### ⏳ Phase 2 Tasks (Future):

1. **Update `/submit` page**
   - Currently shows all quests from current phase
   - Should show ONLY quests with `status = 'active'`
   - Remove `duration_minutes` logic (no longer used)

2. **Update `/evaluate` page**
   - Currently works with phases
   - Should work with quest-based system
   - Show submissions only for active/closed quests

3. **Create API Routes** (Optional but recommended)
   - `POST /api/quests/start` - Validate and start quest
   - `POST /api/quests/end` - Validate and end quest
   - Currently calling RPC directly, should add backend validation

4. **Implement Auto-Start** (Optional - Phase 3)
   - Create cron job or cloud function
   - Auto-start quests when `auto_start_enabled = true`
   - Trigger after `auto_start_delay_minutes` from quest creation

---

## Testing Checklist

After applying migrations:

- [ ] Access `/control-panel` without errors
- [ ] See new "Controle de Quests" section
- [ ] Can click "INICIAR EVENTO"
- [ ] Section shows "Próximas Quests"
- [ ] Can click "▶️ INICIAR" on a quest
- [ ] Quest moves to "Quests Ativas"
- [ ] `quest_activity_log` has new entry with action='started'
- [ ] `quest.status` changed to 'active' in database
- [ ] Can click "⏹️ ENCERRAR" on active quest
- [ ] Quest moves to "Quests Fechadas"
- [ ] `quest_activity_log` has new entry with action='ended'

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│ /control-panel (Server Component)                   │
│ ├─ Fetches: event_config, teams, evaluators        │
│ ├─ Fetches: phases, quests (NEW)                    │
│ └─ Renders: PhaseController + QuestControlPanelW.. │
└────────┬────────────────────────────────────────────┘
         │ Props: quests, phases, eventStarted
         ↓
┌─────────────────────────────────────────────────────┐
│ QuestControlPanelWrapper (Client Component)         │
│ ├─ State: questsState                              │
│ ├─ Handlers: handleStartQuest, handleEndQuest      │
│ ├─ RPC Calls: start_quest(), end_quest()           │
│ └─ UI: Three sections (Active/Scheduled/Closed)    │
└─────────────────────────────────────────────────────┘
         │
         ↓ RPC
┌─────────────────────────────────────────────────────┐
│ Supabase Database                                   │
│ ├─ quests (updated with status, timestamps)        │
│ ├─ quest_activity_log (new, audit trail)           │
│ ├─ event_config (updated with active_quest_id)     │
│ ├─ Functions: start_quest(), end_quest()           │
│ └─ RLS: Policies for quest access control          │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: "Quests not showing in control panel"
**Solution:** Ensure `add-quest-automation-system.sql` has been applied successfully

### Issue: "Start/End buttons don't work"
**Solution:**
1. Check browser console (F12) for errors
2. Verify user has `role = 'admin'`
3. Confirm RPC functions exist in Supabase
4. Check RLS policies allow the operation

### Issue: "Event doesn't start"
**Solution:**
1. Click "INICIAR EVENTO" button
2. Verify `event_config.event_started` changed to `true` in database

### Issue: "Quests don't show as active"
**Solution:**
1. Verify RPC functions were created
2. Check quest.status in database after clicking START
3. Look for errors in quest_activity_log

---

## Summary

The quest automation system has been successfully integrated into the existing `/control-panel` admin page. The frontend is ready to work with the new quest-based system once the database migrations are applied.

**Current Status:**
- ✅ Frontend integration complete
- ✅ Server-side data fetching implemented
- ✅ Client-side quest controls created
- ⏳ Database migrations pending
- ⏳ Page updates for /submit and /evaluate pending

**Ready for:** Applying SQL migrations to Supabase

---

**Created by:** Claude Code
**Version:** 1.0
**Last Updated:** November 2, 2025
