# Project Review

## Evidence basis

This review is based on checked-in TypeScript/TSX source, package metadata, and
the logo/favicon assets. No deployed environment, Supabase instance, API keys,
user data, benchmark, or automated test output was available.

## Assessment

| Area | Assessment | Evidence |
|---|---|---|
| Product framing | The three scenario categories and difficulty variants make the practice use case concrete | `app/page.tsx`, `lib/personas.ts` |
| LLM interaction design | Separate roleplay and coach prompts provide a clear conversational and feedback flow | `app/api/chat/route.ts`, `app/api/feedback/route.ts` |
| Data handling | Live mode conditionally persists sessions/messages/feedback; demo mode falls back to client-held messages and `sessionStorage` | API routes, `app/roleplay/page.tsx`, `app/feedback/page.tsx` |
| Score design | Four score fields and qualitative feedback are present, but their rubric validity is undocumented | Feedback route, `lib/supabase.ts` |
| Evaluation rigor | No prompt tests, reliability checks, user study, fairness analysis, or benchmark artifact is stored | repository file inventory |
| Reproducibility | Package versions and scripts are present, but local execution and external services were not verified in this pass | `package.json`, absent local environment configuration |
| Portfolio evidence | Code supports an end-to-end feature narrative; no meaningful screenshots or outcome metrics are stored | `app/`, `public/` |

## Strengths

- The application has a coherent end-to-end path from scenario selection to
  feedback and optional historical dashboarding.
- Demo fallbacks make the intended interaction path inspectable without secrets
  or external providers.
- The explicit `sessions`, `messages`, and `feedback` type definitions make the
  persistence model understandable.
- Scenario prompting is centralized rather than scattered through UI files.

## Limitations

- LLM-generated scores lack a documented rubric, calibration data, human
  agreement study, and reliability/fairness evidence.
- The feedback route parses model text as JSON without a versioned schema or
  recovery strategy documented in the repository.
- The schema and row-level-security policy for Supabase are absent, so data
  access guarantees cannot be reviewed here.
- Demo mode accepts client-supplied messages for feedback and does not model a
  trusted assessment record.
- UI labels should be checked against the score-field names before presenting
  the output as a competency framework.

## Priority improvements

1. Version database migrations/RLS policies and add integration tests for the
   live and demo paths.
2. Define a transparent feedback rubric; measure reliability against trained
   human raters and report uncertainty rather than only point scores.
3. Validate structured feedback at the API boundary, enforce length/rate limits,
   and log provider failures safely.
4. Collect consented usability evidence and real task outcomes before claiming
   educational effectiveness, time savings, or production readiness.
