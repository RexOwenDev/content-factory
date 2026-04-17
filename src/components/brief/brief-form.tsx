'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepProductBrief } from './step-product-brief'
import { StepBrandVoice } from './step-brand-voice'
import { StepMarketSelection } from './step-market-selection'
import { StepContentConfig } from './step-content-config'
import { Progress } from '@/components/ui/progress'
import type { ProductBrief, BrandVoiceProfile, Locale, ContentType, TranslationMode } from '@/lib/types'

export interface BriefFormState {
  name: string
  brief: ProductBrief
  brand_voice: BrandVoiceProfile
  target_locales: Locale[]
  content_types: ContentType[]
  translation_mode: TranslationMode
}

const INITIAL_STATE: BriefFormState = {
  name: '',
  brief: {
    product_name: '',
    category: '',
    key_features: [''],
    target_audience: '',
    price_point: '',
    usp: '',
    avoid_words: [],
    extra_context: '',
  },
  brand_voice: {
    tone: '',
    style: '',
    keywords: [],
    avoid_words: [],
    sample_copy: '',
  },
  target_locales: ['en-US'],
  content_types: ['product_description', 'ad_copy', 'meta_tags'],
  translation_mode: 'both',
}

const STEPS = [
  { label: 'Product Brief', description: 'What are you selling?' },
  { label: 'Brand Voice', description: 'How should it sound?' },
  { label: 'Markets', description: 'Where are you selling?' },
  { label: 'Content Config', description: 'What do you need?' },
]

export function BriefForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<BriefFormState>(INITIAL_STATE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = ((step + 1) / STEPS.length) * 100

  function updateForm(partial: Partial<BriefFormState>) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to create project')
      }
      const data = await res.json() as { project: { id: string } }
      router.push(`/projects/${data.project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  const currentStep = STEPS[step]

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Step header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{currentStep?.label}</span>
        </div>
        <Progress value={progress} className="h-1" />
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            {currentStep?.label}
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {currentStep?.description}
          </p>
        </div>
      </div>

      {/* Step content */}
      <div
        className="rounded-xl border p-6"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {step === 0 && (
          <StepProductBrief
            value={{ name: form.name, brief: form.brief }}
            onChange={({ name, brief }) => updateForm({ name, brief })}
            onNext={next}
          />
        )}
        {step === 1 && (
          <StepBrandVoice
            value={form.brand_voice}
            onChange={(brand_voice) => updateForm({ brand_voice })}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 2 && (
          <StepMarketSelection
            value={form.target_locales}
            onChange={(target_locales) => updateForm({ target_locales })}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <StepContentConfig
            value={{ content_types: form.content_types, translation_mode: form.translation_mode }}
            onChange={({ content_types, translation_mode }) =>
              updateForm({ content_types, translation_mode })
            }
            onBack={back}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--color-accent-red)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
