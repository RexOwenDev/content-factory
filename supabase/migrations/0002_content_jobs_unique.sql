-- M1 fix: Add unique constraint on content_jobs(project_id, market_id, content_type)
-- Without this, Inngest function retries re-insert duplicate jobs and fire double fan-out events.
-- The application comment claiming "idempotency via DB unique constraint" was incorrect — this
-- migration makes it true. createContentJobsForProject now uses upsert with ignoreDuplicates.

CREATE UNIQUE INDEX IF NOT EXISTS content_jobs_unique_job_idx
  ON content_jobs(project_id, market_id, content_type);
