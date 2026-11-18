# Job Simulator AI

LLM roleplay practice for interviews, customer support, and sales.

[English](PORTFOLIO.md) | [한국어](PORTFOLIO.ko.md) · [README](README.md)

Built in 8 days for the 2026 KEG Vibe Coding Contest (Apr 6–13, 2026).

## At a glance

A Next.js application for practicing customer-support, interview, and sales
conversations with an LLM counterpart, followed by structured coaching:
strengths, improvements, and four 0-100 scores. Nine scenario prompts (three
categories x three difficulty levels) drive the roleplay. The central design
choice keeps live LLM output and the demo responses stored in the repository
on separate, clearly gated paths.

Try it now: `npm ci`, then `npm run dev`. The full flow runs with no keys.
`npm run lint`, `npx tsc --noEmit`, and `npm run build` pass with no
environment variables.

What made it hard:

- The counterpart has to stay in role across turns, so every request carries
  the selected persona and the conversation so far.
- A reviewer usually has no API key or database, yet should still see the
  roleplay-to-feedback flow without mistaking examples for real user records.
- Feedback must arrive in a shape the UI can render and store, which means
  asking a free-text model for structured output.

## Key decisions

**1. How to run without credentials.**
Options: require an API key and database for any use; mock the whole app; or
gate each integration on its own environment variable.
Choice: per-variable gating. `/api/chat` and `/api/feedback` call the model
only when `OPENROUTER_API_KEY` is present and otherwise return the demo replies
and fixed demo feedback stored in the repository; `/api/session` writes to
Supabase only when its URL is set and otherwise issues a UUID; demo feedback
lives only in browser `sessionStorage`.
Why: a reviewer can walk the flow without secrets, and demo content never lands
in the same store as real sessions.
The Supabase client factory returns `null` when its variables are unset, so
sign-in shows as unavailable and history degrades to a notice.
Cost: two code paths per route, a `null` check at every Supabase caller, and
fixed demo scores that can look like real output (the feedback page labels
them as demo).

**2. Which LLM interface.**
Options: a single vendor SDK, or the OpenAI-compatible client pointed at
OpenRouter.
Choice: the latter, with the model read from `OPENROUTER_MODEL` and a default
of `google/gemini-2.0-flash-exp:free`.
Why: the model changes through configuration, not code.
Cost: behavior depends on the configured model, and the free-tier default can
change or disappear.

**3. How to shape feedback.**
Options: free-text coaching, or JSON with fixed fields.
Choice: JSON with strengths, improvements, `total_score`, `empathy_score`,
`problem_solving_score`, and `communication_score`.
Why: the UI can draw score rings and the dashboard can average stored results.
A hand-written validator (`lib/feedback.ts`) checks two non-empty text fields
and four scores from 0 to 100; invalid output returns the demo report flagged
`demo: true` instead of HTTP 500. One label map (`SCORE_LABELS`) names the
scores on every screen.
Cost: the numbers look precise but are uncalibrated, and an invalid reply shows
example content rather than an analysis of the user's conversation.

## Results

| What exists | Files |
|---|---|
| Nine scenario prompts and fixed opening lines | `lib/personas.ts` |
| Session, chat, and feedback API routes with live/demo gating | `app/api/session`, `app/api/chat`, `app/api/feedback` |
| Feedback JSON validation, shared score labels, flagged demo fallback | `lib/feedback.ts`, `app/api/feedback/route.ts` |
| Optional Supabase persistence, Google sign-in, per-user dashboard; demo-mode state when unset | `lib/supabase.ts`, `lib/auth.ts`, `components/AuthButton.tsx`, `app/dashboard/page.tsx` |
| Lint, type check, and production build pass with no environment variables | `eslint.config.mjs`, `next.config.ts` |
| Variable names for every integration | `.env.example` |

## Limitations

- A working practice flow, not proven coaching effect: no deployment URL, active-user count, latency data, feedback-quality study, or comparison with another system or human coach.
- The four scores are a coaching interface, not a hiring or educational assessment.
- No automated tests; verification is lint, type check, build, and manual API and browser checks.

## Next steps

1. Add unit tests for the feedback validator and integration tests for the
   live and demo paths.
2. Version the Supabase schema and RLS policy.
3. Define a rubric and measure agreement between LLM scores and trained human
   raters, including checks for bias across scenarios, before presenting the
   scores as anything beyond practice feedback.

Routes: `app/api/session`, `app/api/chat`, `app/api/feedback` ·
[Architecture](docs/ARCHITECTURE.md)
