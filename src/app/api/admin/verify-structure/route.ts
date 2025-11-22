import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    // 1️⃣ VALIDAÇÃO DOS 7 REQUISITOS
    const { data: validation } = await supabase.from('quests').select('*', { count: 'exact' })

    // Query 1: Validar estrutura
    const validationQuery = `
      SELECT 
        CASE 
          WHEN 
            (SELECT COUNT(*) FROM phases WHERE order_index <= 4) = 4
            AND (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id WHERE p.order_index <= 4) = 16
          THEN '✅ Fases 1-4: 4 fases x 4 quests'
          ELSE '❌ Fases 1-4: ERRO'
        END as req1,
        
        CASE 
          WHEN 
            (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
             WHERE p.order_index <= 4 AND q.order_index IN (1,2,3) AND q.late_submission_window_minutes = 0) = 12
          THEN '✅ Q1-Q3: SEM late'
          ELSE '❌ Q1-Q3: TÊM late'
        END as req2,
        
        CASE 
          WHEN 
            (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
             WHERE p.order_index <= 4 AND q.order_index = 4 AND q.deliverable_type ILIKE '%presentation%') = 4
          THEN '✅ Boss: Tipo OK'
          ELSE '❌ Boss: Tipo ERRO'
        END as req3,
        
        CASE 
          WHEN 
            (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
             WHERE p.order_index <= 4 AND q.order_index = 4 AND q.duration_minutes = 10) = 4
          THEN '✅ Boss: 10 min'
          ELSE '❌ Boss: DURAÇÃO ERRADA'
        END as req4,
        
        CASE 
          WHEN 
            (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id WHERE p.order_index = 5) = 3
          THEN '✅ Fase 5: 3 quests'
          ELSE '❌ Fase 5: NÚMERO ERRADO'
        END as req5,
        
        CASE 
          WHEN 
            (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
             WHERE p.order_index = 5 AND q.late_submission_window_minutes > 0) = 3
          THEN '✅ F5: Todas COM late'
          ELSE '❌ F5: FALTAM late'
        END as req6,
        
        CASE 
          WHEN 
            (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
             WHERE p.order_index = 5 AND q.deliverable_type ILIKE '%presentation%') = 0
          THEN '✅ F5: SEM boss'
          ELSE '❌ F5: TEM boss'
        END as req7
    `

    const { data: validationResult } = await supabase.rpc('execute_sql', {
      sql: validationQuery,
    }).then(
      (result) => result,
      () => ({ data: null })
    )

    // Query 2: Todas as quests
    const questsQuery = `
      SELECT 
        p.order_index as phase,
        q.order_index as quest,
        q.name,
        q.duration_minutes as duration,
        COALESCE(q.late_submission_window_minutes, 0) as late_window,
        CASE WHEN q.deliverable_type ILIKE '%presentation%' THEN 'BOSS' ELSE 'Normal' END as tipo
      FROM quests q
      JOIN phases p ON q.phase_id = p.id
      ORDER BY p.order_index, q.order_index
    `

    const { data: questsResult } = await supabase.rpc('execute_sql', {
      sql: questsQuery,
    }).then(
      (result) => result,
      () => ({ data: null })
    )

    // Query 3: Tempo total
    const timeQuery = `
      SELECT 
        SUM(q.duration_minutes) as quests_total,
        20 as evaluation_window,
        SUM(q.duration_minutes) + 20 as total_minutes,
        ROUND((SUM(q.duration_minutes) + 20) / 60.0, 2) as total_hours
      FROM quests q
    `

    const { data: timeResult } = await supabase.rpc('execute_sql', {
      sql: timeQuery,
    }).then(
      (result) => result,
      () => ({ data: null })
    )

    // Query 4: Cronograma com horários
    const scheduleQuery = `
      WITH quest_timeline AS (
        SELECT 
          p.order_index as phase_idx,
          q.order_index as quest_idx,
          q.name,
          q.duration_minutes,
          CASE WHEN q.deliverable_type ILIKE '%presentation%' THEN 'BOSS' ELSE 'Normal' END as tipo,
          SUM(q.duration_minutes) OVER (ORDER BY p.order_index, q.order_index) - q.duration_minutes as inicio_acum,
          SUM(q.duration_minutes) OVER (ORDER BY p.order_index, q.order_index) as fim_acum
        FROM quests q
        JOIN phases p ON q.phase_id = p.id
        ORDER BY p.order_index, q.order_index
      )
      SELECT 
        phase_idx as phase,
        quest_idx as quest,
        name,
        tipo,
        duration_minutes as duration,
        TO_CHAR(
          TIMESTAMP '2025-11-21 21:00:00' + (inicio_acum || ' minutes')::INTERVAL,
          'HH24:MI'
        ) as start_time,
        TO_CHAR(
          TIMESTAMP '2025-11-21 21:00:00' + (fim_acum || ' minutes')::INTERVAL,
          'HH24:MI'
        ) as end_time
      FROM quest_timeline
      ORDER BY phase, quest
    `

    const { data: scheduleResult } = await supabase.rpc('execute_sql', {
      sql: scheduleQuery,
    }).then(
      (result) => result,
      () => ({ data: null })
    )

    return NextResponse.json({
      validation: validationResult,
      quests: questsResult,
      time: timeResult,
      schedule: scheduleResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao verificar estrutura:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar estrutura do evento' },
      { status: 500 }
    )
  }
}
