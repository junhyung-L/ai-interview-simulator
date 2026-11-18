export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { categoryLabels, counterpartLabels, difficultyLabels, Category, Difficulty } from '@/lib/personas'
import { DEMO_FEEDBACK, extractJson, validateFeedback } from '@/lib/feedback'
import { getSupabase } from '@/lib/supabase'

const isDemoMode = !process.env.OPENROUTER_API_KEY ||
  process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, category, difficulty, messages: clientMessages } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 1200))
      return NextResponse.json({ feedback: DEMO_FEEDBACK, sessionId, demo: true })
    }

    // Supabase에서 대화 기록 가져오기 (또는 클라이언트에서 전달받은 messages 사용)
    let conversationText = ''
    let categoryLabel = categoryLabels[(category || 'customer') as Category]
    let counterpartLabel = counterpartLabels[(category || 'customer') as Category] ?? 'AI'
    let difficultyLabel = difficultyLabels[(difficulty || 'beginner') as Difficulty]

    const supabase = getSupabase()
    if (supabase) {
      const [{ data: session }, { data: dbMessages }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', sessionId).single(),
        supabase.from('messages').select('*').eq('session_id', sessionId).order('created_at'),
      ])

      if (!session || !dbMessages) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      categoryLabel = categoryLabels[session.category as Category]
      counterpartLabel = counterpartLabels[session.category as Category] ?? 'AI'
      difficultyLabel = difficultyLabels[session.difficulty as Difficulty]
      conversationText = dbMessages
        .map((m: { role: string; content: string }) => `[${m.role === 'assistant' ? `AI ${counterpartLabel}` : '수강생'}]: ${m.content}`)
        .join('\n\n')
    } else if (clientMessages) {
      // Supabase 없을 때 클라이언트가 보낸 messages 배열 사용
      conversationText = (clientMessages as { role: string; content: string }[])
        .map(m => `[${m.role === 'assistant' ? `AI ${counterpartLabel}` : '수강생'}]: ${m.content}`)
        .join('\n\n')
    }

    const feedbackPrompt = `당신은 직무 교육 전문 코치입니다. 다음은 "${categoryLabel} - ${difficultyLabel}" 롤플레이 대화 기록입니다.

대화 기록:
${conversationText}

위 대화를 분석하여 다음 JSON 형식으로 피드백을 제공해주세요. JSON 외 다른 텍스트는 포함하지 마세요:

{
  "strengths": "잘한 점을 구체적으로 2-3가지 서술 (마크다운 불릿 포인트 형식으로)",
  "improvements": "개선이 필요한 점을 구체적으로 2-3가지 서술 (마크다운 불릿 포인트 형식으로)",
  "total_score": 100점 만점 종합 점수 (숫자),
  "empathy_score": 공감 및 감정 이해 점수 (0-100 숫자),
  "problem_solving_score": 문제 해결 능력 점수 (0-100 숫자),
  "communication_score": 커뮤니케이션 명확성 점수 (0-100 숫자)
}`

    const OpenAI = (await import('openai')).default
    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://jobsimulator.pages.dev',
        'X-Title': 'AI Roleplay Job Simulator',
      },
    })
    const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: feedbackPrompt }],
    })

    const rawText = response.choices[0]?.message?.content || ''
    const result = validateFeedback(extractJson(rawText))

    if (!result.ok) {
      // Malformed or out-of-range model output: return the demo report with a
      // flag instead of failing, and do not persist it as a real result.
      console.warn('Feedback validation failed:', result.errors.join('; '))
      return NextResponse.json({
        feedback: DEMO_FEEDBACK,
        sessionId,
        demo: true,
        fallbackReason: 'invalid_llm_output',
      })
    }

    const feedbackData = result.data

    if (supabase) {
      await Promise.all([
        supabase.from('feedback').insert({
          session_id: sessionId,
          ...feedbackData,
        }),
        supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId),
      ])
    }

    return NextResponse.json({ feedback: feedbackData, sessionId, demo: false })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
