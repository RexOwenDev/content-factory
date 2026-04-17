'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Projects',
  '/projects/new': 'New Brief',
  '/review': 'Review Queue',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

export function Topbar() {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'ContentFactory'

  return (
    <header
      className="flex h-14 flex-shrink-0 items-center justify-between border-b px-6"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h1 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {title}
      </h1>

      <Link
        href="/projects/new"
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <Plus className="h-3.5 w-3.5" />
        New Brief
      </Link>
    </header>
  )
}
