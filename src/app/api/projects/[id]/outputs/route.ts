import { NextRequest, NextResponse } from 'next/server'
import { listOutputsByProject } from '@/lib/db/queries/outputs'
import { listJobsByProject } from '@/lib/db/queries/jobs'
import { supabaseAdmin } from '@/lib/db/client'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params

  const [jobs, outputs] = await Promise.all([
    listJobsByProject(id).catch(() => []),
    listOutputsByProject(id).catch(() => []),
  ])

  // Fetch eval scores for all outputs
  const outputIds = outputs.map((o) => o.id)
  const evalScores =
    outputIds.length > 0
      ? await (supabaseAdmin.from('eval_scores') as any)
          .select('*')
          .in('output_id', outputIds)
          .then((r: { data: unknown[] | null }) => r.data ?? [])
      : []

  return NextResponse.json({ jobs, outputs, evalScores })
}
