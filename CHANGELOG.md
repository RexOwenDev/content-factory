# Changelog

All notable changes to ContentFactory are documented here.

---

## [0.8.0] — 2026-04-17

### Phase 8 — Documentation, Visuals & Launch

- Hero image (Gemini Imagen 4.0, 2K, 16:9)
- Architecture diagram (`docs/diagrams/architecture.mmd`) showing full pipeline flow
- Rewrote `README.md` — hero embed, feature table, inline Mermaid diagram, project structure, all-phases status
- Added `SETUP.md` — local dev guide, Supabase migration steps, Inngest Dev Server, live mode toggle, Vercel deploy
- Added `CHANGELOG.md` and `LICENSE`
- Updated `docs/PROJECT-MEMORY.md` — Phase 8 complete

---

## [0.7.0] — 2026-04-17

### Phase 7 — Dashboard Analytics & Demo Polish

- Global analytics page (`/analytics`) — project summary table, brand voice quality charts across all projects
- Per-project eval tab (`/projects/[id]/eval`) — EvalAnalytics component with RadarChart + BarChart
- Stats row on dashboard home — 4 live Supabase count queries
- Demo seed script (`scripts/seed-demo.ts`) — 3 showcase projects (ForgeTorque Pro, LuxDermis Serum, VeloCargo Bike)
- 23 fixture files across generated/, transcreated/, translated/, evaluated/, shopify/, wordpress/
- ProjectTabs component — Overview | Review | Eval tab navigation

---

## [0.6.0] — 2026-04-17

### Phase 6 — Output Shaping & Integration Adapters

- Shopify adapter — `product.metafields` + `shopify_translation` shape
- WordPress adapter — post body, Yoast SEO meta, WPML `hreflang` map
- Export API (`POST /api/projects/[id]/export`) — full bundle as downloadable JSON
- OutputViewer component — collapsible output cards with content layer tabs
- ExportButton client component
- `listOutputsByProject` query

---

## [0.5.0] — 2026-04-17

### Phase 5 — Review Queue & HITL

- Review queue page (`/projects/[id]/review`) — 3-column grid, SLA timer
- ReviewCard component — approve/reject, SLA colour coding (green/amber/red), self-removes on action
- Review API routes — GET queue, PATCH approve/reject with job status cascade
- `listPendingReviews` query with eval score join
- `createReview`, `approveReview`, `rejectReview` mutations

---

## [0.4.0] — 2026-04-17

### Phase 4 — Quality & Eval Harness

- LLM-as-judge eval via `generateObject` (Zod schema: score, tone_match, brand_voice_adherence, cultural_accuracy, hallucination_flag)
- `EVAL_THRESHOLDS.PASS = 75` — auto-rejects jobs below threshold
- `createEvalScore` query
- Eval analytics component — RadarChart (dimensions), BarChart (by locale, by content type), StatCard grid
- 20-entry eval dataset fixture (`fixtures/eval-dataset/eval-dataset.json`)

---

## [0.3.0] — 2026-04-17

### Phase 3 — Translation & Transcreation Pipeline

- `translateMarketFunction` Inngest function — full generate→translate→QA→eval chain
- Three translation modes: `deepl`, `claude`, `both` (DeepL draft → Claude refine)
- Back-translation QA — keyword overlap ratio, flags if < 40%
- DeepL adapter — fixture + live (`deepl` npm package)
- Claude `transcreate()` method — cultural adaptation with brand voice context
- Claude `backTranslate()` method — round-trip semantic check
- Fixed AI SDK v6 `maxOutputTokens` (not `maxTokens`) API

---

## [0.2.0] — 2026-04-17

### Phase 2 — AI Content Generation Core

- `generateContentFunction` Inngest function — fires on `project.submitted`, fans out N×M `job.started` events
- Claude adapter — fixture + live (Vercel AI Gateway `gateway()`)
- Inngest setup — `src/lib/inngest/client.ts`, `serve()` handler at `/api/inngest`
- Pipeline API — `POST /api/pipeline/generate`
- Content job queries — `createContentJobsForProject`, `updateJobStatus`, `listJobsByProject`
- Output queries — `createOutput`, `updateOutputFinal`, `getOutputByJobId`
- `src/lib/pipeline/prompts.ts` — prompt templates per content type
- RunPipelineButton, PipelineStatus components

---

## [0.1.0] — 2026-04-17

### Phase 1 — Brief Ingestion & Market Matrix

- Project creation form (`/projects/new`) — brief fields, brand voice, locale picker, content type selection, translation mode
- `createProject` mutation, `getProjectWithMarkets` query
- Markets auto-created on project insert
- ProjectCard component, dashboard grid

---

## [0.0.1] — 2026-04-17

### Phase 0 — Foundation & Scaffolding

- Next.js 16 / React 19 / TypeScript strict / Tailwind v4 / shadcn/ui (new-york)
- Supabase client + service role setup
- Always-dark design system (`#0d1117` bg, `#6366f1` primary)
- `src/lib/types.ts` — full domain type definitions
- `src/lib/config.ts` — `LOCALE_FLAGS`, `LOCALE_LABELS`, `CONTENT_TYPE_LABELS`, `EVAL_THRESHOLDS`
- Supabase migrations — all 6 tables with RLS
- Layout with sidebar navigation
- `.env.example`
