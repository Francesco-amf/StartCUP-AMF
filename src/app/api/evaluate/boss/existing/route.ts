import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const quest_id = searchParams.get('quest_id')
    const evaluator_id = searchParams.get('evaluator_id')

    if (!quest_id || !evaluator_id) {
      return NextResponse.json(
        { error: 'quest_id e evaluator_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar submissions desta quest
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        team_id,
        quest_id
      `)
      .eq('quest_id', quest_id)

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
      return NextResponse.json({ evaluations: [] })
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ evaluations: [] })
    }

    const submissionIds = submissions.map(s => s.id)

    // Buscar avaliações deste avaliador para estas submissions
    const { data: evaluations, error: evalError } = await supabase
      .from('evaluations')
      .select('submission_id, points, comments')
      .eq('evaluator_id', evaluator_id)
      .in('submission_id', submissionIds)

    if (evalError) {
      console.error('Error fetching evaluations:', evalError)
      return NextResponse.json({ evaluations: [] })
    }

    // Mapear submissions com team_id
    const result = evaluations?.map(ev => {
      const submission = submissions.find(s => s.id === ev.submission_id)
      return {
        team_id: submission?.team_id,
        points: ev.points,
        comments: ev.comments
      }
    }) || []

    return NextResponse.json({ evaluations: result })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ evaluations: [] })
  }
}
