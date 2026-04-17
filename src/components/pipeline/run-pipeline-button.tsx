'use client'

import { useState } from 'react'
import { Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface RunPipelineButtonProps {
  projectId: string
  disabled?: boolean
}

export function RunPipelineButton({ projectId, disabled }: RunPipelineButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleRun() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pipeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? `Request failed: ${res.status}`)
      }

      // Refresh the page to reflect the updated project status
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleRun}
        disabled={disabled || loading}
        size="lg"
        className="gap-2 font-semibold"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
        }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {loading ? 'Starting pipeline…' : 'Run Pipeline'}
      </Button>
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-accent-red, #f85149)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
