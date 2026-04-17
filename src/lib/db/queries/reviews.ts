import { supabaseAdmin } from '../client'
import type { Review } from '../../types'

export async function createReview(outputId: string): Promise<Review> {
  const { data, error } = await (supabaseAdmin.from('reviews') as any)
    .insert({
      output_id: outputId,
      status: 'pending',
      reviewer_note: null,
      reviewed_at: null,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create review: ${error.message}`)
  return data as Review
}

export async function approveReview(
  reviewId: string,
  reviewerNote?: string
): Promise<Review> {
  const { data, error } = await (supabaseAdmin.from('reviews') as any)
    .update({
      status: 'approved',
      reviewer_note: reviewerNote ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single()

  if (error) throw new Error(`Failed to approve review ${reviewId}: ${error.message}`)
  return data as Review
}

export async function rejectReview(
  reviewId: string,
  reviewerNote: string
): Promise<Review> {
  const { data, error } = await (supabaseAdmin.from('reviews') as any)
    .update({
      status: 'rejected',
      reviewer_note: reviewerNote,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single()

  if (error) throw new Error(`Failed to reject review ${reviewId}: ${error.message}`)
  return data as Review
}

export async function listPendingReviews(projectId: string): Promise<
  Array<Review & { output: { locale: string; content_type: string; final_content: string | null }; score: number | null }>
> {
  // Join reviews → outputs → eval_scores, filter by project via content_jobs
  const { data, error } = await (supabaseAdmin.from('reviews') as any)
    .select(`
      *,
      outputs:output_id (
        id, locale, content_type, final_content, source_content,
        content_jobs!inner ( project_id )
      )
    `)
    .eq('outputs.content_jobs.project_id', projectId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to list pending reviews: ${error.message}`)

  const rows = (data ?? []) as any[]

  // Fetch eval scores for the output ids
  const outputIds = rows.map((r: any) => r.output_id).filter(Boolean)
  const scoreMap: Record<string, number> = {}
  if (outputIds.length > 0) {
    const { data: scores } = await (supabaseAdmin.from('eval_scores') as any)
      .select('output_id, score')
      .in('output_id', outputIds)
    for (const s of scores ?? []) {
      scoreMap[s.output_id] = s.score
    }
  }

  return rows.map((r: any) => ({
    ...r,
    score: scoreMap[r.output_id] ?? null,
  }))
}

export async function getReviewByOutputId(outputId: string): Promise<Review | null> {
  const { data, error } = await (supabaseAdmin.from('reviews') as any)
    .select('*')
    .eq('output_id', outputId)
    .single()

  if (error) return null
  return data as Review
}
