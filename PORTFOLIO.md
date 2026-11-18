# Job Simulator AI

LLM roleplay practice for interviews, customer support, and sales.

[English](PORTFOLIO.md) | [한국어](PORTFOLIO.ko.md) · [README](README.md)

## At a glance

A Next.js application for practicing customer-support, interview, and sales
conversations with an LLM counterpart, followed by structured coaching:
strengths, improvements, and four 0-100 scores. Nine scenario prompts (three
categories x three difficulty levels) drive the roleplay. The central design
choice keeps live LLM output and the demo responses stored in the repository
on separate, clearly gated paths.

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
Cost: two code paths per route, fixed demo scores that can look like real
output, and a landing page that still calls the Supabase client on load.

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
Cost: the numbers look precise but are uncalibrated, and the route parses model
text as JSON without schema validation, so a malformed reply returns HTTP 500.

## Results

| What exists | Files |
|---|---|
| Nine scenario prompts and fixed opening lines | `lib/personas.ts` |
| Session, chat, and feedback API routes with live/demo gating | `app/api/session`, `app/api/chat`, `app/api/feedback` |
| Optional Supabase persistence, Google sign-in, per-user dashboard | `lib/supabase.ts`, `lib/auth.ts`, `app/dashboard/page.tsx` |
| Variable names for every integration | `.env.example` |

## Limitations

- A working practice flow, not proven coaching effect: no deployment URL, active-user count, latency data, feedback-quality study, or comparison with another system or human coach.
- The four scores are a coaching interface, not a hiring or educational assessment.
- The feedback page and dashboard label `empathy_score` as "COMMUNICATION" and `communication_score` as "ADAPTABILITY".
- Without the Supabase variables, the landing page can fail in the browser because it calls the Supabase client on load.

## Next steps

1. Fix the score labels and validate the feedback JSON against a schema at the
   API boundary.
2. Guard the Supabase calls on the landing page so the no-credential demo path
   works end to end.
3. Version the Supabase schema and RLS policy and add integration tests for the
   live and demo paths.
4. Define a rubric and measure agreement between LLM scores and trained human
   raters, including checks for bias across scenarios, before presenting the
   scores as anything beyond practice feedback.

Routes: `app/api/session`, `app/api/chat`, `app/api/feedback` ·
[Architecture](docs/ARCHITECTURE.md)
