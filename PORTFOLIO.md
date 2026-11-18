# AI Job Simulator: Separating Live LLM Practice from Demo Mode

[English](PORTFOLIO.md) | [한국어](PORTFOLIO.ko.md)

## Summary

This Next.js application lets users practise customer-support, interview, and
sales conversations with an LLM counterpart, then receive structured coaching:
strengths, improvements, and four 0-100 scores. Nine scenario prompts (three
categories x three difficulty levels) drive the roleplay. The central design
choice was to keep live LLM output and checked-in demo output on separate,
clearly gated paths. The result is a working practice flow in code; it is not
an evaluated coaching tool, and no deployment or usage evidence is retained.

## Challenge

- The counterpart has to stay in role across turns, so every request must carry
  the selected persona and the conversation so far.
- A portfolio reviewer usually has no API key or database, yet should still be
  able to see the roleplay-to-feedback flow without mistaking examples for real
  user records.
- Feedback has to arrive in a shape the UI can render and store, which means
  asking a free-text model for structured output.

## My contribution

The commit history runs 6-13 Apr 2026. After the Create Next App scaffold
commit, every commit is under my account, and the repository records no team.
That covers the scenario prompts, the three API routes, the live/demo gating,
the Supabase persistence and Google sign-in, and the feedback and dashboard
pages. Contest or course context is not documented in this repository.

## Decisions

**1. How to run without credentials.**
Options: require an API key and database for any use; mock the whole app; or
gate each integration on its own environment variable. I chose per-variable
gating: `/api/chat` and `/api/feedback` call the model only when
`OPENROUTER_API_KEY` is present and otherwise return checked-in demo replies
and fixed demo feedback; `/api/session` writes to Supabase only when its URL is
set and otherwise issues a UUID; demo feedback lives only in browser
`sessionStorage`. Why: a reviewer can walk the flow without secrets, and demo
content never lands in the same store as real sessions. Cost: two code paths
per route; the fixed demo scores can look like real output; and the landing
page still calls the Supabase client on load, so a browser run with no
Supabase variables has not been confirmed to work (found by reading the code,
not by running it).

**2. Which LLM interface.**
Options: a single vendor SDK, or the OpenAI-compatible client pointed at
OpenRouter. I chose the latter, with the model read from `OPENROUTER_MODEL`
and a default of `google/gemini-2.0-flash-exp:free`. Why: the model can change
through configuration without code changes. Cost: behaviour depends on
whichever model is configured, the free-tier default can change or disappear,
and `@anthropic-ai/sdk` remains in `package.json` although no route uses it.

**3. How to shape feedback.**
Options: free-text coaching, or JSON with fixed fields. I chose JSON with
strengths, improvements, `total_score`, `empathy_score`,
`problem_solving_score`, and `communication_score`, so the UI can draw score
rings and the dashboard can average stored results. Cost: the numbers look
precise but are uncalibrated; the route parses model text as JSON without
schema validation, so a malformed reply returns HTTP 500; and the UI currently
labels `empathy_score` as "COMMUNICATION" and `communication_score` as
"ADAPTABILITY".

## Results

| What exists | Evidence |
|---|---|
| Nine scenario prompts and fixed opening lines | `lib/personas.ts` |
| Session, chat, and feedback API routes with live/demo gating | `app/api/session`, `app/api/chat`, `app/api/feedback` |
| Optional Supabase persistence, Google sign-in, per-user dashboard | `lib/supabase.ts`, `lib/auth.ts`, `app/dashboard/page.tsx` |
| Variable names for every integration | `.env.example` |

There is no baseline or comparison point: no other system or human coach was
measured against this one.

## What the result does not show

The repository demonstrates an integrated LLM practice flow, not proven
coaching effectiveness. It retains no deployment URL, active-user count,
latency data, or feedback-quality study. The four scores are a coaching
interface rather than a hiring or educational assessment. `npm run lint` and
`npm run build` have not been confirmed in a clean install (see the README).

## What I would do next

1. Fix the score labels and validate the feedback JSON against a schema at the
   API boundary.
2. Guard the Supabase calls on the landing page so the no-credential demo path
   works end to end, then confirm it with a clean `npm ci` and `npm run build`.
3. Version the Supabase schema and RLS policy and add integration tests for the
   live and demo paths.
4. Define a rubric and measure agreement between LLM scores and trained human
   raters, including checks for bias across scenarios, before presenting the
   scores as anything beyond practice feedback.

## Evidence

- [`README.md`](README.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Routes: `app/api/session`, `app/api/chat`, `app/api/feedback`
