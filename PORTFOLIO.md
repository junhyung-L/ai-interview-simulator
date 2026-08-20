# AI Job Simulator: Separating Live LLM Practice from Demo Mode

[English](PORTFOLIO.md) | [한국어](PORTFOLIO.ko.md)

## Overview

This Next.js application lets users practise customer-support, interview, and
sales conversations with an LLM counterpart, then receive structured coaching.

## Design decision

The main decision was to make the experience explorable without credentials
without confusing demo output with live LLM interaction. Chat and feedback
routes call an OpenRouter-compatible model only when configured; otherwise
they return checked-in demo replies. Supabase persistence is similarly
conditional, while demo feedback remains session-local.

## Implementation

Nine scenario variants live in `lib/personas.ts`. The client handles scenario
selection, roleplay, feedback, and dashboard views; API routes manage session
creation, conversation, and structured feedback with four score fields.

## Result boundary

The repository implements the full practice flow and an optional history path.
It retains no deployment, usage, latency, or learning-effectiveness evidence.

## Limitations

The scores are LLM-generated practice feedback, not validated hiring or
educational assessments. Versioned database policies and human-rating studies
are required before operational claims.

## Evidence

- [`README.md`](README.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Keeping the product flow intact

The user chooses a job category and difficulty, starts a role-play session, exchanges messages, and then receives feedback. `lib/personas.ts` defines the nine scenarios across three categories and three levels. The server creates a session UUID before chat, then sends the selected persona with conversation history so context survives each turn. Feedback is requested in a structured form: strengths, improvements, and four scores for overall performance, empathy, problem solving, and communication.

The central product decision is keeping generated and demonstration results separate. An OpenRouter-compatible model is called only when `OPENROUTER_API_KEY` is present; otherwise checked-in responses demonstrate the role-play-to-feedback flow. Real-mode sessions, messages, and feedback are accumulated through Supabase, while demo data lives only in browser `sessionStorage`. This lets a reviewer inspect the app without credentials while avoiding the implication that examples are real user records.

The repository demonstrates an integrated LLM practice flow, not proven coaching effectiveness. It retains no deployment URL, active-user count, latency data, or feedback-quality study. The four scores are a coaching interface rather than a hiring or educational assessment; versioned Supabase policy, human-rater agreement, and bias testing are the next validation steps.
