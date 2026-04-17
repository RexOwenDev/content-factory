import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Globe, FileText, Layers } from 'lucide-react'
import { getProjectWithMarkets } from '@/lib/db/queries/projects'
import { listJobsByProject } from '@/lib/db/queries/jobs'
import { listOutputsByProject } from '@/lib/db/queries/outputs'
import { supabaseAdmin } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { LOCALE_FLAGS, LOCALE_LABELS, CONTENT_TYPE_LABELS } from '@/lib/config'
import { RunPipelineButton } from '@/components/pipeline/run-pipeline-button'
import { PipelineStatus } from '@/components/pipeline/pipeline-status'
import { OutputViewer } from '@/components/output/output-viewer'
import { ProjectTabs } from '@/components/dashboard/project-tabs'
import { ExportButton } from '@/components/output/export-button'
import type { ContentJob } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const result = await getProjectWithMarkets(id).catch(() => null)
  return { title: result?.project.name ?? 'Project' }
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const [result, jobs, outputs] = await Promise.all([
    getProjectWithMarkets(id).catch(() => null),
    listJobsByProject(id).catch(() => [] as ContentJob[]),
    listOutputsByProject(id).catch(() => []),
  ])
  if (!result) notFound()

  const { project, markets } = result
  const pipelineStarted = jobs.length > 0

  // Fetch eval scores for outputs
  const outputIds = outputs.map((o) => o.id)
  const evalScores =
    outputIds.length > 0
      ? await (supabaseAdmin.from('eval_scores') as any)
          .select('*')
          .in('output_id', outputIds)
          .then((r: { data: unknown[] | null }) => (r.data ?? []) as any[])
      : []

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
      <ProjectTabs projectId={project.id} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            {project.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {project.brief.product_name} · {project.brief.category}
          </p>
        </div>
        <Badge
          variant="outline"
          className="capitalize"
          style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
        >
          {project.status}
        </Badge>
      </div>

      {/* Brief summary */}
      <div
        className="grid gap-4 rounded-xl border p-5 sm:grid-cols-3"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <InfoBlock label="Product">
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            {project.brief.product_name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {project.brief.category}
          </p>
        </InfoBlock>
        <InfoBlock label="USP">
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            {project.brief.usp}
          </p>
        </InfoBlock>
        <InfoBlock label="Brand tone">
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            {project.brand_voice.tone}
          </p>
        </InfoBlock>
      </div>

      {/* Content types */}
      <Section icon={<FileText className="h-4 w-4" />} title="Content types">
        <div className="flex flex-wrap gap-2">
          {project.content_types.map((type) => (
            <Badge key={type} variant="secondary">
              {CONTENT_TYPE_LABELS[type]}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Translation mode:{' '}
          <span style={{ color: 'var(--color-text)' }}>
            {project.translation_mode === 'both'
              ? 'DeepL + Claude transcreation'
              : project.translation_mode === 'deepl'
              ? 'DeepL only'
              : 'Claude transcreation only'}
          </span>
        </p>
      </Section>

      {/* Markets */}
      <Section icon={<Globe className="h-4 w-4" />} title={`Markets (${markets.length})`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => (
            <div
              key={market.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface-raised)',
              }}
            >
              <span>{LOCALE_FLAGS[market.locale as keyof typeof LOCALE_FLAGS]}</span>
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--color-text)' }}>
                  {LOCALE_LABELS[market.locale as keyof typeof LOCALE_LABELS]}
                </p>
                <p className="font-mono text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                  {market.locale}
                </p>
              </div>
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-xs capitalize"
                style={{
                  backgroundColor:
                    market.status === 'complete'
                      ? 'rgba(63, 185, 80, 0.1)'
                      : 'rgba(139, 148, 158, 0.1)',
                  color:
                    market.status === 'complete'
                      ? 'var(--color-accent-green)'
                      : 'var(--color-text-muted)',
                }}
              >
                {market.status}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Outputs */}
      {outputs.length > 0 && (
        <Section
          icon={<Layers className="h-4 w-4" />}
          title={`Outputs (${outputs.length})`}
          action={<ExportButton projectId={project.id} />}
        >
          <OutputViewer outputs={outputs} evalScores={evalScores} />
        </Section>
      )}

      {/* Pipeline */}
      {pipelineStarted ? (
        <PipelineStatus jobs={jobs} />
      ) : (
        <div
          className="rounded-xl border border-dashed p-8 flex flex-col items-center gap-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Ready to generate content for {markets.length} markets
          </p>
          <p className="text-xs text-center max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
            Running the pipeline will generate {project.content_types.length} content types ×{' '}
            {markets.length} markets ={' '}
            <span style={{ color: 'var(--color-text)' }}>
              {project.content_types.length * markets.length} content jobs
            </span>
          </p>
          <RunPipelineButton
            projectId={project.id}
            disabled={project.status === 'running'}
          />
        </div>
      )}
    </div>
  )
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </div>
  )
}
