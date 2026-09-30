'use client'

import Link from 'next/link'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { ALL_STATUSES, SALARY_FIT_META, STATUS_META } from '@/lib/constants'
import { cn, daysSince, relativeDays, shortDate } from '@/lib/format'
import type { ApplicationStatus, SalaryFit } from '@/lib/types'

export interface CardApplication {
  id: string
  company_name: string
  role_title: string
  status: ApplicationStatus
  match_score: number | null
  salary_fit: SalaryFit | null
  applied_date: string | null
  created_at: string
}

const FIT_DOT: Record<string, string> = {
  high: 'bg-match-high',
  medium: 'bg-match-medium',
  low: 'bg-match-low',
  neutral: 'bg-slate-500',
}

export function ApplicationCard({
  app,
  onMove,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  app: CardApplication
  onMove: (status: ApplicationStatus) => void
  dragging?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
}) {
  const days = daysSince(app.applied_date)
  const fit = app.salary_fit ? SALARY_FIT_META[app.salary_fit] : null

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative cursor-grab rounded-lg border border-border bg-surface p-3.5 shadow-card transition hover:border-slate-500 active:cursor-grabbing',
        dragging && 'opacity-40'
      )}
    >
      <Link href={`/applications/${app.id}`} className="block focus:outline-none">
        <span className="absolute inset-0 rounded-lg focus-visible:shadow-focus" aria-hidden="true" />
        <p className="truncate text-company">{app.company_name}</p>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted">{app.role_title}</p>
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <ScoreBadge score={app.match_score} />
        {fit && app.salary_fit !== 'unclear' && (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted" title={`Salary: ${fit.label}`}>
            <span className={cn('h-1.5 w-1.5 rounded-full', FIT_DOT[fit.tone])} />
            {fit.label}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <p className="text-[12px] text-muted">
          {days !== null ? `Applied ${relativeDays(days)}` : `Added ${shortDate(app.created_at)}`}
        </p>
        {/* Drag and drop does not work on touch screens, so every card can also be moved from here. */}
        <label className="relative z-10">
          <span className="sr-only">Move {app.company_name} to</span>
          <select
            value={app.status}
            onChange={(e) => onMove(e.target.value as ApplicationStatus)}
            className="cursor-pointer rounded-md border border-transparent bg-transparent py-0.5 pl-1 pr-1 text-[12px] text-muted hover:border-border hover:text-text focus:border-primary focus:outline-none"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </article>
  )
}
