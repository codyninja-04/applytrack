import Link from 'next/link'
import type { Metadata } from 'next'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { MatchTrendChart } from '@/components/dashboard/MatchTrendChart'
import { PageHeader } from '@/components/ui/PageHeader'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { STATUS_META } from '@/lib/constants'
import { funnel, headline, targeting, weeklyTrend, type DashRow } from '@/lib/dashboard'
import { cn, shortDate } from '@/lib/format'
import { getSession } from '@/lib/queries'
import { canUse } from '@/lib/usage'

export const metadata: Metadata = { title: 'Dashboard' }

const READ_COPY = {
  sharper: { title: 'Getting more targeted', tone: 'text-match-high', body: 'Your recent analyses score higher than the month before. You are picking better roles.' },
  steady: { title: 'Holding steady', tone: 'text-text', body: 'Match scores are about where they were last month.' },
  spraying: { title: 'Drifting towards spray and pray', tone: 'text-match-low', body: 'Scores are dropping or you are sending applications that scored under 50. Those rarely convert for sponsored candidates.' },
  not_enough: { title: 'Not enough data yet', tone: 'text-muted', body: 'Analyse at least three roles this month to see whether you are getting more targeted.' },
}

export default async function DashboardPage() {
  const { supabase, profile } = await getSession()

  const [{ data }, { count: resumeCount }] = await Promise.all([
    supabase
      .from('applications')
      .select('id, company_name, role_title, status, furthest_stage, match_score, applied_date, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000),
    supabase.from('resumes').select('id', { count: 'exact', head: true }),
  ])
  const rows = (data ?? []) as DashRow[]

  const stats = headline(rows)
  const trend = weeklyTrend(rows)
  const steps = funnel(rows)
  const target = targeting(rows)
  const read = READ_COPY[target.read]
  const showTrends = canUse(profile?.plan, 'trends')
  const firstName = profile?.display_name?.split(' ')[0]

  if (rows.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Dashboard" title={firstName ? `Hi ${firstName}` : 'Dashboard'} />
        <section className="card p-6 sm:p-8">
          <h2 className="text-[18px] font-semibold">Two steps to your first honest score</h2>
          <ol className="mt-5 space-y-3">
            <Step done={(resumeCount ?? 0) > 0} n={1} href="/resume/upload" label="Upload your resume" />
            <Step done={false} n={2} href="/applications/new" label="Paste a job description you are considering" />
          </ol>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={firstName ? `Hi ${firstName}` : 'Dashboard'}
        description="Where your search stands, and whether you are aiming better over time."
        actions={
          <Link href="/applications/new" className="btn-primary">
            New match analysis
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="In progress" value={stats.active} sub={`${stats.sent} sent in total`} />
        <Stat label="Reached interview" value={stats.interviews} />
        <Stat
          label="Response rate"
          value={stats.responseRate === null ? '-' : `${stats.responseRate}%`}
          sub={stats.responseRate === null ? 'Needs 3 sent' : 'Got past applied'}
        />
        <Stat label="Avg match when sent" value={stats.avgMatchSent === null ? '-' : `${stats.avgMatchSent}%`} sub={`${stats.total} roles analysed`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[15px] font-semibold">Average match score by week</h2>
            <p className="text-[12px] text-muted">Last 12 weeks</p>
          </div>
          {showTrends ? (
            <div className="mt-4">
              <MatchTrendChart data={trend} />
            </div>
          ) : (
            <p className="mt-6 text-[14px] text-muted">Match score trends are part of Pro.</p>
          )}
        </section>

        <section className="card flex flex-col p-5">
          <h2 className="text-[15px] font-semibold">Targeting</h2>
          <p className={cn('mt-3 text-[20px] font-bold leading-tight', read.tone)}>{read.title}</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{read.body}</p>
          <dl className="mt-auto grid grid-cols-2 gap-3 pt-5 text-[13px]">
            <div className="rounded-lg bg-background/60 px-3 py-2.5">
              <dt className="text-muted">Last 28 days</dt>
              <dd className="mt-0.5 text-[16px] font-semibold tabular-nums">{target.recentAvg === null ? '-' : `${target.recentAvg}%`}</dd>
            </div>
            <div className="rounded-lg bg-background/60 px-3 py-2.5">
              <dt className="text-muted">28 days before</dt>
              <dd className="mt-0.5 text-[16px] font-semibold tabular-nums">{target.priorAvg === null ? '-' : `${target.priorAvg}%`}</dd>
            </div>
            <div className="col-span-2 rounded-lg bg-background/60 px-3 py-2.5">
              <dt className="text-muted">Sent with a score under 50, last 28 days</dt>
              <dd className={cn('mt-0.5 text-[16px] font-semibold tabular-nums', target.lowSends > 0 && 'text-match-low')}>
                {target.lowSends} of {target.sentRecent}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.6fr]">
        <section className="card p-5">
          <h2 className="text-[15px] font-semibold">Application funnel</h2>
          <p className="mt-1 text-[12.5px] text-muted">Furthest stage each sent application reached</p>
          <div className="mt-4">
            {stats.sent === 0 ? (
              <p className="py-10 text-center text-[13px] text-muted">Move a card out of Researching to start the funnel.</p>
            ) : (
              <FunnelChart data={steps} />
            )}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold">Recently updated</h2>
            <Link href="/applications" className="text-[13px] font-semibold text-primary hover:underline">
              All applications
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {rows.slice(0, 7).map((r) => (
              <li key={r.id}>
                <Link href={`/applications/${r.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-surface-2">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_META[r.status].dot)} title={STATUS_META[r.status].label} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{r.company_name}</span>
                    <span className="block truncate text-[12.5px] text-muted">
                      {r.role_title} · {STATUS_META[r.status].label}
                    </span>
                  </span>
                  <ScoreBadge score={r.match_score} />
                  <span className="hidden w-14 text-right text-[12px] text-muted sm:block">{shortDate(r.updated_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[12.5px] text-muted">{label}</p>
      <p className="mt-1 text-[26px] font-bold leading-none tabular-nums">{value}</p>
      {sub && <p className="mt-1.5 text-[12px] text-muted">{sub}</p>}
    </div>
  )
}

function Step({ done, n, href, label }: { done: boolean; n: number; href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 rounded-lg border border-border p-3.5 transition hover:border-slate-500">
        <span
          className={cn(
            'grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold',
            done ? 'bg-match-high/20 text-match-high' : 'bg-primary/15 text-primary'
          )}
        >
          {done ? '✓' : n}
        </span>
        <span className={cn('text-[14px] font-medium', done && 'text-muted line-through')}>{label}</span>
      </Link>
    </li>
  )
}
