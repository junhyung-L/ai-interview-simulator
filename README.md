# Job Simulator AI

LLM roleplay practice for interviews, customer support, and sales.

[한국어](README.ko.md) · [Case study](PORTFOLIO.md)

A Next.js web app. The user picks a conversation type and a difficulty,
roleplays with an LLM counterpart, and then receives an LLM-written feedback
report with strengths, improvements, and four 0-100 scores.

**Problem.** Practicing a hard conversation needs a counterpart who stays in
role and feedback that arrives in a usable shape.

**What is built.** Nine scenario prompts (3 categories x 3 difficulty levels)
in `lib/personas.ts`; session, chat, and feedback API routes; live LLM replies
through OpenRouter (a hosted gateway to many LLMs) when `OPENROUTER_API_KEY` is
set and scripted demo replies when it is not; optional Supabase (hosted
Postgres with auth) persistence and Google sign-in.

**Scope.** A working practice flow, not a proven coaching effect: no
deployment, user study, or model-quality evaluation, and the four scores are
LLM-generated without rubric calibration.

**Try it.** `npm ci`, set the two `NEXT_PUBLIC_SUPABASE_*` variables (the
landing page needs them), then `npm run dev`; chat and feedback return demo
content without an LLM key.

## At a glance

LLM-generated parts are marked; everything else is plain code that does not
go through the LLM.

- Three scenario categories (customer support, interview, sales), each with
  beginner, intermediate, and advanced prompt variants in `lib/personas.ts`.
  Opening lines are fixed text per scenario.
- Session creation through `/api/session`, with a UUID fallback when Supabase
  is not configured.
- A roleplay chat route that calls an OpenRouter-compatible OpenAI client when
  `OPENROUTER_API_KEY` is available (**LLM-generated** replies), or returns
  scripted demo replies.
- A feedback route that requests structured strengths, improvements, and four
  numeric scores from the LLM (**LLM-generated**), or returns fixed demo
  feedback without an API key.
- Optional Google OAuth, Supabase persistence, per-session feedback display,
  and a dashboard that aggregates stored feedback for the signed-in user.

## Application flow

```mermaid
flowchart LR
    A[Choose scenario, difficulty, and name] --> B["/api/session"]
    B --> C[Roleplay chat page]
    C --> D["/api/chat"]
    D --> E{OPENROUTER_API_KEY configured?}
    E -->|Yes| F[OpenRouter-compatible LLM call]
    E -->|No| G[Scripted demo reply]
    F --> H[Conversation and optional message persistence]
    G --> H
    H --> I["/api/feedback"]
    I --> J[LLM feedback or fixed demo feedback]
    J --> K[Feedback page]
    K --> L[Optional Supabase dashboard]
```

## Architecture and data handling

| Layer | Responsibility | Files |
|---|---|---|
| Client | Scenario selection, chat, feedback view, dashboard, and webview guidance | `app/page.tsx`, `app/roleplay/page.tsx`, `app/feedback/page.tsx`, `app/dashboard/page.tsx`, `components/` |
| API | Session lifecycle, roleplay response, and structured feedback request | `app/api/session/route.ts`, `app/api/chat/route.ts`, `app/api/feedback/route.ts` |
| LLM | Scenario prompts in `lib/personas.ts`; OpenRouter-compatible chat completion calls in API routes | `lib/personas.ts`, `app/api/chat/route.ts`, `app/api/feedback/route.ts` |
| Persistence | Supabase browser client and tables for sessions, messages, and feedback | `lib/supabase.ts`, `lib/auth.ts` |

Without Supabase credentials, the API routes use the demo path and the client
keeps feedback in `sessionStorage` only.

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill in only the
integrations you need:

| Variable | Effect when set | When empty |
|---|---|---|
| `OPENROUTER_API_KEY` | Live LLM replies and feedback | Scripted demo replies and fixed demo feedback |
| `OPENROUTER_MODEL` | Overrides the model | `google/gemini-2.0-flash-exp:free` (source default) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Google sign-in and database persistence | Random session UUID; feedback kept in `sessionStorage` |

The database type declaration expects `sessions`, `messages`, and `feedback`
tables.

## How to run

Requires Node.js 18.18 or later (the Next.js 15 requirement). The package
scripts use Next.js 15.1.4:

```powershell
npm ci
copy .env.example .env.local   # optional; see the table above
npm run dev
```

Open the local URL reported by Next.js. With no variables set, `/api/chat` and
`/api/feedback` return scripted content and `/api/session` returns a random
UUID.

## Repository layout

```text
app/
  api/                 # Session, chat, and feedback route handlers
  auth/                # OAuth callback/error paths
  roleplay/            # Conversation interface
  feedback/            # Per-session LLM feedback display
  dashboard/           # Stored-session summary for signed-in users
components/             # Authentication and webview UI helpers
lib/                    # Personas, Supabase client, and auth helpers
public/                 # Logo and favicon
.env.example            # Variable names only; no values
```

## Limitations

- No deployment, user study, latency benchmark, or model-quality evaluation; the app shows a working practice flow, not proven coaching effect.
- The four scores (`total_score`, `empathy_score`, `problem_solving_score`, `communication_score`) are LLM-generated with no rubric calibration or human-rater agreement; use them for practice reflection, not employment, educational, or other high-stakes decisions.
- The feedback page and dashboard label `empathy_score` as "COMMUNICATION" and `communication_score` as "ADAPTABILITY".
- The landing page and sign-in button call the Supabase client on load, and `lib/supabase.ts` throws when the Supabase variables are unset, so the landing page can fail in the browser without them.
- Lint and type checks are disabled in `next.config.ts`.

## Documentation

- [Case study](PORTFOLIO.md)
- [Architecture](docs/ARCHITECTURE.md)
