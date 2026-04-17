import type { Metadata } from 'next'
import { BarChart3 } from 'lucide-react'
import { listProjects } from '@/lib/db/queries/projects'
import { supabaseAdmin } from '@/lib/db/client'
import { EVAL_THRESHOLDS, CONTENT_TYPE_LABELS, LOCALE_FLAGS, LOCALE_LABELS } from '@/lib/config'
import { EvalAnalytics } from '@/components/eval/eval-analytics'
import type { ContentType, Locale } from '@/lib/types'

export const metadata: Metadata = { title: 'Analytics — ContentFactory' }

export default async function AnalyticsPage() {
  const projects = await listProjects().catch(() => [])

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Analytics
          </h1>
        </div>
        <div
          className="rounded-xl border border-dashed p-12 text-center"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No projects yet. Create a project and run the pipeline to see analytics.
          </p>
        </div>
      </div>
    )
  }

  // Fetch all eval scores across all projects
  const { data: allScores } = await (supabaseAdmin.from('eval_scores') as any)
    .select(`
      *,
      outputs:output_id (locale, content_type)
    `)

  const evalRows = (allScores ?? []) as Array<{
    score: number
    tone_match: number
    brand_voice_adherence: number
    cultural_accuracy: number
    hallucination_flag: boolean
    outputs: { locale: Locale; content_type: ContentType } | null
  }>

  const avg = (arr: number[]) =>
    arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)

  const summary =
    evalRows.length > 0
      ? {
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
      : null

  const localeMap = new Map<Locale, number[]>()
  const ctMap = new Map<ContentType, number[]>()
  for (const row of evalRows) {
    if (!row.outputs) continue
    const loc = localeMap.get(row.outputs.locale) ?? []
    loc.push(row.score)
    localeMap.set(row.outputs.locale, loc)
    const ct = ctMap.get(row.outputs.content_type) ?? []
    ct.push(row.score)
    ctMap.set(row.outputs.content_type, ct)
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
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Analytics
        </h1>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Project summary table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Project', 'Status', 'Locales', 'Content types', 'Translation'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                  {p.name}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="capitalize text-xs rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor:
                        p.status === 'complete'
                          ? 'rgba(63, 185, 80, 0.1)'
                          : p.status === 'running'
                          ? 'rgba(99, 102, 241, 0.1)'
                          : 'rgba(139, 148, 158, 0.1)',
                      color:
                        p.status === 'complete'
                          ? 'var(--color-accent-green)'
                          : p.status === 'running'
                          ? 'var(--color-primary)'
                          : 'var(--color-text-muted)',
                    }}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                  <div className="flex gap-0.5 flex-wrap">
                    {p.target_locales.slice(0, 6).map((l) => (
                      <span key={l} title={LOCALE_LABELS[l]}>
                        {LOCALE_FLAGS[l]}
                      </span>
                    ))}
                    {p.target_locales.length > 6 && (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        +{p.target_locales.length - 6}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {p.content_types.map((ct) => CONTENT_TYPE_LABELS[ct]).join(', ')}
                </td>
                <td
                  className="px-4 py-3 text-xs capitalize"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {p.translation_mode === 'both'
                    ? 'DeepL + Claude'
                    : p.translation_mode === 'deepl'
                    ? 'DeepL'
                    : 'Claude'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Global eval analytics */}
      {summary ? (
        <>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Brand Voice Quality — All Projects
          </h2>
          <EvalAnalytics
            summary={summary}
            byLocale={byLocale}
            byContentType={byContentType}
          />
        </>
      ) : (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No eval scores yet. Run a pipeline to generate quality metrics.
        </p>
      )}
    </div>
  )
}
