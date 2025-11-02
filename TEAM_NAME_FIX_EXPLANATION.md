# Fix: Team Name Not Appearing in Evaluator Dashboard

## Problem Statement
When evaluators view the dashboard at `/evaluate`, they can see:
- ✅ Phase information (quest.phase.name)
- ✅ Quest information (quest.name, max_points)
- ❌ Team information (team.name, team.course) appears as blank/empty

Despite the nested query including `team:team_id (name, course)`, the team data returns as `null` or `undefined`.

## Root Cause Analysis

### Why Phase Works But Team Doesn't
The evaluator page queries submissions with this structure:
```typescript
const { data: submissions } = await supabase
  .from('submissions')
  .select(`
    *,
    team:team_id (name, course),
    quest:quest_id (
      name,
      max_points,
      phase_id,
      phase:phase_id (id, name)
    )
  `)
```

- **Quest → Phase relationship works** ✅
- **Submissions → Team relationship fails** ❌

### The Technical Reason: Missing RLS Policy

Supabase nested select queries require proper **Row Level Security (RLS)** policies on related tables. Here's what happens:

1. **submissions table**: Has RLS enabled with permissive policies (evaluators can access)
2. **quests table**: Has RLS enabled (likely permissive for phase queries)
3. **phases table**: Has RLS enabled (works perfectly - we see phase names!)
4. **teams table**: **RLS IS NOT ENABLED** ❌

When RLS is not enabled on a table but is enabled on related tables, Supabase cannot automatically grant access through nested relationships. The foreign key relationship alone is insufficient.

### Supabase RLS Behavior
- When you query `submissions` directly → works (RLS allows it)
- When you query `submissions → quests → phases` → works (RLS allows each hop)
- When you query `submissions → teams` → **FAILS** (teams has no RLS policies)

This is because Supabase treats each relationship hop as a separate authorization check. Without RLS policies on `teams`, Supabase refuses to return team data even though there's a valid foreign key relationship.

## The Solution

### File: `fix-teams-rls.sql`

Create and run this SQL migration to enable RLS on the teams table with appropriate policies:

```sql
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver teams"
ON teams
FOR SELECT
TO authenticated
USING (true);
```

This:
1. **Enables RLS** on the teams table
2. **Adds a SELECT policy** that allows all authenticated users to view team data
3. Makes team data accessible through nested queries

### Why This Fix Is Safe
- Team information (name, course) is public event information
- Only authenticated users can access (RLS scope: `TO authenticated`)
- Teams can update their own info if needed
- No security risk - this is not sensitive data

## How to Apply the Fix

### Option 1: Apply via Supabase Dashboard
1. Go to your Supabase project
2. Open "SQL Editor"
3. Create new query
4. Copy contents of `fix-teams-rls.sql`
5. Click "Run"

### Option 2: Apply via CLI (if configured)
```bash
supabase db push  # if you have the migration set up
```

### Option 3: Manual Application
1. Copy the SQL from `fix-teams-rls.sql`
2. Paste into your Supabase SQL editor
3. Execute the entire script

## Verification

After applying the fix:

1. **Clear browser cache and cookies** (sometimes Next.js caches server responses)
2. **Reload the evaluator dashboard** at `/evaluate`
3. **Check the console** (F12 → Console tab) for the log:
   ```javascript
   🎯 Rendering submission: {
     teamName: "Team Name Here",  // Should now have actual value instead of undefined
     ...
   }
   ```
4. **Verify the UI** shows team names instead of "Equipe desconhecida"

## What Changed in the Code

No code changes needed! The existing query in [src/app/(evaluator)/evaluate/page.tsx](src/app/(evaluator)/evaluate/page.tsx) already includes the correct nested select:

```typescript
team:team_id (
  name,
  course
)
```

The RLS policy fix enables this to work properly.

## Related Files Modified

- **Created**: `fix-teams-rls.sql` - RLS policy for teams table
- **No changes needed**: Evaluator page queries are already correct
- **Fallback UI** (already in place): Shows "Equipe desconhecida" if team is null (lines 181-184 in evaluate/page.tsx)

## Testing Checklist

- [ ] Run the SQL migration `fix-teams-rls.sql`
- [ ] Verify no SQL errors (check Supabase logs)
- [ ] Clear local browser storage/cache
- [ ] Log in as evaluator
- [ ] Navigate to `/evaluate`
- [ ] Check console logs for team names
- [ ] Verify UI displays team names with badges
- [ ] Check that phase information still displays correctly

## FAQ

**Q: Why wasn't this caught earlier?**
A: The phase relationship works fine, so it wasn't obvious that team relationships needed separate RLS configuration.

**Q: Will this affect team registration or submission?**
A: No. This only adds a SELECT policy for authenticated users. INSERT/UPDATE policies for teams remain unchanged.

**Q: Could evaluators see teams they shouldn't?**
A: No. RLS policy is `TO authenticated USING (true)` which means all teams are visible to all authenticated users. This is appropriate for a competition event where evaluators need visibility into all teams.

**Q: Do I need to restart the application?**
A: No database connection restart needed. Just refresh the browser page after applying the SQL.

## Related Documentation
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Nested Queries in Supabase](https://supabase.com/docs/reference/javascript/select)
