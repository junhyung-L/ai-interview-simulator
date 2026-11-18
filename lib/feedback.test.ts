import { describe, expect, it } from 'vitest'
import { DEMO_FEEDBACK, SCORE_KEYS, SCORE_LABELS, extractJson, validateFeedback } from './feedback'

const valid = {
  strengths: 'Listened well.',
  improvements: 'Offer a concrete timeline.',
  total_score: 72,
  empathy_score: 78,
  problem_solving_score: 65,
  communication_score: 74,
}

describe('extractJson', () => {
  it('parses JSON inside a ```json fence', () => {
    const raw = 'Here is the report:\n```json\n' + JSON.stringify(valid) + '\n```\nThanks.'
    expect(extractJson(raw)).toEqual(valid)
  })

  it('parses JSON inside a bare ``` fence', () => {
    expect(extractJson('```\n{"a": 1}\n```')).toEqual({ a: 1 })
  })

  it('parses a bare object surrounded by prose', () => {
    expect(extractJson('Result: {"a": 1} done')).toEqual({ a: 1 })
  })

  it('returns undefined for text with no valid JSON', () => {
    expect(extractJson('no json here')).toBeUndefined()
    expect(extractJson('```json\n{broken\n```')).toBeUndefined()
  })
})

describe('validateFeedback', () => {
  it('accepts a well-formed report unchanged', () => {
    expect(validateFeedback(valid)).toEqual({ ok: true, data: valid })
  })

  it('accepts the demo feedback', () => {
    expect(validateFeedback(DEMO_FEEDBACK).ok).toBe(true)
  })

  it('coerces numeric strings to rounded numbers', () => {
    const result = validateFeedback({ ...valid, total_score: '80', empathy_score: ' 64.6 ' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.total_score).toBe(80)
      expect(result.data.empathy_score).toBe(65)
    }
  })

  it('rejects out-of-range scores', () => {
    for (const bad of [101, -1, '150', Number.NaN]) {
      const result = validateFeedback({ ...valid, communication_score: bad })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.errors).toEqual(['communication_score: expected a number from 0 to 100'])
    }
  })

  it('rejects non-numeric and empty-string scores', () => {
    expect(validateFeedback({ ...valid, total_score: 'high' }).ok).toBe(false)
    expect(validateFeedback({ ...valid, total_score: '' }).ok).toBe(false)
  })

  it('rejects a missing field and names it', () => {
    const { problem_solving_score: _omit, ...rest } = valid
    void _omit
    const result = validateFeedback(rest)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toEqual(['problem_solving_score: expected a number from 0 to 100'])
  })

  it('rejects missing or empty text fields', () => {
    const result = validateFeedback({ ...valid, strengths: '   ', improvements: undefined })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toEqual(['strengths: expected non-empty text', 'improvements: expected non-empty text'])
    }
  })

  it('converts array strengths to a bullet list, keeping existing bullets', () => {
    const result = validateFeedback({ ...valid, strengths: ['Calm tone', '• Clear apology', '- Summarized'] })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.strengths).toBe('• Calm tone\n• Clear apology\n- Summarized')
  })

  it('rejects empty arrays and arrays with non-strings', () => {
    expect(validateFeedback({ ...valid, strengths: [] }).ok).toBe(false)
    expect(validateFeedback({ ...valid, improvements: ['ok', 3] }).ok).toBe(false)
  })

  it('rejects non-objects', () => {
    for (const bad of [null, undefined, 'text', 42, [valid]]) {
      expect(validateFeedback(bad)).toEqual({ ok: false, errors: ['not a JSON object'] })
    }
  })

  it('works end to end with extractJson on a fenced reply', () => {
    const raw = '```json\n' + JSON.stringify({ ...valid, total_score: '90' }) + '\n```'
    const result = validateFeedback(extractJson(raw))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.total_score).toBe(90)
  })
})

describe('SCORE_LABELS', () => {
  it('maps all four score fields', () => {
    expect(SCORE_KEYS).toHaveLength(4)
    expect(Object.keys(SCORE_LABELS).sort()).toEqual([...SCORE_KEYS].sort())
  })

  it('gives each score a distinct, non-empty English and Korean label', () => {
    const en = SCORE_KEYS.map((k) => SCORE_LABELS[k].label)
    const ko = SCORE_KEYS.map((k) => SCORE_LABELS[k].labelKo)
    for (const label of [...en, ...ko]) expect(label.trim()).not.toBe('')
    expect(new Set(en).size).toBe(4)
    expect(new Set(ko).size).toBe(4)
  })
})
