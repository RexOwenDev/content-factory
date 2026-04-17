import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ClipboardCheck } from 'lucide-react'
import { getProject } from '@/lib/db/queries/projects'
import { listPendingReviews } from '@/lib/db/queries/reviews'
import { ReviewCard } from '@/components/review/review-card'
import { ProjectTabs } from '@/components/dashboard/project-tabs'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const project = await getProject(id).catch(() => null)
  return { title: project ? `${project.name} — Review` : 'Review' }
}

export default async function ProjectReviewPage({ params }: Props) {
  const { id } = await params
  const [project, reviews] = await Promise.all([
    getProject(id).catch(() => null),
    listPendingReviews(id).catch(() => []),
  ])
  if (!project) notFound()

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

      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Review Queue
        </h1>
        {reviews.length > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: 'var(--color-primary)' }}
          >
            {reviews.length} pending
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <div
          className="rounded-xl border border-dashed p-10 text-center"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <ClipboardCheck
            className="mx-auto mb-3 h-8 w-8"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            No pending reviews
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Content waiting for review will appear here after pipeline runs.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(reviews as any[]).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}
