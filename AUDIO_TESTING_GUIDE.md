# 🎬 Audio System - Testing & MP3 Files Guide

## 🎯 Quick Start

### Step 1: Add MP3 Files
Create `/public/sounds/` directory and add these 25 files:

```bash
# Create directory
mkdir -p public/sounds

# Copy or download MP3 files into this directory
# Naming must be exact (case-sensitive on Linux)
```

### Step 2: Run Dev Server
```bash
npm run dev
```

### Step 3: Open Dashboard
```
http://localhost:3000
```

### Step 4: Trigger Sounds
Follow the test scenarios below.

---

## 📋 Detailed Testing Scenarios

### Test 1: Event Start Sound 🚀
**Audio File**: `event-start.mp3`
**Location**: /src/components/PhaseController.tsx
**How to Trigger**:
1. Go to Admin Panel (PhaseController)
2. Click "Start Event" (advance from Phase 0 → Phase 1)
3. Confirm dialog
4. ✅ Listen for epic fanfare sound
5. Check: Console should NOT show any errors about audio

**Expected Result**: Single playback of event-start sound

---

### Test 2: Phase Transition Sound 📊
**Audio File**: `phase-start.mp3`
**Location**: /src/components/PhaseController.tsx
**How to Trigger**:
1. In Admin Panel, click to advance to Phase 2
2. Confirm dialog
3. ✅ Listen for dramatic transition sound
4. Repeat for Phases 3, 4, 5

**Expected Result**: Different from event-start, should be more dramatic

---

### Test 3: Quest Started Sound 📝
**Audio File**: `quest-start.mp3`
**Location**: /src/components/dashboard/CurrentQuestTimer.tsx
**How to Trigger**:
1. Start an event (Phase 1+)
2. Admin Panel: Click "Start Quest" button for a quest
3. ✅ Listen for attention-getting sound
4. CurrentQuestTimer should show active quest

**Expected Result**: Notification bell-like sound

---

### Test 4: Quest Complete Sound ✅
**Audio File**: `quest-complete.mp3`
**Location**: /src/components/dashboard/CurrentQuestTimer.tsx
**How to Trigger**:
1. Navigate to Supabase SQL Editor
2. Find a quest with status='active'
3. Run: `UPDATE quests SET status='evaluated' WHERE id='<quest_id>'`
4. Refresh dashboard
5. ✅ Listen for celebration/victory sound

**Expected Result**: Uplifting celebratory chime

---

### Test 5: Submission Sound 📤
**Audio File**: `submission.mp3`
**Location**: /src/components/forms/SubmissionForm.tsx
**How to Trigger**:
1. Go to Team Dashboard
2. Find active quest
3. Fill deliverable (file/text/URL)
4. Click "Submit Deliverable"
5. ✅ Listen for confirmation sound
6. See "✅ Entrega enviada com sucesso!"

**Expected Result**: Positive confirmation "whoosh" sound

---

### Test 6: Penalty Sound 🔴
**Audio File**: `penalty.mp3`
**Location**: /src/components/dashboard/LivePenaltiesStatus.tsx
**How to Trigger**:
1. Navigate to Supabase SQL Editor
2. Run:
   ```sql
   INSERT INTO penalties (team_id, penalty_type, points_deduction, reason, assigned_by_admin)
   VALUES ('<team_id>', 'atraso', 50, 'Teste de áudio', true);
   ```
3. Refresh dashboard or wait for polling (max 5s)
4. ✅ Listen for alert/buzzer sound in LivePenaltiesStatus

**Expected Result**: Sharp alert sound

---

### Test 7: Ranking Up Sound 📈
**Audio File**: `ranking-up.mp3`
**Location**: /src/components/dashboard/RankingBoard.tsx
**How to Trigger**:
1. Go to Live Dashboard (RankingBoard visible)
2. Supabase SQL Editor:
   ```sql
   UPDATE live_ranking SET total_points = total_points + 100
   WHERE team_id = '<team_id>';
   ```
3. Ranking board updates (polling 2s)
4. Watch a team move UP in ranking
5. ✅ Listen for ascending positive sound

**Expected Result**: Uplifting ascending tones

---

### Test 8: Ranking Down Sound 📉
**Audio File**: `ranking-down.mp3`
**Location**: /src/components/dashboard/RankingBoard.tsx
**How to Trigger**:
1. Go to Live Dashboard (RankingBoard visible)
2. Supabase SQL Editor:
   ```sql
   UPDATE live_ranking SET total_points = total_points - 100
   WHERE team_id = '<team_id>';
   ```
3. Ranking board updates
4. Watch a team move DOWN in ranking
5. ✅ Listen for descending negative sound

**Expected Result**: Descending sad tones (opposite of ranking-up)

---

### Test 9: Coins Earned Sound 🪙
**Audio File**: `coins.mp3`
**Location**: /src/components/dashboard/RankingBoard.tsx
**How to Trigger**:
1. Go to Live Dashboard (RankingBoard visible)
2. Supabase SQL Editor:
   ```sql
   UPDATE live_ranking SET total_points = total_points + 50
   WHERE team_id = '<team_id_in_same_position>';
   ```
3. Team stays in same position but gains points
4. ✅ Listen for coin collection sound

**Expected Result**: Satisfying coin collection sound (not ranking-up)

---

### Test 10: Evaluator Online Sound 🟢
**Audio File**: `evaluator-online.mp3`
**Location**: /src/lib/hooks/useRealtime.ts (useRealtimeEvaluators)
**How to Trigger**:
1. Go to any page showing EvaluatorStatusList (LiveDashboard)
2. Supabase SQL Editor:
   ```sql
   UPDATE evaluators SET is_online = true WHERE id = '<evaluator_id>';
   ```
3. Wait for polling (max 5s)
4. ✅ Listen for positive beep sound

**Expected Result**: Short positive notification beep

---

### Test 11: Evaluator Offline Sound 🔴
**Audio File**: `evaluator-offline.mp3`
**Location**: /src/lib/hooks/useRealtime.ts (useRealtimeEvaluators)
**How to Trigger**:
1. Go to any page showing EvaluatorStatusList (LiveDashboard)
2. Supabase SQL Editor:
   ```sql
   UPDATE evaluators SET is_online = false WHERE id = '<evaluator_id>';
   ```
3. Wait for polling (max 5s)
4. ✅ Listen for negative beep sound

**Expected Result**: Short negative notification beep

---

### Test 12: Boss Spawn Sound 🔥
**Audio File**: `boss-spawn.mp3`
**Location**: /src/components/quest/BossQuestCard.tsx
**How to Trigger**:
1. Find a BOSS quest in database
2. Supabase SQL Editor:
   ```sql
   UPDATE quests SET status = 'active', started_at = NOW()
   WHERE id = '<boss_quest_id>';
   ```
3. Refresh dashboard or navigate to BossQuestCard
4. ✅ Listen for ominous threatening sound

**Expected Result**: Dramatic boss music intro or ominous sound

---

### Test 13: Power-Up Sound ⚡
**Audio File**: `power-up.mp3` (already working)
**Location**: /src/components/PowerUpActivator.tsx
**How to Trigger**:
1. Go to Power-Ups section
2. Click activate on any power-up
3. ✅ Listen for power-up sound
4. Confirm success message

**Expected Result**: Energetic power-up activation sound

---

## 🎵 MP3 File Specifications

### Recommended Specifications
- **Format**: MP3 (128-320 kbps)
- **Duration**: 0.5 - 3 seconds
- **Mono or Stereo**: Either OK
- **Sample Rate**: 44.1 kHz or 48 kHz
- **Fade Out**: Recommended (avoid abrupt cuts)
- **Max File Size**: 1MB each (budget: 25MB for all)

### Where to Find Free MP3s

#### 🎯 Tier 1: Best for Startup Context
1. **Freesound.org** (Creative Commons)
   - Search terms: "fanfare", "success", "notification", "alert"
   - Download as MP3
   - High quality, lots of options

2. **Zapsplat.com** (Free, no login required)
   - Similar to Freesound but simpler interface
   - Good for game/app sounds

#### 🎯 Tier 2: General Audio
3. **BBC Sound Effects** (Public Domain)
   - Official sounds from BBC shows
   - Very high quality
   - Download as MP3/WAV

4. **Pixabay Music** (Creative Commons 0)
   - Royalty free
   - Good for longer background sounds

#### 🎯 Tier 3: Game Sounds
5. **OpenGameArt.org** (Various licenses)
   - Game-specific sound effects
   - Some free with attribution

---

## 📥 Download & Install Instructions

### Method 1: Manual Download (Windows/Mac)

1. **Visit Freesound.org**
2. Search: `"fanfare" sounds:mp3`
3. Find good match, click Download
4. Save to folder on computer
5. Drag/drop to `public/sounds/` in VS Code
6. Rename if needed to match `AUDIO_FILES` mapping

### Method 2: Quick Download Script

Create `download-sounds.sh` (Mac/Linux):
```bash
#!/bin/bash
mkdir -p public/sounds

# Download from Freesound (requires API key for automated)
# Or download manually and organize

echo "✅ Place your MP3 files in public/sounds/"
```

### Method 3: Use Placeholder During Dev

While collecting sounds, create silent MP3s for testing:

```bash
# Generate silent 1-second MP3 (using FFmpeg)
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 public/sounds/event-start.mp3

# Repeat for all 25 files
```

---

## 🎧 Audio Settings Test

### Test Volume Control
1. Open Live Dashboard
2. Find **Audio Settings** (usually in header/settings)
3. Move volume slider: 0% → 50% → 100%
4. Play a sound between each
5. ✅ Volume should change audibly

### Test Enable/Disable
1. Open Audio Settings
2. Toggle "🔊 Enable Sounds" OFF
3. Trigger a sound (submit quest, etc.)
4. ✅ No sound should play
5. Toggle ON
6. ✅ Sounds should play again

### Test Persistence
1. Set volume to 30%
2. Disable sounds
3. Refresh page
4. ✅ Volume should be 30%
5. ✅ Sounds should be disabled
6. (Check localStorage in DevTools: `soundConfig`)

---

## 🧪 Developer Debugging

### Check Audio in Browser Console

```javascript
// Test if audio file exists
const audio = new Audio('/sounds/event-start.mp3')
console.log(audio.src)

// Check AudioContext (Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)()
console.log(audioContext.state) // "running" or "suspended"

// Play test sound
const testAudio = new Audio('/sounds/success.mp3')
testAudio.volume = 0.5
testAudio.play().then(() => console.log('✅ Playing')).catch(e => console.error(e))

// Check soundConfig in localStorage
console.log(localStorage.getItem('soundConfig'))
```

### Monitor Hooks in DevTools

```javascript
// React DevTools → Components → Find component
// Check "Hooks" tab
// Look for:
// - useAudioFiles
// - useRealtimePhase
// - useRealtimeEvaluators
```

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| No sound at all | Files not in `/public/sounds/` | Add files, check naming |
| Sound plays twice in dev | React strict mode | Normal, expected |
| Volume not changing | localStorage issue | Check DevTools Storage tab |
| Evaluator sounds not working | Old poll hasn't run yet | Wait 5 seconds, refresh |
| Some sounds working, others not | Missing specific files | Check console for 404s |

---

## ✅ Pre-Production Checklist

- [ ] All 25 MP3 files in `/public/sounds/`
- [ ] Files are valid MP3 format
- [ ] File names match exactly (case-sensitive)
- [ ] All 13 game scenarios tested
- [ ] Volume control working
- [ ] Enable/disable toggle working
- [ ] localStorage persistence working
- [ ] No console errors in DevTools
- [ ] No memory leaks (check Chrome DevTools Memory)
- [ ] Works on mobile (iOS Safari, Android Chrome)
- [ ] Works on all desktop browsers
- [ ] Sounds have appropriate volume levels
- [ ] Multiple simultaneous sounds don't crash

---

## 🚀 Deployment

Once all tests pass:

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Test Production Build**
   ```bash
   npm run start
   ```

3. **Deploy to Vercel/Server**
   - Sound files are static, will be served by `/public`
   - No backend changes needed
   - Already included in git repo

4. **Monitor Production**
   - Check browser console for audio errors
   - Monitor user feedback about sounds
   - Adjust volume if needed

---

## 📊 Audio Implementation Summary

| Component | Status | Sounds | Tests |
|-----------|--------|--------|-------|
| PhaseController | ✅ Done | 2 | 2 |
| SubmissionForm | ✅ Done | 1 | 1 |
| CurrentQuestTimer | ✅ Done | 2 | 2 |
| LivePenaltiesStatus | ✅ Done | 1 | 1 |
| RankingBoard | ✅ Done | 3 | 3 |
| PowerUpActivator | ✅ Done | 1 | 1 |
| EvaluatorStatusList | ✅ Done | 2 | 2 |
| BossQuestCard | ✅ Done | 1 | 1 |
| **TOTAL** | **✅ 8/8** | **13 scenarios** | **13 tests** |

---

## 📞 Support

If sounds not working after setup:
1. Check `/public/sounds/` directory exists
2. Verify all 25 MP3 files present
3. Check browser console (F12 → Console tab)
4. Look for 404 errors: `GET /sounds/xxx.mp3`
5. Verify AudioContext is running (browser audio permission)
6. Try different browser
7. Clear browser cache

