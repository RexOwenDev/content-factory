'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '@/lib/config'
import type { ContentType, TranslationMode } from '@/lib/types'

const CONTENT_TYPE_DESCRIPTIONS: Record<ContentType, string> = {
  product_description: 'Full product description (150–300 words). Technical + emotional hooks.',
  ad_copy: 'Short-form ad headline + body (30–80 words). Conversion-focused.',
  meta_tags: 'SEO title, meta description, focus keyword. Platform-ready fields.',
  landing_page_copy: 'Hero headline, subheadline, 3-benefit section, CTA (200–400 words).',
}

const TRANSLATION_MODE_OPTIONS: Array<{
  value: TranslationMode
  label: string
  description: string
}> = [
  {
    value: 'deepl',
    label: 'DeepL only',
    description: 'Fast literal translation. Best for factual/technical content.',
  },
  {
    value: 'claude_transcreation',
    label: 'Claude transcreation',
    description: 'Cultural adaptation with idiomatic language. Best for marketing copy.',
  },
  {
    value: 'both',
    label: 'Both (recommended)',
    description:
      'DeepL translates, Claude refines for cultural nuance. Highest quality. Reviewers see both versions.',
  },
]

interface Props {
  value: { content_types: ContentType[]; translation_mode: TranslationMode }
  onChange: (v: { content_types: ContentType[]; translation_mode: TranslationMode }) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function StepContentConfig({ value, onChange, onBack, onSubmit, isSubmitting }: Props) {
  function toggleContentType(type: ContentType) {
    const current = value.content_types
    onChange({
      ...value,
      content_types: current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    })
  }

  const canProceed = value.content_types.length > 0

  // Total jobs = content_types × markets (shown in summary in Phase 7)
  return (
    <div className="space-y-6">
      {/* Content types */}
      <div className="space-y-2">
        <Label style={{ color: 'var(--color-text)' }}>Content types to generate</Label>
        <div className="space-y-2">
          {CONTENT_TYPES.map((type) => {
            const isSelected = value.content_types.includes(type)
            return (
              <label
                key={type}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
                style={{
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-primary-muted)' : 'transparent',
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleContentType(type)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {CONTENT_TYPE_LABELS[type]}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {CONTENT_TYPE_DESCRIPTIONS[type]}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Translation mode */}
      <div className="space-y-2">
        <Label style={{ color: 'var(--color-text)' }}>Translation approach</Label>
        <div className="space-y-2">
          {TRANSLATION_MODE_OPTIONS.map(({ value: mode, label, description }) => {
            const isSelected = value.translation_mode === mode
            return (
              <label
                key={mode}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
                style={{
                  borderColor: isSelected ? 'var(--color-secondary)' : 'var(--color-border)',
                  backgroundColor: isSelected
                    ? 'rgba(139, 92, 246, 0.08)'
                    : 'transparent',
                }}
              >
                <div
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: isSelected ? 'var(--color-secondary)' : 'var(--color-border)',
                  }}
                  onClick={() => onChange({ ...value, translation_mode: mode })}
                >
                  {isSelected && (
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: 'var(--color-secondary)' }}
                    />
                  )}
                </div>
                <div
                  className="space-y-0.5"
                  onClick={() => onChange({ ...value, translation_mode: mode })}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {label}
                    {mode === 'both' && (
                      <span
                        className="ml-2 rounded px-1.5 py-0.5 text-xs"
                        style={{
                          backgroundColor: 'rgba(139, 92, 246, 0.15)',
                          color: 'var(--color-secondary)',
                        }}
                      >
                        recommended
                      </span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {description}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          ← Back
        </Button>
        <Button onClick={onSubmit} disabled={!canProceed || isSubmitting}>
          {isSubmitting ? 'Creating project...' : 'Create project →'}
        </Button>
      </div>
    </div>
  )
}
