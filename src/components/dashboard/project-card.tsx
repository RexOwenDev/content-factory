import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { LOCALE_FLAGS, CONTENT_TYPE_LABELS } from '@/lib/config'
import type { Project } from '@/lib/types'

const STATUS_STYLES: Record<
  Project['status'],
  { label: string; color: string; bg: string }
> = {
  draft: { label: 'Draft', color: '#8b949e', bg: 'rgba(139, 148, 158, 0.1)' },
  running: { label: 'Running', color: '#58a6ff', bg: 'rgba(88, 166, 255, 0.1)' },
  review: { label: 'In Review', color: '#d29922', bg: 'rgba(210, 153, 34, 0.1)' },
  complete: { label: 'Complete', color: '#3fb950', bg: 'rgba(63, 185, 80, 0.1)' },
  failed: { label: 'Failed', color: '#f85149', bg: 'rgba(248, 81, 73, 0.1)' },
}

interface Props {
  project: Project
}

export function ProjectCard({ project }: Props) {
  const statusStyle = STATUS_STYLES[project.status]
  const localeFlags = project.target_locales.slice(0, 8).map((l) => LOCALE_FLAGS[l]).join(' ')
  const moreLocales = project.target_locales.length - 8

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border p-5 transition-colors hover:border-opacity-70"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h3
            className="truncate font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            {project.name}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {project.brief.product_name} · {project.brief.category}
          </p>
        </div>
        <span
          className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
        >
          {statusStyle.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.content_types.slice(0, 3).map((type) => (
          <Badge key={type} variant="outline" className="text-xs" style={{ fontSize: '11px' }}>
            {CONTENT_TYPE_LABELS[type]}
          </Badge>
        ))}
        {project.content_types.length > 3 && (
          <Badge variant="outline" className="text-xs" style={{ fontSize: '11px' }}>
            +{project.content_types.length - 3} more
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span>
          {localeFlags}
          {moreLocales > 0 && ` +${moreLocales}`}
        </span>
        <span>{new Date(project.created_at).toLocaleDateString()}</span>
      </div>
    </Link>
  )
}
