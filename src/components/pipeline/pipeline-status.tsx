import { CheckCircle2, Circle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { LOCALE_FLAGS, LOCALE_LABELS, CONTENT_TYPE_LABELS } from '@/lib/config'
import type { ContentJob, JobStatus } from '@/lib/types'

interface PipelineStatusProps {
  jobs: ContentJob[]
}

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: 'var(--color-text-muted)',
    icon: <Circle className="h-3.5 w-3.5" />,
  },
  generating: {
    label: 'Generating',
    color: 'var(--color-primary)',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  translating: {
    label: 'Translating',
    color: 'var(--color-primary)',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  transcreating: {
    label: 'Transcreating',
    color: '#8b5cf6',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  evaluating: {
    label: 'Evaluating',
    color: '#f59e0b',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  review_pending: {
    label: 'Review pending',
    color: '#f59e0b',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  approved: {
    label: 'Approved',
    color: 'var(--color-accent-green)',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: 'Rejected',
    color: 'var(--color-accent-red, #f85149)',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  failed: {
    label: 'Failed',
    color: 'var(--color-accent-red, #f85149)',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  exported: {
    label: 'Exported',
    color: 'var(--color-accent-green)',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
}

export function PipelineStatus({ jobs }: PipelineStatusProps) {
  if (jobs.length === 0) return null

  // Group by market_id to show per-locale progress
  const byMarket = jobs.reduce<Record<string, ContentJob[]>>((acc, job) => {
    const key = job.market_id
    if (!acc[key]) acc[key] = []
    acc[key]!.push(job)
    return acc
  }, {})

  const total = jobs.length
  const complete = jobs.filter((j) => j.status === 'review_pending' || j.status === 'approved' || j.status === 'exported').length
  const pct = Math.round((complete / total) * 100)

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {/* Overall progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Pipeline progress
        </span>
        <span className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {complete}/{total} jobs complete
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: 'var(--color-primary)' }}
        />
      </div>

      {/* Per-market job rows */}
      <div className="space-y-3 pt-1">
        {Object.entries(byMarket).map(([marketId, marketJobs]) => {
          // Derive locale from first job's locale field if available (joined via market)
          const locale = (marketJobs[0] as any)?.markets?.locale ?? marketId
          const flag = LOCALE_FLAGS[locale as keyof typeof LOCALE_FLAGS] ?? '🌐'
          const label = LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS] ?? locale

          return (
            <div key={marketId} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span>{flag}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                  {label}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                  {locale}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {marketJobs.map((job) => {
                  const config = STATUS_CONFIG[job.status]
                  return (
                    <div
                      key={job.id}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
                      style={{
                        backgroundColor: 'var(--color-surface-raised)',
                        border: '1px solid var(--color-border)',
                        color: config?.color ?? 'var(--color-text-muted)',
                      }}
                    >
                      {config?.icon}
                      <span>{CONTENT_TYPE_LABELS[job.content_type]}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>
                        {config?.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
