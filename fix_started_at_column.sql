-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS quest_status_by_phase CASCADE;

-- Step 2: Alter the started_at column in the quests table
ALTER TABLE public.quests
ALTER COLUMN started_at TYPE TIMESTAMP WITH TIME ZONE
USING started_at AT TIME ZONE 'UTC';

-- Step 3: Recreate the quest_status_by_phase view
CREATE OR REPLACE VIEW quest_status_by_phase AS
SELECT
  p.id as phase_id,
  p.name as phase_name,
  p.duration_minutes as phase_duration,
  COUNT(DISTINCT q.id) as total_quests,
  COUNT(DISTINCT CASE WHEN q.status = 'active' THEN q.id END) as active_quests,
  COUNT(DISTINCT CASE WHEN q.status = 'scheduled' THEN q.id END) as scheduled_quests,
  COUNT(DISTINCT CASE WHEN q.status = 'closed' THEN q.id END) as closed_quests,
  MAX(q.started_at) as last_quest_started,
  MIN(q.ended_at) FILTER (WHERE q.ended_at IS NOT NULL) as first_quest_ended
FROM phases p
LEFT JOIN quests q ON p.id = q.phase_id
GROUP BY p.id, p.name, p.duration_minutes
ORDER BY p.order_index ASC;