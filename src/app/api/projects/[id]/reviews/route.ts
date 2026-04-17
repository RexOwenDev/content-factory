import { NextRequest, NextResponse } from 'next/server'
import { listPendingReviews } from '@/lib/db/queries/reviews'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params
  const reviews = await listPendingReviews(id).catch(() => [])
  return NextResponse.json({ reviews })
}
