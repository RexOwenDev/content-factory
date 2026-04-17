import { NextRequest, NextResponse } from 'next/server'
import { listOutputsByProject } from '@/lib/db/queries/outputs'
import { supabaseAdmin } from '@/lib/db/client'
import { EVAL_THRESHOLDS } from '@/lib/config'
import type { ContentType, Locale } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params

  const outputs = await listOutputsByProject(id).catch(() => [])
  if (outputs.length === 0) {
    return NextResponse.json({ summary: null, byLocale: [], byContentType: [] })
  }

  const outputIds = outputs.map((o) => o.id)
  const { data: scores } = await (supabaseAdmin.from('eval_scores') as any)
    .select('*')
    .in('output_id', outputIds)

  const evalRows = (scores ?? []) as Array<{
    output_id: string
    score: number
    tone_match: number
    brand_voice_adherence: number
    cultural_accuracy: number
    hallucination_flag: boolean
  }>

  if (evalRows.length === 0) {
    return NextResponse.json({ summary: null, byLocale: [], byContentType: [] })
  }

  // Build lookup: output_id → locale + content_type
  const outputMeta = Object.fromEntries(
    outputs.map((o) => [o.id, { locale: o.locale, contentType: o.content_type }])
  )

  // Aggregate summary
  const avg = (arr: number[]) =>
    arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)

  const summary = {
    total: evalRows.length,
    avg_score: avg(evalRows.map((r) => r.score)),
    avg_tone_match: avg(evalRows.map((r) => r.tone_match)),
    avg_brand_voice: avg(evalRows.map((r) => r.brand_voice_adherence)),
    avg_cultural: avg(evalRows.map((r) => r.cultural_accuracy)),
    pass_count: evalRows.filter((r) => r.score >= EVAL_THRESHOLDS.PASS).length,
    warn_count: evalRows.filter(
      (r) => r.score >= EVAL_THRESHOLDS.WARN && r.score < EVAL_THRESHOLDS.PASS
    ).length,
    fail_count: evalRows.filter((r) => r.score < EVAL_THRESHOLDS.WARN).length,
    hallucination_count: evalRows.filter((r) => r.hallucination_flag).length,
  }

  // By locale
  const localeMap = new Map<Locale, number[]>()
  for (const row of evalRows) {
    const meta = outputMeta[row.output_id]
    if (!meta) continue
    const existing = localeMap.get(meta.locale) ?? []
    existing.push(row.score)
    localeMap.set(meta.locale, existing)
  }
  const byLocale = Array.from(localeMap.entries()).map(([locale, scores]) => ({
    locale,
    avg_score: avg(scores),
    count: scores.length,
  }))

  // By content type
  const ctMap = new Map<ContentType, number[]>()
  for (const row of evalRows) {
    const meta = outputMeta[row.output_id]
    if (!meta) continue
    const existing = ctMap.get(meta.contentType) ?? []
    existing.push(row.score)
    ctMap.set(meta.contentType, existing)
  }
  const byContentType = Array.from(ctMap.entries()).map(([contentType, scores]) => ({
    contentType,
    avg_score: avg(scores),
    count: scores.length,
  }))

  return NextResponse.json({ summary, byLocale, byContentType })
}
