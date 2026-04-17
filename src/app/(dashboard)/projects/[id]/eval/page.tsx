import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProject } from '@/lib/db/queries/projects'
import { listOutputsByProject } from '@/lib/db/queries/outputs'
import { supabaseAdmin } from '@/lib/db/client'
import { EvalAnalytics } from '@/components/eval/eval-analytics'
import { ProjectTabs } from '@/components/dashboard/project-tabs'
import { EVAL_THRESHOLDS } from '@/lib/config'
import type { ContentType, Locale } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const project = await getProject(id).catch(() => null)
  return { title: project ? `${project.name} — Eval` : 'Eval' }
}

export default async function ProjectEvalPage({ params }: Props) {
  const { id } = await params
  const project = await getProject(id).catch(() => null)
  if (!project) notFound()

  const outputs = await listOutputsByProject(id).catch(() => [])
  const outputIds = outputs.map((o) => o.id)
  const evalRows =
    outputIds.length > 0
      ? await (supabaseAdmin.from('eval_scores') as any)
          .select('*')
          .in('output_id', outputIds)
          .then((r: { data: unknown[] | null }) => (r.data ?? []) as any[])
      : []

  const avg = (arr: number[]) =>
    arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)

  const summary =
    evalRows.length > 0
      ? {
          total: evalRows.length,
          avg_score: avg(evalRows.map((r: any) => r.score)),
          avg_tone_match: avg(evalRows.map((r: any) => r.tone_match)),
          avg_brand_voice: avg(evalRows.map((r: any) => r.brand_voice_adherence)),
          avg_cultural: avg(evalRows.map((r: any) => r.cultural_accuracy)),
          pass_count: evalRows.filter((r: any) => r.score >= EVAL_THRESHOLDS.PASS).length,
          warn_count: evalRows.filter(
            (r: any) => r.score >= EVAL_THRESHOLDS.WARN && r.score < EVAL_THRESHOLDS.PASS
          ).length,
          fail_count: evalRows.filter((r: any) => r.score < EVAL_THRESHOLDS.WARN).length,
          hallucination_count: evalRows.filter((r: any) => r.hallucination_flag).length,
        }
      : null

  const outputMeta = Object.fromEntries(
    outputs.map((o) => [o.id, { locale: o.locale, contentType: o.content_type }])
  )

  const localeMap = new Map<Locale, number[]>()
  const ctMap = new Map<ContentType, number[]>()
  for (const row of evalRows) {
    const meta = outputMeta[(row as any).output_id]
    if (!meta) continue
    const loc = localeMap.get(meta.locale) ?? []
    loc.push((row as any).score)
    localeMap.set(meta.locale, loc)
    const ct = ctMap.get(meta.contentType) ?? []
    ct.push((row as any).score)
    ctMap.set(meta.contentType, ct)
  }

  const byLocale = Array.from(localeMap.entries()).map(([locale, scores]) => ({
    locale,
    avg_score: avg(scores),
    count: scores.length,
  }))
  const byContentType = Array.from(ctMap.entries()).map(([contentType, scores]) => ({
    contentType,
    avg_score: avg(scores),
    count: scores.length,
  }))

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/" className="hover:underline" style={{ color: 'var(--color-text-muted)' }}>
          Projects
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text)' }}>{project.name}</span>
      </div>

      {/* Project tabs */}
      <ProjectTabs projectId={id} />

      <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
        Brand Voice Eval
      </h1>

      {summary ? (
        <EvalAnalytics
          summary={summary}
          byLocale={byLocale}
          byContentType={byContentType}
        />
      ) : (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
          No eval scores yet. Run the pipeline to generate evaluated content.
        </p>
      )}
    </div>
  )
}
