'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ProjectTabsProps {
  projectId: string
}

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname()
  const base = `/projects/${projectId}`

  const tabs = [
    { href: base, label: 'Overview' },
    { href: `${base}/review`, label: 'Review' },
    { href: `${base}/eval`, label: 'Eval' },
  ]

  return (
    <div
      className="flex gap-1 border-b pb-0"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {tabs.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
            style={{
              borderBottomColor: isActive ? 'var(--color-primary)' : 'transparent',
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
            }}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
