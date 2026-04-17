# ContentFactory — Setup Guide

## Prerequisites

- Node.js 20+ / pnpm 9+
- A [Supabase](https://supabase.com/) project (free tier is fine)
- An [Inngest](https://www.inngest.com/) account (free tier is fine)
- Optional for live mode: Anthropic API key · DeepL API key

---

## 1. Clone and install

```bash
git clone https://github.com/RexOwenDev/content-factory
cd content-factory
pnpm install
```

---

## 2. Environment variables

```bash
cp .env.example .env.local
```

Minimum required to run in **fixture mode** (no AI API calls):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Inngest (local dev — use the Inngest Dev Server)
INNGEST_SIGNING_KEY=signkey-test-...
INNGEST_EVENT_KEY=...

# Fixture mode (default — no AI API keys needed)
ADAPTER_MODE=fixture
```

Additional variables for **live mode**:

```env
ADAPTER_MODE=live

# Claude via Vercel AI Gateway (auto-configured on Vercel)
# or direct Anthropic:
ANTHROPIC_API_KEY=sk-ant-...

# DeepL
DEEPL_API_KEY=...
```

---

## 3. Supabase schema

Apply the migrations from `supabase/migrations/`:

```bash
# Via Supabase CLI (recommended)
npx supabase db push

# Or manually run each .sql file in supabase/migrations/ in order
```

The schema creates these tables:
- `projects` — brief, brand voice, target locales, content types, translation mode
- `markets` — one row per locale per project
- `content_jobs` — one row per locale × content type (the fan-out unit)
- `outputs` — source, DeepL translation, transcreated, final content
- `eval_scores` — LLM-as-judge scores (tone, brand voice, cultural, hallucination)
- `reviews` — HITL review queue with approve/reject and reviewer notes

---

## 4. Seed demo data

```bash
pnpm db:seed
```

This runs `scripts/seed-demo.ts` and creates three showcase projects with outputs and eval scores pre-populated from fixtures.

---

## 5. Inngest Dev Server

The pipeline is orchestrated by [Inngest](https://www.inngest.com/). For local development:

```bash
# In a second terminal:
npx inngest-cli@latest dev

# Then start the Next.js dev server:
pnpm dev
```

The Inngest Dev Server proxies to your local `/api/inngest` route and gives you a UI at `http://localhost:8288` to inspect events, function runs, and retries.

---

## 6. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

In fixture mode, clicking **Run Pipeline** on a project will fire the Inngest event but all Claude/DeepL calls will be served from `fixtures/`. Check the Inngest Dev Server at `http://localhost:8288` to see the fan-out in action.

---

## Live mode

### Switch to real API calls

Set `ADAPTER_MODE=live` in `.env.local` and add the API keys listed in step 2.

The adapter pattern in `src/lib/adapters/` means each service has a `fixture` and `live` implementation that are swapped at runtime based on `ADAPTER_MODE`. To add a new adapter or swap a provider, implement the interface in `src/lib/adapters/types.ts`.

### DeepL API

Sign up at [deepl.com/pro-api](https://www.deepl.com/pro-api). The free tier supports 500,000 characters/month — more than enough for testing.

### Claude API (Vercel AI Gateway)

On Vercel, the AI Gateway is available via `gateway('anthropic/claude-opus-4-7')` from the `ai` package. Add your `ANTHROPIC_API_KEY` to Vercel environment variables and it will be used automatically.

For local development without Vercel, set `ANTHROPIC_API_KEY` directly and the live adapter falls back to the direct Anthropic provider.

---

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Link and deploy
vercel --prod
```

Set the following environment variables in your Vercel project settings:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `INNGEST_SIGNING_KEY` | Inngest dashboard → App → Keys |
| `INNGEST_EVENT_KEY` | Inngest dashboard → App → Keys |
| `ADAPTER_MODE` | `live` for production |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `DEEPL_API_KEY` | [deepl.com/pro-api](https://www.deepl.com/pro-api) |

After deployment, register your Inngest app:

1. Go to [app.inngest.com](https://app.inngest.com)
2. Add your app URL: `https://your-app.vercel.app/api/inngest`
3. Inngest will auto-discover and register your functions

---

## Type safety

The codebase uses TypeScript strict mode with `noUncheckedIndexedAccess`. Run the type checker:

```bash
pnpm type-check
```

---

## Project scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm type-check` | TypeScript check (no emit) |
| `pnpm db:migrate` | Apply Supabase migrations |
| `pnpm db:seed` | Seed 3 demo projects |
