# Quest System Integration with Live Dashboard

## Summary of Changes

The quest system has been fully integrated with the live dashboard and timer components. Here's what was done:

---

## 1. Updated `useRealtimePhase` Hook
**File:** `src/lib/hooks/useRealtime.ts`

### Changes:
- Now fetches **active quests** from the database
- Fixed timestamp tracking: Uses `event_start_time` instead of non-existent `phase_X_start_time`
- Returns `active_quest` object in phase data for real-time quest display

### How it works:
```typescript
// Returns:
{
  ...phaseData,
  event_status: 'running' | 'not_started' | 'ended',
  phase_started_at: timestamp,           // When event started
  active_quest: { id, name, description, max_points, status, ... },  // Current active quest
  phases: { name, duration_minutes }
}
```

---

## 2. Updated `CurrentQuestTimer` Component
**File:** `src/components/dashboard/CurrentQuestTimer.tsx`

### Changes:
- **Dynamic quest loading**: Fetches quests from database based on `status = 'scheduled'`
- **Fallback data**: If no quests in DB, uses fallback quest data for phases 2-5
- **Real-time calculation**: Determines current quest based on elapsed time and number of quests
- **Live display updates**: Shows current quest with timer and progress bars

### Display Features:
- 🎯 **Current Quest** - Name, description, max points, and time remaining
- ⏱️ **Phase Timer** - Total time remaining in format HH:MM:SS
- 📊 **Progress Bars** - Individual quest progress + overall phase progress
- 📋 **Next Quests** - Preview of upcoming 2 quests
- 🟢 **Color Indicators** - Green (66%+), Yellow (33-66%), Red (<33%)

### Data Flow:
1. Component receives: `phase`, `phaseStartedAt`, `phaseDurationMinutes` from `useRealtimePhase`
2. Fetches quests where `status = 'scheduled'` from Supabase
3. Calculates which quest should be active based on elapsed time
4. Displays current quest with individual time tracking

---

## 3. Phase Start Time Fix

**Problem:**
- Migration removed `phase_1_start_time`, `phase_2_start_time`, etc. columns
- Old code was trying to find these non-existent columns

**Solution:**
- Use `event_start_time` (when the entire event begins)
- This represents when Phase 1 begins
- Subsequent phases use the same timestamp as they start sequentially

**Timeline:**
```
Event starts → event_start_time = 2024-01-15T10:00:00Z
Phase 1 (0-150min) → Uses event_start_time
Phase 2 (150-360min) → Calculated from event_start_time + Phase 1 duration
Phase 3 (360-510min) → Calculated from event_start_time + Phase 1 + 2 duration
```

---

## 4. Live Dashboard Integration
**File:** `src/app/live-dashboard/page.tsx`

The live dashboard now displays:
- **Real-time quest information** via `useRealtimePhase` hook
- **Dynamic timer** with quest-specific countdown
- **Active quest details** fetched from database
- **Auto-refresh** every 5 seconds for live updates

---

## 5. How Quest Status Works

### Quest Statuses:
- **`scheduled`** - Quest is ready but not started (visible in "Próximas Quests")
- **`active`** - Quest is currently in progress (shown in timer as current quest)
- **`closed`** - Quest time has ended (visible in history)
- **`completed`** - Quest has been submitted and evaluated

### Admin Control:
Admins can manage quest status via the Control Panel:
- Click **"INICIAR"** to change quest status from `scheduled` → `active`
- Click **"ENCERRAR"** to change quest status from `active` → `closed`

---

## 6. Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│  Admin Control Panel                                │
│  - Clicks "Ativar" to activate quest                │
│  - Status: scheduled → active                       │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
        ┌────────────────────────────┐
        │  Supabase (Database)       │
        │  - event_config table      │
        │  - quests table            │
        │  - active_quest_id field   │
        └────────────────┬───────────┘
                         │
        ┌────────────────┴───────────┐
        │                            │
        ↓                            ↓
┌──────────────────────┐  ┌──────────────────────┐
│  useRealtimePhase    │  │  CurrentQuestTimer   │
│  - Polls every 5sec  │  │  - Fetches quests    │
│  - Gets active quest │  │  - Calculates time   │
│  - Returns timing    │  │  - Shows progress    │
└──────────────┬───────┘  └──────────────┬───────┘
               │                         │
               └────────────┬────────────┘
                            │
                            ↓
                ┌─────────────────────────┐
                │  Live Dashboard         │
                │  - Real-time ranking    │
                │  - Quest timer display  │
                │  - Phase information    │
                └─────────────────────────┘
```

---

## 7. Testing Checklist

### ✅ Phase System:
- [x] Phase persists after click (stored in database as `current_phase`)
- [x] Event start time is recorded correctly
- [x] Timer calculations use correct timestamp

### ⏳ Quest Display:
- [ ] Activate a quest via Admin Control Panel ("INICIAR")
- [ ] Verify quest appears in Live Dashboard timer
- [ ] Verify timer counts down correctly
- [ ] Verify next quests are displayed in preview
- [ ] Verify quest status changes to 'active' in database

### 🎯 Team Dashboard:
- [ ] Team can see current active quest
- [ ] Team can submit deliverables for active quest
- [ ] Quest details display correctly with points

### 📊 Live Dashboard:
- [ ] Refresh page - quest data persists
- [ ] Admin updates quest - dashboard updates within 5 seconds
- [ ] Multiple phases - timer adjusts correctly between phases

---

## 8. Key Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `src/lib/hooks/useRealtime.ts` | Added quest fetching | Provides real-time quest data to components |
| `src/components/dashboard/CurrentQuestTimer.tsx` | Dynamic quest loading | Displays live quest timer with DB data |
| `add-quest-automation-system.sql` | RLS policy updated | Allow viewing 'scheduled' quests |
| `src/app/api/admin/start-phase/route.ts` | Uses `current_phase` | Persists phase selection to DB |
| `src/components/PhaseController.tsx` | Uses server value | Displays current phase from database |

---

## 9. Next Steps

1. **Seed more quests** for different phases (Phase 2-5)
2. **Test quest activation** via admin panel
3. **Monitor timing accuracy** across different phase durations
4. **Verify team submission** logic with active quests
5. **Add quest completion tracking** for evaluators

---

## 10. API Endpoints Used

### Fetch Event Config:
```
GET /from/event_config
WHERE id = '00000000-0000-0000-0000-000000000001'
FIELDS: current_phase, event_started, event_end_time, event_start_time
```

### Fetch Active Quests:
```
GET /from/quests
WHERE status IN ('scheduled', 'active')
FIELDS: id, name, description, max_points, order_index, duration_minutes, status
ORDER BY: order_index
```

### Update Quest Status:
```
POST /rpc/start_quest
PARAMS: quest_id, started_by_user_id

POST /rpc/end_quest
PARAMS: quest_id
```

---

## 11. Environment Requirements

- `NEXT_PUBLIC_EVENT_CONFIG_ID` - Set to `00000000-0000-0000-0000-000000000001`
- Supabase RLS policies - Updated to allow viewing `scheduled` quests
- Database schema - Must have `quests` table with proper constraints

---

## Questions or Issues?

If you encounter issues:

1. **Quests not showing**: Check RLS policy includes `'scheduled'` status
2. **Timer not updating**: Verify `event_start_time` is set in database
3. **Quest doesn't activate**: Ensure admin user is authenticated with correct role

See the admin control panel logs for detailed error messages.
