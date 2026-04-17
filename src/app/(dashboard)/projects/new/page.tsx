import type { Metadata } from 'next'
import { BriefForm } from '@/components/brief/brief-form'

export const metadata: Metadata = { title: 'New Brief' }

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
          New Brief
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Define your product, brand voice, and target markets to start the pipeline
        </p>
      </div>
      <BriefForm />
    </div>
  )
}
