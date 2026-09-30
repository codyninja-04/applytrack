import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApplicationTabs } from '@/components/applications/ApplicationTabs'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { STATUS_META } from '@/lib/constants'
import { cn } from '@/lib/format'
import { getApplication } from '@/lib/queries'

export default async function ApplicationLayout({
  params,
  children,
}: {
  params: { id: string }
  children: React.ReactNode
}) {
  const app = await getApplication(params.id)
  if (!app) notFound()

  return (
    <div>
      <Link href="/applications" className="text-[13px] font-medium text-muted hover:text-text">
        &larr; Applications
      </Link>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-company text-muted">{app.company_name}</p>
          <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-[-0.01em]">{app.role_title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip gap-1.5 bg-surface text-text ring-1 ring-border">
            <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[app.status].dot)} />
            {STATUS_META[app.status].label}
          </span>
          <ScoreBadge score={app.match_score} size="md" />
        </div>
      </div>
      <ApplicationTabs id={app.id} />
      <div className="mt-6">{children}</div>
    </div>
  )
}
