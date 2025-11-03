# 📋 Quest Duration Minutes - Official Update

**Purpose**: Update all quest duration values to match official StartCup AMF document
**Status**: SQL script ready to run
**Impact**: Display of quest durations in UI + timer calculations

---

## 📊 New Duration Values

### FASE 1: Descoberta (20h - 22h30 = 150 min total)
| Quest | Name | Current | New | Change |
|-------|------|---------|-----|--------|
| 1.1 | Conhecendo o Terreno | ? | 60 min | ✅ |
| 1.2 | A Persona Secreta | ? | 50 min | ✅ |
| 1.3 | Construindo Pontes | ? | 30 min | ✅ |
| **Total** | | | **140 min** | (+ 10 min boss) |

### FASE 2: Criação (22h30 - 01h30 = 210 min total)
| Quest | Name | Current | New | Change |
|-------|------|---------|-----|--------|
| 2.1 | A Grande Ideia | ? | 50 min | ✅ |
| 2.2 | Identidade Secreta | ? | 30 min | ✅ |
| 2.3 | Prova de Conceito | ? | 120 min | ✅ |
| **Total** | | | **200 min** | (+ 10 min boss) |

### FASE 3: Estratégia (01h30 - 04h00 = 150 min total)
| Quest | Name | Current | New | Change |
|-------|------|---------|-----|--------|
| 3.1 | Montando o Exército | ? | 40 min | ✅ |
| 3.2 | Aliados Estratégicos | ? | 30 min | ✅ |
| 3.3 | Show Me The Money | ? | 70 min | ✅ |
| **Total** | | | **140 min** | (+ 10 min boss) |

### FASE 4: Refinamento (04h00 - 06h00 = 120 min total)
| Quest | Name | Current | New | Change |
|-------|------|---------|-----|--------|
| 4.1 | Teste de Fogo | ? | 40 min | ✅ |
| 4.2 | Validação de Mercado | ? | 40 min | ✅ |
| 4.3 | Números que Convencem | ? | 30 min | ✅ |
| **Total** | | | **110 min** | (+ 10 min boss) |

### FASE 5: O Pitch (06h00 - 07h30 = 90 min total)
| Quest | Name | Current | New | Change |
|-------|------|---------|-----|--------|
| 5.1 | A História Épica | ? | 20 min | ✅ |
| 5.2 | Slides de Impacto | ? | 40 min | ✅ |
| 5.3 | Ensaio Geral | ? | 30 min | ✅ |
| **Total** | | | **90 min** | (final boss separate) |

---

## 🚀 How to Apply

### Step 1: Run SQL Update

Copy and run [UPDATE_QUEST_DURATION_MINUTES.sql](UPDATE_QUEST_DURATION_MINUTES.sql) in Supabase SQL Editor:

```sql
-- The script will:
-- 1. Update Fase 1 quest durations
-- 2. Update Fase 2 quest durations
-- 3. Update Fase 3 quest durations
-- 4. Update Fase 4 quest durations
-- 5. Update Fase 5 quest durations
-- 6. Verify all changes with summary queries
```

### Step 2: Verify Changes

The SQL script includes verification queries that will show:
- Each quest with its new duration
- Sum of durations per phase
- Complete summary table

Expected output:
```
Fase 1: 60 + 50 + 30 = 140 min (+ 10 boss = 150 min phase)
Fase 2: 50 + 30 + 120 = 200 min (+ 10 boss = 210 min phase)
Fase 3: 40 + 30 + 70 = 140 min (+ 10 boss = 150 min phase)
Fase 4: 40 + 40 + 30 = 110 min (+ 10 boss = 120 min phase)
Fase 5: 20 + 40 + 30 = 90 min (final boss separate)
```

### Step 3: Hard Refresh Browser

```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

Dashboard will show updated duration times.

---

## 📱 Where This Shows

Quest durations now display in:
- ✅ Dashboard quest cards
- ✅ Submission page quest details
- ✅ Live dashboard quest timer
- ✅ Admin control panel

---

## 🎯 Timeline Notes

### Boss Phases (10 min each)
- Fase 1: "Para quem você está resolvendo e por quê?"
- Fase 2: "Demo de 2 minutos do protótipo"
- Fase 3: "Defender o modelo de negócio em 3 minutos"
- Fase 4: "Simulação de pitch com jurado surpresa"
- Fase 5: "Apresentação oficial para os jurados" (200 pts, separate)

### Break/Checkpoint Times
- Fase 2: Checkpoint da Meia-Noite (00h) - Salve o progresso
- Fase 3: Break Estratégico (03h30-04h00) - Café + energéticos

---

## 📊 Points Distribution

- **Quest Points**: 100 + 50 + 50 = 200 (Fase 1), etc.
- **Boss Points**: 100 pts each (Fases 1-4)
- **Final Boss**: 200 pts (Fase 5)
- **Total Possible**: 1,600 pts

---

## ✅ Checklist

- [ ] Run UPDATE_QUEST_DURATION_MINUTES.sql
- [ ] Verify output shows correct durations
- [ ] Hard refresh browser
- [ ] Check dashboard displays new durations
- [ ] Verify timer calculations use correct values

---

**Status**: Ready to apply
**File**: `UPDATE_QUEST_DURATION_MINUTES.sql`
**Risk**: Very low (updating display values only)
**Time**: 1 minute to run SQL + refresh
