export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { studentName, category, difficulty, userId } = await req.json()

    if (!studentName || !category || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      // Demo mode: no database, so issue a random session id.
      return NextResponse.json({
        session: { id: crypto.randomUUID(), student_name: studentName, category, difficulty, status: 'active', user_id: userId ?? null },
        demo: true,
      })
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert({ 
        student_name: studentName, 
        category, 
        difficulty, 
        status: 'active',
        user_id: userId 
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session: data })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
