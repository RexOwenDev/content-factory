'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FilePlus2,
  CheckSquare,
  BarChart3,
  Settings,
  Zap,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Projects', icon: LayoutDashboard },
  { href: '/projects/new', label: 'New Brief', icon: FilePlus2 },
  { href: '/review', label: 'Review Queue', icon: CheckSquare },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex w-60 flex-shrink-0 flex-col border-r"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center gap-2 border-b px-4"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>
          ContentFactory
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
              style={{
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                backgroundColor: isActive ? 'var(--color-primary-muted)' : 'transparent',
              }}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-2" style={{ borderColor: 'var(--color-border)' }}>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
