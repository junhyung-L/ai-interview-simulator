/** Feedback report returned by /api/feedback and stored in the `feedback` table. */
export interface FeedbackData {
  strengths: string
  improvements: string
  total_score: number
  empathy_score: number
  problem_solving_score: number
  communication_score: number
}

export const SCORE_KEYS = ['total_score', 'empathy_score', 'problem_solving_score', 'communication_score'] as const
export type ScoreKey = (typeof SCORE_KEYS)[number]
export type SubScoreKey = Exclude<ScoreKey, 'total_score'>

/**
 * Single source of truth for score labels. Meanings follow the feedback
 * prompt in app/api/feedback/route.ts:
 * total_score = overall score out of 100,
 * empathy_score = empathy and emotional understanding,
 * problem_solving_score = problem-solving ability,
 * communication_score = clarity of communication.
 */
export const SCORE_LABELS: Record<ScoreKey, { label: string; labelKo: string }> = {
  total_score: { label: 'OVERALL', labelKo: '종합 점수' },
  empathy_score: { label: 'EMPATHY', labelKo: '공감 능력' },
  problem_solving_score: { label: 'PROBLEM SOLVING', labelKo: '문제 해결' },
  communication_score: { label: 'COMMUNICATION', labelKo: '커뮤니케이션' },
}

/** Sub-scores in display order, with their chart colors. */
export const SUB_SCORES: readonly { key: SubScoreKey; color: string }[] = [
  { key: 'empathy_score', color: '#0EA5E9' },
  { key: 'problem_solving_score', color: '#8B5CF6' },
  { key: 'communication_score', color: '#10B981' },
]

/** Fixed feedback used when no LLM key is set or the LLM reply fails validation. */
export const DEMO_FEEDBACK: FeedbackData = {
  strengths: '• 고객의 감정에 공감하며 경청하는 자세를 보여주었습니다.\n• 문제 해결 의지를 명확하게 표현했습니다.\n• 상대방의 말을 끊지 않고 끝까지 들었습니다.',
  improvements: '• 구체적인 해결 일정을 먼저 제시했다면 더 효과적이었을 것입니다.\n• 사과 표현이 다소 형식적으로 느껴질 수 있습니다. 더 진심 어린 표현을 연습해 보세요.\n• 대안을 제시할 때 선택지를 2가지 이상 제공하면 고객 만족도가 높아집니다.',
  total_score: 72,
  empathy_score: 78,
  problem_solving_score: 65,
  communication_score: 74,
}

function toText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() ? value : null
  // Some models return bullet lists as arrays of strings.
  if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string')) {
    return value.map((v) => (/^\s*[•-]/.test(v) ? v : `• ${v}`)).join('\n')
  }
  return null
}

function toScore(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 100) return null
  return Math.round(n)
}

/**
 * Validates an unknown value (parsed LLM JSON) against the feedback shape:
 * two non-empty text fields and four scores in [0, 100].
 * Returns the normalized feedback, or null with the list of problems.
 */
export function validateFeedback(value: unknown): { ok: true; data: FeedbackData } | { ok: false; errors: string[] } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, errors: ['not a JSON object'] }
  }
  const obj = value as Record<string, unknown>
  const errors: string[] = []

  const strengths = toText(obj.strengths)
  if (strengths === null) errors.push('strengths: expected non-empty text')
  const improvements = toText(obj.improvements)
  if (improvements === null) errors.push('improvements: expected non-empty text')

  const scores = {} as Record<ScoreKey, number>
  for (const key of SCORE_KEYS) {
    const score = toScore(obj[key])
    if (score === null) errors.push(`${key}: expected a number from 0 to 100`)
    else scores[key] = score
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, data: { strengths: strengths as string, improvements: improvements as string, ...scores } }
}

/** Extracts the JSON object from raw model text (bare, or inside a ```json fence). */
export function extractJson(rawText: string): unknown {
  const codeBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = codeBlock ? codeBlock[1] : (rawText.match(/\{[\s\S]*\}/) || [rawText])[0]
  try {
    return JSON.parse(jsonStr)
  } catch {
    return undefined
  }
}
