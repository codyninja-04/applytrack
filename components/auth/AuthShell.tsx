import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-[130px]"
      />

      <div className="relative w-full max-w-[420px] animate-fade-up space-y-7">
        <Link href="/" className="flex justify-center">
          <Logo />
        </Link>

        <div className="card space-y-6 p-7">
          <header className="space-y-2">
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em]">{title}</h1>
            <p className="text-[14px] leading-relaxed text-muted">{subtitle}</p>
          </header>

          {children}
        </div>

        <p className="px-4 text-center text-[12px] leading-relaxed text-muted/80">
          ApplyTrack gives estimates and general guidance, not immigration advice. Work pass
          eligibility is decided by MOM.
        </p>
      </div>
    </main>
  )
}
