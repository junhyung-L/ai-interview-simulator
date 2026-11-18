# Architecture

The application has two operational modes. Live mode sends scenario prompts and
conversation history to an OpenRouter-compatible LLM endpoint and can persist
data in Supabase. Demo mode returns checked-in mock replies and feedback so the
interface can be explored without external credentials.

```mermaid
flowchart LR
    A[Scenario selection] --> B[Session API]
    B --> C[Roleplay UI]
    C --> D[Chat API]
    D --> E[Live LLM or mock reply]
    E --> F[Feedback API]
    F --> G[Live LLM or mock feedback]
    G --> H[Feedback UI]
    H --> I[Optional Supabase dashboard]
```

The database path is conditional: the code writes sessions, messages, and
feedback only when its Supabase configuration check passes. Without Supabase
variables, `getSupabase()` in `lib/supabase.ts` returns `null` and every caller
skips auth and storage. The feedback route validates model JSON with
`validateFeedback()` in `lib/feedback.ts` and returns the demo report with
`demo: true` when validation fails. Route-level details
are implemented in the application source tree.
