'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LOCALES, LOCALE_LABELS, LOCALE_FLAGS } from '@/lib/config'
import type { Locale } from '@/lib/types'

interface Props {
  value: Locale[]
  onChange: (v: Locale[]) => void
  onNext: () => void
  onBack: () => void
}

const REGIONS: Array<{ label: string; locales: Locale[] }> = [
  { label: 'English', locales: ['en-US', 'en-GB'] },
  { label: 'French', locales: ['fr-FR', 'fr-CA'] },
  { label: 'Spanish', locales: ['es-ES', 'es-MX'] },
  { label: 'DACH / Other Europe', locales: ['de-DE', 'it-IT', 'nl-NL', 'pl-PL'] },
  { label: 'Americas (PT)', locales: ['pt-BR'] },
  { label: 'Asia Pacific', locales: ['ja-JP'] },
]

export function StepMarketSelection({ value, onChange, onNext, onBack }: Props) {
  function toggle(locale: Locale) {
    if (value.includes(locale)) {
      onChange(value.filter((l) => l !== locale))
    } else {
      onChange([...value, locale])
    }
  }

  function selectAll() {
    onChange([...LOCALES])
  }

  function clearAll() {
    onChange(['en-US'])
  }

  const canProceed = value.length > 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Select the markets to generate content for
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            {value.length} / {LOCALES.length} selected
          </Badge>
          <button
            type="button"
            className="text-xs transition-colors hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
            onClick={selectAll}
          >
            Select all
          </button>
          <button
            type="button"
            className="text-xs transition-colors hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={clearAll}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {REGIONS.map(({ label, locales }) => (
          <div key={label} className="space-y-2">
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {label}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {locales.map((locale) => {
                const isSelected = value.includes(locale)
                return (
                  <label
                    key={locale}
                    className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors"
                    style={{
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-muted)' : 'transparent',
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(locale)}
                      id={locale}
                    />
                    <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                      {LOCALE_FLAGS[locale]} {LOCALE_LABELS[locale]}
                    </span>
                    <span
                      className="ml-auto font-mono text-xs"
                      style={{ color: 'var(--color-text-subtle)' }}
                    >
                      {locale}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* i18n note — visible to hiring managers */}
      <div
        className="rounded-md border p-3 text-xs"
        style={{
          borderColor: 'var(--color-border-subtle)',
          backgroundColor: 'var(--color-surface-raised)',
          color: 'var(--color-text-muted)',
        }}
      >
        <strong style={{ color: 'var(--color-text)' }}>Note on transcreation:</strong> Spanish (Spain)
        vs Spanish (Mexico), French (France) vs French (Canada), and Portuguese (Brazil) use{' '}
        <em>different</em> cultural contexts — not just locale codes. The pipeline applies locale-specific
        transcreation prompts to each, not just translation.
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next: Content Config →
        </Button>
      </div>
    </div>
  )
}
