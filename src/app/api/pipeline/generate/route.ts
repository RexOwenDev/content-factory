import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { inngest } from '@/lib/inngest/client'
import { getProjectWithMarkets } from '@/lib/db/queries/projects'

const bodySchema = z.object({
  projectId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
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

  const { projectId } = parsed.data
  const adapterMode = process.env['ADAPTER_MODE'] === 'live' ? 'live' : 'fixture'

  // Verify project exists before firing event
  const result = await getProjectWithMarkets(projectId).catch(() => null)
  if (!result) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  await inngest.send({
    name: 'contentfactory/project.submitted',
    data: { projectId, adapterMode },
  })

  return NextResponse.json(
    { ok: true, projectId, adapterMode, marketCount: result.markets.length },
    { status: 202 }
  )
}
