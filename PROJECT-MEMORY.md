# PROJECT-MEMORY — ContentFactory

> This file is the canonical truth for the project. All models (Claude, Codex, Gemini)
> read from here. Never assume conversation context — always write everything Codex or
> Gemini needs into this file BEFORE dispatching them.

---

## Charter

| Field | Value |
|---|---|
| **Project** | ContentFactory |
| **Type** | modernization |
| **Repo** | `RexOwenDev/content-factory` (public) |
| **Local path** | `C:\Users\owenq\content-factory\` |
| **Live production impact** | NO — portfolio showcase only |
| **Created** | 2026-04-17 |
| **Stack** | Next.js 16 · TypeScript 5 · Tailwind v4 · shadcn/ui · Inngest 3.x · Supabase · Claude (Vercel AI Gateway) · DeepL · Recharts |

---

## AI Council Assignments

| Role | Model | Assignment |
|---|---|---|
| **General Manager** | Claude Opus 4.7 | Planning, routing, phase gates, work-split decisions |
| **Claude Coder** | Claude Sonnet 4.6 | `web-app-saas` persona (Next.js 16 + Supabase + Vercel) |
| **Codex Co-impl + Reviewer** | GPT-5.4 | `persona-code-reviewer` skill |
| **Codex model tier** | — | `spark` (routine) / `gpt-5.4` (security/gate) |
| **Gemini (3rd opinion)** | Gemini CLI v0.35.1 | `long-context-auditor` persona (Phase 0 whole-repo sweep) |

**Gemini invocation pattern for this project:**
```bash
cd /c/Users/owenq/content-factory && git ls-files | grep -v "node_modules\|\.next\|data\.db" | xargs cat 2>/dev/null | gemini -p "$(cat ~/.gemini/personas/long-context-auditor.md)

TASK: ..." --yolo
```

---

## Modernization Pass 2026-04-20

**Trigger:** Owner-requested QA audit — portfolio polish pass before showcasing
**Audit report:** `docs/audit-2026-04-20.md` (to be written after Phase 0 converges)

---

## Phase 0: Tandem QA Audit

**Status:** `IN-PROGRESS`
**Goal:** Three-lane parallel audit — Codex adversarial, Gemini long-context, Sonnet dep+semgrep. Converge into ranked finding list.

---

### Dispatch Brief (for Codex)

> Codex: Read this section. Context is NOT in the conversation — everything you need is here.

**Repo:** `C:\Users\owenq\content-factory`
**Stack:** Next.js 16 / TypeScript strict / Tailwind v4 / Supabase / Inngest 3.x / Claude AI SDK v6 / DeepL / Recharts  
**Mode:** Portfolio showcase. No auth (anon Supabase). ADAPTER_MODE=fixture|live toggle. Not deployed to prod.

**What you are reviewing:** Adversarial production-safety audit of the following surfaces, ranked by severity.

**Attack surface 1 — Inngest fan-out safety (`src/lib/inngest/functions/generate-content.ts`):**
- Are Inngest steps properly wrapped? (step.run vs bare async calls)
- Is the fan-out idempotent? What happens if the trigger fires twice for the same project?
- Is there onFailure handler? What happens if a child job crashes mid-pipeline?
- Are DB writes inside step boundaries (so they retry correctly)?
- Any race conditions between concurrent translateMarketFunction jobs on the same project?

**Attack surface 2 — API route input validation (`src/app/api/**`):**
- Routes: pipeline/generate, projects (GET/POST), projects/[id]/eval-summary, projects/[id]/export, projects/[id]/outputs, projects/[id]/reviews, reviews/[reviewId]
- Does every POST/PATCH route validate the request body with Zod?
- Are [id] path params validated (UUID format? existence check before query)?
- Do routes expose raw Supabase error messages to the caller?
- Any route that could trigger uncontrolled external API calls (Claude, DeepL, Shopify, WP)?

**Attack surface 3 — Supabase query hygiene (`src/lib/db/queries/*.ts`):**
- Are `.error` returns always destructured and handled?
- Any insert/update without `.select()` that swallows the result?
- Any query returning all columns when only a subset is needed?
- supabaseAdmin (service role) used anywhere in client-side code path? (It bypasses RLS — should be server-only)

**Attack surface 4 — External API calls (`src/lib/adapters/claude.ts`, `src/lib/adapters/deepl.ts`):**
- Missing try/catch around live API calls?
- Any unhandled promise rejections?
- DeepL free tier rate limits — any retry logic or backoff?
- Claude API errors — do they propagate to Inngest step and trigger proper retry?
- `src/lib/pipeline/prompts.ts` — can user-controlled brief fields inject into system prompt? Prompt injection surface?
- `src/lib/adapters/shopify.ts`, `src/lib/adapters/wordpress.ts` — credential handling, any logging of auth tokens?

**Attack surface 5 — Fixture path traversal (`src/lib/fixtures/loader.ts`):**
- Is the fixture path sanitized? Can a crafted locale or contentType string escape the fixtures directory?
- What happens with unknown locale/contentType values?

**Attack surface 6 — Silent failures:**
- Any catch blocks logging but returning empty/null without rethrowing?
- Inngest steps that catch and mark as "complete" when they should mark as "failed"?
- Any .catch(console.error) patterns on critical paths?

**Considered approaches:**
- Approach A: Run codex:adversarial-review on whole repo → **SELECTED** — best fit for this surface
- Approach B: codex:review (standard) → **REJECTED** — not adversarial enough for security surfaces

**Hard constraints Codex must NOT violate:**
- DO NOT modify any files — this is read-only audit
- DO NOT suggest refactors beyond what's needed for safety
- Focus on actual bugs/risks, not style preferences

**Codex lane — deliverable:**
- Severity-ranked findings table: CRITICAL / HIGH / MEDIUM / LOW
- Each finding: surface name, file:line, exact issue, recommended fix
- Final verdict: PASS / NEEDS-WORK / FAIL (with threshold: any CRITICAL = FAIL)

**Ambiguity protocol:**
If something is unclear, note it as "UNCLEAR — [what's ambiguous]" and continue.
Do NOT pause — this is an async review.

---

### Sonnet Lane (Claude)

- [x] Read package.json — dep audit complete
- [x] Map codebase structure via Explore agent
- [x] Semgrep scan — 34 rule errors (free tier, inconclusive), 0 findings
- [x] Read + manually reviewed: generate-content.ts, claude.ts, deepl.ts, db/client.ts, env.ts, fixtures/loader.ts, all API routes, prompts.ts, shopify.ts, wordpress.ts, db/queries/*.ts
- [x] Compiled findings: 0 CRITICAL, 3 HIGH, 6 MEDIUM, 6 LOW
- [x] Dep risk table: 6 major bumps, 2 HIGH impact (inngest v3→4, zod v3→4)
- [x] Audit report: docs/audit-2026-04-20.md

### Gemini Lane

- [x] CLI: FAILED — ~/.gemini/settings.json key missing/expired (exit 41)
- [x] MCP: FAILED — 503 high demand during audit window
- Status: Not available — re-auth needed before next run

### Codex Lane

- [ ] Adversarial review — dispatched, still initializing (bpkj8t15q)

---

### QA Checklist
- [ ] All three lanes converged
- [ ] Findings deduplicated + cross-referenced
- [ ] Audit report written to `docs/audit-2026-04-20.md`
- [ ] Dep upgrade risk table included
- [ ] Security (semgrep) findings included
- [ ] Council gate passed

---

## Parked Questions

*(empty)*

---

## Context Checkpoints

### Checkpoint 2026-04-20 (Phase 0 start)

**Current phase:** Phase 0 — Tandem QA Audit, IN-PROGRESS
**Claude lane status:** in-progress — dep audit done, semgrep + file reads running
**Codex lane status:** dispatched (adversarial review)
**Gemini lane status:** running (background, long-context sweep)
**Next action:** Wait for all three lanes to return, then converge findings into `docs/audit-2026-04-20.md`
**Key constraints:** Read-only audit. No code changes during Phase 0. Phase 1 (fix plan) needs Owen's approval.
**Parked questions:** None. Security key rotation status not confirmed — flag in audit report.
