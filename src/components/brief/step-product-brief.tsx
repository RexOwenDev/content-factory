'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import type { ProductBrief } from '@/lib/types'

interface Props {
  value: { name: string; brief: ProductBrief }
  onChange: (v: { name: string; brief: ProductBrief }) => void
  onNext: () => void
}

export function StepProductBrief({ value, onChange, onNext }: Props) {
  const { name, brief } = value

  function update(partial: Partial<ProductBrief>) {
    onChange({ name, brief: { ...brief, ...partial } })
  }

  function updateFeature(index: number, text: string) {
    const features = [...brief.key_features]
    features[index] = text
    update({ key_features: features })
  }

  function addFeature() {
    update({ key_features: [...brief.key_features, ''] })
  }

  function removeFeature(index: number) {
    update({ key_features: brief.key_features.filter((_, i) => i !== index) })
  }

  const canProceed =
    name.trim() &&
    brief.product_name.trim() &&
    brief.category.trim() &&
    brief.usp.trim() &&
    brief.target_audience.trim() &&
    brief.key_features.some((f) => f.trim())

  return (
    <div className="space-y-5">
      {/* Project name */}
      <Field label="Project name" hint="Used for your dashboard — not customer-facing">
        <Input
          placeholder="e.g. ForgeTorque Pro — Q3 Launch"
          value={name}
          onChange={(e) => onChange({ name: e.target.value, brief })}
        />
      </Field>

      <div className="my-4 border-t" style={{ borderColor: 'var(--color-border)' }} />

      {/* Product name + category */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name">
          <Input
            placeholder="e.g. ForgeTorque Pro 3000"
            value={brief.product_name}
            onChange={(e) => update({ product_name: e.target.value })}
          />
        </Field>
        <Field label="Category">
          <Input
            placeholder="e.g. Industrial Tools"
            value={brief.category}
            onChange={(e) => update({ category: e.target.value })}
          />
        </Field>
      </div>

      {/* USP */}
      <Field label="Unique selling proposition" hint="One sentence that makes this product different">
        <Textarea
          placeholder="e.g. The only torque tool with real-time calibration feedback built in"
          rows={2}
          value={brief.usp}
          onChange={(e) => update({ usp: e.target.value })}
        />
      </Field>

      {/* Key features */}
      <Field label="Key features" hint="Up to 10 — these drive the content generation">
        <div className="space-y-2">
          {brief.key_features.map((feature, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder={`Feature ${i + 1}`}
                value={feature}
                onChange={(e) => updateFeature(i, e.target.value)}
              />
              {brief.key_features.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="flex-shrink-0 rounded p-1.5 transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {brief.key_features.length < 10 && (
            <button
              type="button"
              onClick={addFeature}
              className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-70"
              style={{ color: 'var(--color-primary)' }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add feature
            </button>
          )}
        </div>
      </Field>

      {/* Target audience + price */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target audience">
          <Input
            placeholder="e.g. Industrial maintenance engineers"
            value={brief.target_audience}
            onChange={(e) => update({ target_audience: e.target.value })}
          />
        </Field>
        <Field label="Price point">
          <Input
            placeholder="e.g. €2,400 (professional tier)"
            value={brief.price_point}
            onChange={(e) => update({ price_point: e.target.value })}
          />
        </Field>
      </div>

      {/* Extra context */}
      <Field label="Extra context" hint="Optional — certifications, awards, competitor differentiators">
        <Textarea
          placeholder="e.g. ISO 9001 certified. Used by aerospace manufacturing. 3-year warranty."
          rows={2}
          value={brief.extra_context ?? ''}
          onChange={(e) => update({ extra_context: e.target.value })}
        />
      </Field>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canProceed}>
          Next: Brand Voice →
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label style={{ color: 'var(--color-text)' }}>{label}</Label>
      {hint && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  )
}
