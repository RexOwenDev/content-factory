-- ContentFactory — Initial Schema
-- Run: supabase db push  OR  copy-paste into Supabase SQL Editor

-- ─── Projects ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'running', 'review', 'complete', 'failed')),
  brief JSONB NOT NULL DEFAULT '{}',
  brand_voice JSONB NOT NULL DEFAULT '{}',
  target_locales TEXT[] NOT NULL DEFAULT '{}',
  content_types TEXT[] NOT NULL DEFAULT '{}',
  translation_mode TEXT NOT NULL DEFAULT 'both'
    CHECK (translation_mode IN ('deepl', 'claude_transcreation', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Markets ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  cultural_context TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS markets_project_locale_idx ON markets(project_id, locale);

-- ─── Content Jobs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('product_description', 'ad_copy', 'meta_tags', 'landing_page_copy')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'generating', 'translating', 'transcreating',
      'evaluating', 'review_pending', 'approved', 'rejected', 'exported'
    )),
  inngest_run_id TEXT,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_jobs_project_idx ON content_jobs(project_id);
CREATE INDEX IF NOT EXISTS content_jobs_status_idx ON content_jobs(status);

-- ─── Outputs ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES content_jobs(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  content_type TEXT NOT NULL,
  source_content TEXT NOT NULL DEFAULT '',
  deepl_translation TEXT,
  transcreated_content TEXT,
  final_content TEXT,
  shopify_json JSONB,
  wordpress_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outputs_job_idx ON outputs(job_id);

-- ─── Reviews ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_id UUID NOT NULL REFERENCES outputs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_output_idx ON reviews(output_id);

-- ─── Eval Scores ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS eval_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_id UUID NOT NULL REFERENCES outputs(id) ON DELETE CASCADE,
  score NUMERIC(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  tone_match NUMERIC(5, 2) CHECK (tone_match >= 0 AND tone_match <= 100),
  brand_voice_adherence NUMERIC(5, 2) CHECK (brand_voice_adherence >= 0 AND brand_voice_adherence <= 100),
  cultural_accuracy NUMERIC(5, 2) CHECK (cultural_accuracy >= 0 AND cultural_accuracy <= 100),
  hallucination_flag BOOLEAN NOT NULL DEFAULT FALSE,
  evaluator_reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(output_id)
);

-- ─── Pipeline Events (audit log) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pipeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  job_id UUID REFERENCES content_jobs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pipeline_events_project_idx ON pipeline_events(project_id);
CREATE INDEX IF NOT EXISTS pipeline_events_type_idx ON pipeline_events(event_type);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER outputs_updated_at
  BEFORE UPDATE ON outputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
