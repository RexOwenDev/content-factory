'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { LOCALE_FLAGS, LOCALE_LABELS, CONTENT_TYPE_LABELS } from '@/lib/config'
import { Badge } from '@/components/ui/badge'
import type { Output } from '@/lib/types'

interface EvalScoreRow {
  output_id: string
  score: number
  tone_match: number
  brand_voice_adherence: number
  cultural_accuracy: number
  hallucination_flag: boolean
  reasoning: string
}

interface OutputViewerProps {
  outputs: Output[]
  evalScores: EvalScoreRow[]
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'var(--color-accent-green)'
      : score >= 60
      ? '#f59e0b'
      : 'var(--color-accent-red, #f85149)'
  return (
    <span
      className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {score}
    </span>
  )
}

function OutputCard({
  output,
  evalScore,
}: {
  output: Output
  evalScore: EvalScoreRow | undefined
}) {
  const [expanded, setExpanded] = useState(false)
  const flag = LOCALE_FLAGS[output.locale as keyof typeof LOCALE_FLAGS] ?? '🌐'
  const label = LOCALE_LABELS[output.locale as keyof typeof LOCALE_LABELS] ?? output.locale
  const typeLabel = CONTENT_TYPE_LABELS[output.content_type]

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
        )}
        <span className="text-base">{flag}</span>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          {label}
        </span>
        <span className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {output.locale}
        </span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {typeLabel}
        </Badge>
        {evalScore && <ScorePill score={evalScore.score} />}
        {evalScore?.hallucination_flag && (
          <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          className="px-4 pb-4 space-y-4 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {/* Eval scores */}
          {evalScore && (
            <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Composite', value: evalScore.score },
                { label: 'Tone match', value: evalScore.tone_match },
                { label: 'Brand voice', value: evalScore.brand_voice_adherence },
                { label: 'Cultural', value: evalScore.cultural_accuracy },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div
                    className="text-xs mb-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {label}
                  </div>
                  <ScorePill score={value} />
                </div>
              ))}
            </div>
          )}

          {evalScore?.reasoning && (
            <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
              {evalScore.reasoning}
            </p>
          )}

          {/* Content layers */}
          <div className="space-y-3">
            {output.source_content && (
              <ContentLayer label="EN-US Source" content={output.source_content} />
            )}
            {output.deepl_translation && (
              <ContentLayer label="DeepL Translation" content={output.deepl_translation} badge="DeepL" />
            )}
            {output.transcreated_content && (
              <ContentLayer label="Claude Transcreation" content={output.transcreated_content} badge="Claude" />
            )}
            {!output.deepl_translation && !output.transcreated_content && output.final_content && (
              <ContentLayer label="Final Content" content={output.final_content} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ContentLayer({
  label,
  content,
  badge,
}: {
  label: string
  content: string
  badge?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-3 w-3" style={{ color: 'var(--color-accent-green)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </span>
        {badge && (
          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
            {badge}
          </Badge>
        )}
      </div>
      <pre
        className="text-xs whitespace-pre-wrap rounded-md p-3 font-sans leading-relaxed"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
        }}
      >
        {content}
      </pre>
    </div>
  )
}

export function OutputViewer({ outputs, evalScores }: OutputViewerProps) {
  const scoreMap = Object.fromEntries(evalScores.map((s) => [s.output_id, s]))

  if (outputs.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
        No outputs generated yet. Run the pipeline to generate content.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {outputs.map((output) => (
        <OutputCard key={output.id} output={output} evalScore={scoreMap[output.id]} />
      ))}
    </div>
  )
}
