'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LOCALE_FLAGS, LOCALE_LABELS, CONTENT_TYPE_LABELS } from '@/lib/config'
import { useRouter } from 'next/navigation'
import type { Review } from '@/lib/types'

interface ReviewItem {
  id: string
  output_id: string
  status: Review['status']
  created_at: string
  output: {
    id: string
    locale: string
    content_type: string
    final_content: string | null
    source_content: string
  }
  score: number | null
}

interface ReviewCardProps {
  review: ReviewItem
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

function slaColor(isoDate: string): string {
  const hours = (Date.now() - new Date(isoDate).getTime()) / 3600000
  if (hours > 48) return 'var(--color-accent-red, #f85149)'
  if (hours > 24) return '#f59e0b'
  return 'var(--color-accent-green)'
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [note, setNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const flag = LOCALE_FLAGS[review.output.locale as keyof typeof LOCALE_FLAGS] ?? '🌐'
  const label = LOCALE_LABELS[review.output.locale as keyof typeof LOCALE_LABELS] ?? review.output.locale
  const typeLabel = CONTENT_TYPE_LABELS[review.output.content_type as keyof typeof CONTENT_TYPE_LABELS]

  async function handleAction(action: 'approve' | 'reject') {
    if (action === 'reject' && !note.trim()) {
      setShowNoteInput(true)
      return
    }
    setLoading(action)
    try {
      await fetch(`/api/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewerNote: note || undefined }),
      })
      setDone(true)
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  if (done) return null

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flag}</span>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {label}{' '}
              <span style={{ color: 'var(--color-text-muted)' }}>·</span>{' '}
              {typeLabel}
            </p>
            <p className="font-mono text-xs" style={{ color: 'var(--color-text-subtle)' }}>
              {review.output.locale}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {review.score !== null && (
            <span
              className="font-mono text-sm font-semibold"
              style={{
                color:
                  review.score >= 80
                    ? 'var(--color-accent-green)'
                    : review.score >= 60
                    ? '#f59e0b'
                    : 'var(--color-accent-red, #f85149)',
              }}
            >
              {review.score}/100
            </span>
          )}
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: slaColor(review.created_at) }}
          >
            <Clock className="h-3 w-3" />
            {timeAgo(review.created_at)}
          </span>
        </div>
      </div>

      {/* Content preview */}
      {review.output.final_content && (
        <pre
          className="text-xs whitespace-pre-wrap rounded-md p-3 font-sans leading-relaxed max-h-40 overflow-y-auto"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
        >
          {review.output.final_content}
        </pre>
      )}

      {/* Reject note input */}
      {showNoteInput && (
        <textarea
          className="w-full rounded-md p-2 text-sm resize-none focus:outline-none"
          rows={2}
          placeholder="Rejection reason (required)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
        />
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => handleAction('approve')}
          disabled={loading !== null}
          style={{ color: 'var(--color-accent-green)', borderColor: 'var(--color-accent-green)' }}
        >
          {loading === 'approve' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => handleAction('reject')}
          disabled={loading !== null}
          style={{
            color: 'var(--color-accent-red, #f85149)',
            borderColor: 'var(--color-accent-red, #f85149)',
          }}
        >
          {loading === 'reject' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          Reject
        </Button>
      </div>
    </div>
  )
}
