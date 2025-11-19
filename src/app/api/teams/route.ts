import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name, logo_url')
      .order('name')

    if (error) {
      console.error('Error fetching teams:', error)
      return NextResponse.json({ teams: [] })
    }

    return NextResponse.json({ teams: teams || [] })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ teams: [] })
  }
}
