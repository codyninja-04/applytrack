'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV } from '@/lib/nav'
import { cn } from '@/lib/format'
import { Icon } from '@/components/ui/Icon'
import { Logo } from './Logo'

export interface UsageSummary {
  plan: 'free' | 'pro'
  used: number
  limit: number | null
}

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      <Link
        href="/applications/new"
        onClick={onNavigate}
        className="btn-primary mb-4 w-full justify-start px-3"
      >
        <Icon name="plus" />
        New match analysis
      </Link>
      {NAV.map((item) => {
        const active = pathname === item.href || (pathname.startsWith(`${item.href}/`) && pathname !== '/applications/new')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition',
              active ? 'bg-surface-2 text-text' : 'text-muted hover:bg-surface hover:text-text'
            )}
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function UsageMeter({ usage }: { usage: UsageSummary }) {
  if (usage.limit === null) {
    return (
      <div className="rounded-lg border border-border bg-background/60 p-3">
        <p className="eyebrow">Pro</p>
        <p className="mt-1 text-[13px] text-muted">{usage.used} analyses this month</p>
      </div>
    )
  }

  const pct = Math.min(100, (usage.used / usage.limit) * 100)
  const out = usage.used >= usage.limit

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Free plan</p>
        <p className={cn('text-[12px] font-semibold', out ? 'text-match-low' : 'text-text')}>
          {usage.used}/{usage.limit}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div className={cn('h-full rounded-full', out ? 'bg-match-low' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[12px] leading-snug text-muted">
        {out ? 'Limit reached. Resets on the 1st.' : 'Match analyses used this month'}
      </p>
    </div>
  )
}

export function Sidebar({ usage }: { usage: UsageSummary }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-border bg-background px-4 py-5 lg:flex">
      <Link href="/dashboard" className="mb-7 px-2">
        <Logo />
      </Link>
      <NavLinks />
      <div className="mt-auto">
        <UsageMeter usage={usage} />
      </div>
    </aside>
  )
}
