# StartCup AMF - Production Readiness Checklist (15 Teams)

## 🔧 Pre-Event Preparation

### 1. Database Cleanup ✓
- [ ] Execute `cleanup-test-data.sql` to remove test teams/data
- [ ] Verify `teams` table is empty or contains only real teams
- [ ] Confirm event_config is reset to phase 0
- [ ] Verify no stale penalties/submissions exist

### 2. Database Validation ✓
- [ ] Execute `validate-production-readiness.sql`
- [ ] Verify all required tables exist with correct schema
- [ ] Confirm RLS is enabled on sensitive tables
- [ ] Check live_ranking view is accessible

### 3. Environment Configuration ✓
- [ ] Set `NEXT_PUBLIC_EVENT_CONFIG_ID` to correct UUID
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` is production URL
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is set (server-only)
- [ ] Check all environment variables in `.env.local`

### 4. Admin Account Setup ✓
- [ ] Admin user email is registered in Auth
- [ ] Admin has `role: 'admin'` in user_metadata
- [ ] Test admin login works
- [ ] Verify admin can access `/admin/control-panel`

### 5. Evaluator Accounts Setup ✓
- [ ] All N evaluators registered in Auth
- [ ] All evaluators have `role: 'evaluator'` in user_metadata
- [ ] Evaluators created in `evaluators` table
- [ ] Test evaluator login and access to `/evaluator/evaluate`

### 6. Teams Registration ✓
- [ ] 15 teams registered in `teams` table
- [ ] Each team has valid email, name, course, members
- [ ] Teams can login (via team account or representative)
- [ ] Teams can access `/team/dashboard`

### 7. Phases & Quests Setup ✓
- [ ] 5 phases created with correct durations:
  - Phase 1: Descoberta (2h30min)
  - Phase 2: Criação (3h30min)
  - Phase 3: Estratégia (2h30min)
  - Phase 4: Refinamento (2h)
  - Phase 5: Pitch Final (1h30min)
- [ ] All quests created for each phase
- [ ] Quest status set to 'scheduled'
- [ ] Max points configured for each quest

### 8. Performance Testing ✓
- [ ] Test `/api/live-ranking` with 15 teams
- [ ] Verify `live_ranking` view query time < 200ms
- [ ] Test real-time updates with 10+ simultaneous connections
- [ ] Monitor database CPU/memory during load testing

### 9. Feature Testing ✓
- [ ] Phase transitions work (admin control panel)
- [ ] Timers display correctly in all components
- [ ] Ranking updates in real-time
- [ ] Submissions work for all phases
- [ ] Evaluations save correctly
- [ ] Penalties apply and update scores
- [ ] Power-ups system functional

### 10. UI/UX Polish ✓
- [ ] Remove all console.log() debug statements
- [ ] Remove all placeholder/test data from UI
- [ ] Verify responsive design on mobile/tablet
- [ ] Test all error messages are user-friendly
- [ ] Check accessibility (WCAG 2.1 AA)

### 11. Security Review ✓
- [ ] RLS policies reviewed and tested
- [ ] Admin endpoints require admin role
- [ ] Evaluator endpoints require evaluator role
- [ ] No sensitive data in client-side code
- [ ] API rate limiting configured
- [ ] CORS settings correct for production domain

### 12. Monitoring & Logging ✓
- [ ] Error logging configured
- [ ] Real-time monitoring dashboard set up
- [ ] Alert thresholds defined
- [ ] Database backups configured
- [ ] Performance metrics collection enabled

### 13. Deployment ✓
- [ ] Code merged to main branch
- [ ] All tests passing
- [ ] Environment variables set in production
- [ ] Database migrations run on production
- [ ] Vercel/hosting deployment complete
- [ ] DNS updated to point to production

### 14. Post-Deployment ✓
- [ ] Test live.startcup.com accessibility
- [ ] Verify all endpoints working
- [ ] Test with real users/browsers
- [ ] Monitor error logs for 1st hour
- [ ] Admin ready to start event
- [ ] Support team on standby

## 🎬 Event Execution Flow

### 30 min before event
1. Admin logs into control panel
2. Verify all 15 teams are present in system
3. Check all evaluators are available
4. Send "event starting in 30 min" notification

### At event start time
1. Admin clicks "Phase 1: Descoberta" in control panel
2. Verify:
   - Timer starts in live dashboard
   - Teams see current quest
   - Evaluators see submissions list
3. Monitor for any errors

### Between phases
1. Admin advances to next phase
2. Previous phase submissions should be closed
3. New quest should appear on team dashboards
4. Verify timing is correct

### At event end
1. Admin sets to Phase 0 (closed)
2. Verify no new submissions accepted
3. Generate final rankings report
4. Notify all participants

## 📊 Performance Targets

- **Live Dashboard Load**: < 1 second
- **Ranking Update**: < 500ms
- **API Response Time**: < 200ms
- **Database Query**: < 100ms
- **Real-time Sync**: < 2 second latency

## 🆘 Emergency Contacts

- Database Issue: Check Supabase dashboard
- Deployment Issue: Check Vercel logs
- User Issue: Admin can manually intervene in control panel
- Critical Issue: Rollback to last stable version

## ✅ Sign-off

- [ ] QA Lead Approval
- [ ] Admin Lead Approval
- [ ] Tech Lead Approval
- [ ] Event Manager Approval

---

**Last Updated**: 2025-11-02
**Status**: Ready for Production
