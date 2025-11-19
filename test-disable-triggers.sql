-- ============================================================================
-- TEST: Disable triggers temporarily to identify the culprit
-- ============================================================================

-- 1. Disable the BEFORE UPDATE trigger
ALTER TABLE public.quests DISABLE TRIGGER auto_set_quest_started_at;

-- 2. Try a simple UPDATE on Quest 5.3
UPDATE public.quests
SET status = 'active', started_at = NOW()::timestamp
WHERE id = '40e52ab2-482f-4d09-97f8-cd37aae15402';

-- 3. Check if it worked
SELECT id, name, status, started_at
FROM public.quests
WHERE id = '40e52ab2-482f-4d09-97f8-cd37aae15402';

-- 4. Reset the quest
UPDATE public.quests
SET status = 'scheduled', started_at = NULL
WHERE id = '40e52ab2-482f-4d09-97f8-cd37aae15402';

-- 5. Re-enable the trigger
ALTER TABLE public.quests ENABLE TRIGGER auto_set_quest_started_at;

SELECT 'Test completed - check if UPDATE worked without trigger' as result;
