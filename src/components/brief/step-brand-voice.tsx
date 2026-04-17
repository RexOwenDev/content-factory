'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { useState } from 'react'
import type { BrandVoiceProfile } from '@/lib/types'

const TONE_PRESETS = [
  'Authoritative but approachable',
  'Technical and precise',
  'Warm and conversational',
  'Bold and energetic',
  'Understated and confident',
]

interface Props {
  value: BrandVoiceProfile
  onChange: (v: BrandVoiceProfile) => void
  onNext: () => void
  onBack: () => void
}

export function StepBrandVoice({ value, onChange, onNext, onBack }: Props) {
  const [keywordInput, setKeywordInput] = useState('')
  const [avoidInput, setAvoidInput] = useState('')

  function update(partial: Partial<BrandVoiceProfile>) {
    onChange({ ...value, ...partial })
  }

  function addKeyword(word: string) {
    const trimmed = word.trim()
    if (trimmed && !value.keywords.includes(trimmed)) {
      update({ keywords: [...value.keywords, trimmed] })
    }
    setKeywordInput('')
  }

  function addAvoidWord(word: string) {
    const trimmed = word.trim()
    if (trimmed && !value.avoid_words.includes(trimmed)) {
      update({ avoid_words: [...value.avoid_words, trimmed] })
    }
    setAvoidInput('')
  }

  const canProceed = value.tone.trim() && value.style.trim()

  return (
    <div className="space-y-5">
      {/* Tone */}
      <div className="space-y-2">
        <Label style={{ color: 'var(--color-text)' }}>Brand tone</Label>
        <div className="flex flex-wrap gap-2">
          {TONE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => update({ tone: preset })}
              className="rounded-md border px-3 py-1 text-xs transition-all"
              style={{
                borderColor: value.tone === preset ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: value.tone === preset ? 'var(--color-primary-muted)' : 'transparent',
                color: value.tone === preset ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              {preset}
            </button>
          ))}
        </div>
        <Input
          placeholder="Or describe your own tone..."
          value={value.tone}
          onChange={(e) => update({ tone: e.target.value })}
        />
      </div>

      {/* Style */}
      <div className="space-y-1.5">
        <Label style={{ color: 'var(--color-text)' }}>Writing style</Label>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Guides sentence structure and vocabulary level
        </p>
        <Textarea
          placeholder="e.g. Short sentences, technical depth, factual claims only — no superlatives"
          rows={2}
          value={value.style}
          onChange={(e) => update({ style: e.target.value })}
        />
      </div>

      {/* Must-include keywords */}
      <div className="space-y-1.5">
        <Label style={{ color: 'var(--color-text)' }}>Must-include keywords</Label>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Brand terms that must appear in every output. Used by the eval harness.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Add keyword..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword(keywordInput))}
          />
          <Button variant="outline" size="sm" onClick={() => addKeyword(keywordInput)}>
            Add
          </Button>
        </div>
        {value.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {value.keywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="gap-1">
                {kw}
                <button onClick={() => update({ keywords: value.keywords.filter((k) => k !== kw) })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Avoid words */}
      <div className="space-y-1.5">
        <Label style={{ color: 'var(--color-text)' }}>Words to avoid</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add word..."
            value={avoidInput}
            onChange={(e) => setAvoidInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAvoidWord(avoidInput))}
          />
          <Button variant="outline" size="sm" onClick={() => addAvoidWord(avoidInput)}>
            Add
          </Button>
        </div>
        {value.avoid_words.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {value.avoid_words.map((w) => (
              <Badge
                key={w}
                variant="destructive"
                className="gap-1"
              >
                {w}
                <button
                  onClick={() => update({ avoid_words: value.avoid_words.filter((x) => x !== w) })}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Sample copy */}
      <div className="space-y-1.5">
        <Label style={{ color: 'var(--color-text)' }}>Sample on-brand copy</Label>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Paste an example — the LLM-as-judge eval uses this as the calibration reference
        </p>
        <Textarea
          placeholder="Paste a paragraph of approved brand copy..."
          rows={3}
          value={value.sample_copy}
          onChange={(e) => update({ sample_copy: e.target.value })}
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next: Markets →
        </Button>
      </div>
    </div>
  )
}
