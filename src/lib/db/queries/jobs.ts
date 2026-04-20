import { supabaseAdmin } from '../client'
import type { ContentJob, ContentType, JobStatus, Locale } from '../../types'

export async function createContentJobsForProject(
  projectId: string,
  markets: Array<{ id: string; locale: Locale }>,
  contentTypes: ContentType[]
): Promise<ContentJob[]> {
  const rows = markets.flatMap((market) =>
    contentTypes.map((contentType) => ({
      project_id: projectId,
      market_id: market.id,
      content_type: contentType,
      status: 'pending' as JobStatus,
      inngest_run_id: null,
      error: null,
      started_at: null,
      completed_at: null,
    }))
  )

  // upsert with ignoreDuplicates makes this step safe to retry: if Inngest re-runs
  // the fan-out function, duplicate rows are skipped (requires migration 0002).
  const { data, error } = await (supabaseAdmin.from('content_jobs') as any)
    .upsert(rows, { onConflict: 'project_id,market_id,content_type', ignoreDuplicates: true })
    .select()

  if (error) throw new Error(`Failed to create content jobs: ${error.message}`)
  return (data ?? []) as ContentJob[]
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  opts?: { inngestRunId?: string; error?: string }
): Promise<void> {
  const patch: Record<string, unknown> = { status }
  if (opts?.inngestRunId) patch['inngest_run_id'] = opts.inngestRunId
  if (opts?.error) patch['error'] = opts.error
  if (status === 'generating') patch['started_at'] = new Date().toISOString()
  if (status === 'approved' || status === 'rejected' || status === 'exported') {
    patch['completed_at'] = new Date().toISOString()
  }

  const { error } = await (supabaseAdmin.from('content_jobs') as any)
    .update(patch)
    .eq('id', jobId)

  if (error) throw new Error(`Failed to update job ${jobId}: ${error.message}`)
}

export async function listJobsByProject(projectId: string): Promise<ContentJob[]> {
  const { data, error } = await (supabaseAdmin.from('content_jobs') as any)
    .select('*, markets(locale)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to list jobs: ${error.message}`)
  return data as ContentJob[]
}

export async function getJobById(jobId: string): Promise<ContentJob | null> {
  const { data, error } = await (supabaseAdmin.from('content_jobs') as any)
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) return null
  return data as ContentJob
}
