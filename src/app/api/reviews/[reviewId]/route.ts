import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { approveReview, rejectReview } from '@/lib/db/queries/reviews'
import { updateJobStatus } from '@/lib/db/queries/jobs'
import { supabaseAdmin } from '@/lib/db/client'

const bodySchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewerNote: z.string().optional(),
})

interface Props {
  params: Promise<{ reviewId: string }>
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { reviewId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { action, reviewerNote } = parsed.data

  if (action === 'approve') {

    const review = await approveReview(reviewId, reviewerNote).catch((e: Error) =>
      NextResponse.json({ error: e.message }, { status: 500 })
    )
    if (review instanceof NextResponse) return review

    // Update job status → approved
    const { data: reviewRow } = await (supabaseAdmin.from('reviews') as any)
      .select('output_id')
      .eq('id', reviewId)
      .single()

    if (reviewRow?.output_id) {
      const { data: output } = await (supabaseAdmin.from('outputs') as any)
        .select('job_id')
        .eq('id', reviewRow.output_id)
        .single()
      if (output?.job_id) {
        await updateJobStatus(output.job_id, 'approved').catch((e: Error) => {
          console.error('[review PATCH] job status sync failed:', e.message)
        })
      }
    }

    return NextResponse.json({ ok: true, review })
  } else {
    if (!reviewerNote) {
      return NextResponse.json({ error: 'reviewerNote required for rejection' }, { status: 422 })
    }

    const review = await rejectReview(reviewId, reviewerNote).catch((e: Error) =>
      NextResponse.json({ error: e.message }, { status: 500 })
    )
    if (review instanceof NextResponse) return review

    // Update job status → rejected
    const { data: reviewRow } = await (supabaseAdmin.from('reviews') as any)
      .select('output_id')
      .eq('id', reviewId)
      .single()

    if (reviewRow?.output_id) {
      const { data: output } = await (supabaseAdmin.from('outputs') as any)
        .select('job_id')
        .eq('id', reviewRow.output_id)
        .single()
      if (output?.job_id) {
        await updateJobStatus(output.job_id, 'rejected').catch((e: Error) => {
          console.error('[review PATCH] job status sync failed:', e.message)
        })
      }
    }

    return NextResponse.json({ ok: true, review })
  }
}
