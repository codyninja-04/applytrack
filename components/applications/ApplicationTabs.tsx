'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/format'

export function ApplicationTabs({ id }: { id: string }) {
  const pathname = usePathname()
  const base = `/applications/${id}`
  const tabs = [
    { href: base, label: 'Overview' },
    { href: `${base}/match`, label: 'Match breakdown' },
    { href: `${base}/cover-letter`, label: 'Cover letter' },
  ]

  return (
    <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-border" aria-label="Application sections">
      {tabs.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[14px] font-medium transition',
              active ? 'border-primary text-text' : 'border-transparent text-muted hover:text-text'
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
