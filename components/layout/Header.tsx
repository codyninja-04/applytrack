'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { Logo } from './Logo'
import { NavLinks, UsageMeter, type UsageSummary } from './Sidebar'

/** Mobile top bar with a slide-over menu. Hidden on desktop where the sidebar lives. */
export function Header({ usage, name }: { usage: UsageSummary; name: string | null }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" aria-label="Dashboard">
          <Logo />
        </Link>
        <button onClick={() => setOpen(true)} className="btn-ghost px-2.5" aria-label="Open menu" aria-expanded={open}>
          <Icon name="menu" className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute right-0 top-0 flex h-full w-[280px] animate-fade-up flex-col border-l border-border bg-background p-4">
            <div className="mb-6 flex items-center justify-between">
              <span className="truncate text-[14px] font-medium text-muted">{name ?? 'Menu'}</span>
              <button onClick={() => setOpen(false)} className="btn-ghost px-2.5" aria-label="Close menu">
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto">
              <UsageMeter usage={usage} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
