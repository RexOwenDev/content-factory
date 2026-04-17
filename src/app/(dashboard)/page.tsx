import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Zap, Globe2, CheckSquare, BarChart3 } from 'lucide-react'
import { listProjects } from '@/lib/db/queries/projects'
import { ProjectCard } from '@/components/dashboard/project-card'
import { supabaseAdmin } from '@/lib/db/client'

export const metadata: Metadata = { title: 'Projects — ContentFactory' }

export default async function DashboardPage() {
  const projects = await listProjects().catch(() => [])

  // Global stats
  const totalLocales = new Set(projects.flatMap((p) => p.target_locales)).size
  const [{ count: totalJobs }, { count: completedJobs }] = await Promise.all([
    (supabaseAdmin.from('content_jobs') as any)
      .select('*', { count: 'exact', head: true })
      .then((r: any) => ({ count: r.count ?? 0 })),
    (supabaseAdmin.from('content_jobs') as any)
      .select('*', { count: 'exact', head: true })
      .in('status', ['review_pending', 'approved', 'exported'])
      .then((r: any) => ({ count: r.count ?? 0 })),
  ])

  const stats = [
    { label: 'Projects', value: projects.length, icon: <Zap className="h-4 w-4" /> },
    { label: 'Locales covered', value: totalLocales, icon: <Globe2 className="h-4 w-4" /> },
    { label: 'Content jobs', value: totalJobs, icon: <BarChart3 className="h-4 w-4" /> },
    { label: 'Completed', value: completedJobs, icon: <CheckSquare className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Projects
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Multi-market AI content production pipeline
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus className="h-4 w-4" />
          New Brief
        </Link>
      </div>

      {/* Stats row */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon }) => (
            <div
              key={label}
              className="rounded-xl border p-4 space-y-2"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                {icon}
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </span>
              </div>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text)' }}>
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div
          className="rounded-xl border py-16 text-center"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <Zap className="mx-auto mb-3 h-8 w-8" style={{ color: 'var(--color-primary)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            No projects yet
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <Link
              href="/projects/new"
              className="underline underline-offset-2"
              style={{ color: 'var(--color-primary)' }}
            >
              Create your first brief
            </Link>{' '}
            to start generating multi-market content.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
