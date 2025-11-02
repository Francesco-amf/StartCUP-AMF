# Instructions to Seed Quest Data in Supabase

## The Problem
When you activated Phase 1, the system showed "Quests Ativas: 🟢 Sim", but the "Próximas Quests" section showed **0 active and 0 scheduled** quests. This is because no quest data exists in the database.

## The Solution
Execute the SQL seed script in your Supabase SQL Editor to populate the quests table with 3 test quests for Phase 1.

---

## Complete Schema of Quests Table

The `quests` table has these required columns:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | UUID | Yes | Primary key (auto-generated) |
| `phase_id` | UUID | Yes | Foreign key to phases table |
| `name` | VARCHAR | Yes | Quest name |
| `description` | TEXT | Yes | Quest description |
| `deliverable_type` | VARCHAR | Yes | Type: 'text', 'file', or 'url' |
| `status` | VARCHAR | Yes | Default: 'scheduled' |
| `max_points` | INTEGER | Yes | Points available |
| `order_index` | INTEGER | Yes | Order within phase |
| `duration_minutes` | INTEGER | Yes | Quest duration |
| `created_at` | TIMESTAMP | No | Auto-filled |
| `updated_at` | TIMESTAMP | No | Auto-filled |
| `started_at` | TIMESTAMP | No | When quest was started |
| `started_by` | UUID | No | User who started it |
| `ended_at` | TIMESTAMP | No | When quest ended |
| `auto_start_enabled` | BOOLEAN | No | Default: false |
| `auto_start_delay_minutes` | INTEGER | No | Default: 0 |

---

## Steps to Execute

### 1. Open Supabase Dashboard
Go to: https://supabase.com and log in to your StartCup AMF project

### 2. Navigate to SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### 3. Paste the SQL Script
Copy and paste this SQL script into the editor:

```sql
-- Seed de Quests para teste - VERSÃO COMPLETA
-- Script com todos os campos obrigatórios da tabela quests

-- Obter ID da Fase 1 e inserir quest 1
WITH phase_data AS (
  SELECT id FROM phases WHERE order_index = 1 LIMIT 1
)
INSERT INTO quests (
  phase_id,
  name,
  description,
  deliverable_type,
  status,
  max_points,
  order_index,
  duration_minutes
)
SELECT
  phase_data.id,
  'Quest 1: Apresentar Ideia',
  'Apresente sua ideia de negócio para o painel',
  'text',
  'scheduled',
  100,
  1,
  30
FROM phase_data
ON CONFLICT DO NOTHING;

-- Obter ID da Fase 1 e inserir quest 2
WITH phase_data AS (
  SELECT id FROM phases WHERE order_index = 1 LIMIT 1
)
INSERT INTO quests (
  phase_id,
  name,
  description,
  deliverable_type,
  status,
  max_points,
  order_index,
  duration_minutes
)
SELECT
  phase_data.id,
  'Quest 2: Validar Mercado',
  'Validar se o mercado existe para seu produto',
  'file',
  'scheduled',
  100,
  2,
  45
FROM phase_data
ON CONFLICT DO NOTHING;

-- Obter ID da Fase 1 e inserir quest 3
WITH phase_data AS (
  SELECT id FROM phases WHERE order_index = 1 LIMIT 1
)
INSERT INTO quests (
  phase_id,
  name,
  description,
  deliverable_type,
  status,
  max_points,
  order_index,
  duration_minutes
)
SELECT
  phase_data.id,
  'Quest 3: Definir MVP',
  'Definir o produto mínimo viável (MVP)',
  'url',
  'scheduled',
  100,
  3,
  60
FROM phase_data
ON CONFLICT DO NOTHING;

SELECT 'Quests criadas com sucesso!' as status;
```

### 4. Execute the Query
- Click the blue "Run" button (or press `Ctrl+Enter`)
- You should see: **"Quests criadas com sucesso!"**

### 5. Verify the Results
Open a new query and run:

```sql
SELECT q.id, q.name, q.description, q.deliverable_type, q.status, q.max_points, q.order_index, q.duration_minutes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;
```

You should see 3 rows returned.

---

## What This Script Does

1. **Gets Phase 1 ID**: Uses `WHERE order_index = 1` to find Phase 1 automatically
2. **Creates Quest 1**: "Apresentar Ideia" - text deliverable (30 min, 100 points)
3. **Creates Quest 2**: "Validar Mercado" - file deliverable (45 min, 100 points)
4. **Creates Quest 3**: "Definir MVP" - URL deliverable (60 min, 100 points)

All quests are set to `status = 'scheduled'` so they appear in the "Próximas Quests" section.

---

## After Execution

### On the Admin Control Panel:
- Go to "Controle de Quests (Automação)"
- You should now see:
  - **Quests Ativas**: 0
  - **Próximas Quests**: 3 (the three you just created)
  - **Quests Fechadas**: 0

### To Activate a Quest:
1. Click the **"INICIAR"** button on any quest in "Próximas Quests"
2. The quest will move to "Quests Ativas"
3. Its status changes to 'active'

### On Team Pages:
- Teams will see active quests in their submission page
- They can submit deliverables for active quests

---

## Troubleshooting

### Error: "null value in column 'deliverable_type'"
**Solution**: Make sure you included the `deliverable_type` field. The script above includes it with values: 'text', 'file', or 'url'.

### Error: "permission denied for schema public"
**Solution**: Make sure you're logged in as a user with admin/service role in Supabase.

### Error: "relation 'phases' does not exist"
**Solution**: The phases table hasn't been created. Run the phase creation script first.

### No results on verification query
**Solution**: Check that the query executed without errors. If it says "Quests criadas com sucesso!" but verification returns 0 rows, check that the phases table has data with `order_index = 1`.

---

## Key Files Referenced

- **Admin Control Panel**: `src/app/(admin)/control-panel/page.tsx`
- **Quest Control Component**: `src/components/admin/QuestControlPanelWrapper.tsx`
- **Database Schema**: `add-quest-automation-system.sql`

---

## Next Steps

After successfully seeding the quests:

1. ✅ Verify 3 quests appear in "Próximas Quests"
2. 🟡 Test clicking "INICIAR" on a quest
3. 🟡 Verify the quest moves to "Quests Ativas"
4. 🟡 Test team can see the active quest on their submit page
5. 🟡 Test evaluators see relevant submissions for the active quest
