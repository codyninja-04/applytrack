import { OUTCOME_COPY } from '@/lib/passes/compass'
import { COMPASS_PASS_MARK } from '@/lib/passes/thresholds'
import { MATCH_BADGE } from '@/lib/constants'
import { cn, money } from '@/lib/format'
import type { CompassEstimate } from '@/lib/types'

export function CompassDisclaimer() {
  return (
    <div role="note" className="rounded-lg border border-match-medium/40 bg-match-medium/10 px-4 py-3 text-[13px] leading-relaxed">
      <span className="font-semibold">Estimate only.</span> COMPASS is assessed by MOM using your employer&apos;s submission and
      their current workforce data, which nobody outside the company can see. Salary benchmarks, thresholds and the
      top-tier and shortage lists change. Verify current criteria at{' '}
      <a href="https://www.mom.gov.sg/passes-and-permits/employment-pass/eligibility" target="_blank" rel="noreferrer noopener" className="font-semibold underline underline-offset-2">
        mom.gov.sg
      </a>
      .
    </div>
  )
}

function Bar({ points, max = 20, tone }: { points: number | null; max?: number; tone: 'you' | 'employer' | 'bonus' }) {
  if (points === null) {
    return (
      <div
        className="h-2.5 rounded-full bg-border"
        style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(148,163,184,0.25) 6px 9px)' }}
        aria-hidden="true"
      />
    )
  }
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
      <div
        className={cn('h-full rounded-full', tone === 'bonus' ? 'bg-sponsorship' : points >= 20 ? 'bg-match-high' : points >= 10 ? 'bg-match-medium' : 'bg-match-low')}
        style={{ width: `${(points / max) * 100}%` }}
      />
    </div>
  )
}

function Row({
  code,
  title,
  owner,
  points,
  reasoning,
  tone,
}: {
  code: string
  title: string
  owner: string
  points: number | null
  reasoning: string
  tone: 'you' | 'employer' | 'bonus'
}) {
  return (
    <li className="space-y-2 py-4 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] font-semibold">
          <span className="mr-2 text-muted">{code}</span>
          {title}
          <span
            className={cn(
              'ml-2 rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]',
              tone === 'employer' ? 'bg-surface-2 text-muted' : tone === 'bonus' ? 'bg-sponsorship/15 text-sponsorship' : 'bg-primary/15 text-primary'
            )}
          >
            {owner}
          </span>
        </p>
        <p className="shrink-0 text-[14px] font-bold tabular-nums">{points === null ? '?' : `${points}`}<span className="font-medium text-muted">/20</span></p>
      </div>
      <Bar points={points} tone={tone} />
      <p className="text-[13px] leading-relaxed text-muted">{reasoning}</p>
    </li>
  )
}

export function CriteriaBreakdown({ estimate }: { estimate: CompassEstimate }) {
  const outcome = OUTCOME_COPY[estimate.likely_outcome]
  const q = estimate.qualifying_salary
  const solPoints = estimate.sol_bonus_possible ? 20 : 0

  return (
    <div className="space-y-4">
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Your side of the score</p>
            <p className="mt-2 text-score tabular-nums">
              {estimate.candidate_points}
              <span className="text-[20px] font-semibold text-muted"> / 40</span>
            </p>
            <p className="mt-1 text-[13px] text-muted">from salary and qualifications, pass mark is {COMPASS_PASS_MARK} in total</p>
          </div>
          <span
            className={cn(
              'chip px-2.5 py-1.5 text-[13px] ring-1',
              outcome.tone === 'neutral' ? 'bg-surface-2 text-muted ring-border' : MATCH_BADGE[outcome.tone]
            )}
          >
            {outcome.label}
          </span>
        </div>

        {/* The single most important framing: half of COMPASS is outside the candidate's control. */}
        <div className="mt-5 grid grid-cols-4 gap-1.5" aria-hidden="true">
          <div className="h-2 rounded-full bg-primary" />
          <div className="h-2 rounded-full bg-primary" />
          <div className="h-2 rounded-full bg-border" />
          <div className="h-2 rounded-full bg-border" />
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed">
          You control 2 of 4 factors. The other 2 depend on your employer&apos;s workforce mix.
          {!estimate.exempt && q.clears && (
            <>
              {' '}
              {estimate.employer_points_needed === 0 ? (
                <>Your side already reaches {COMPASS_PASS_MARK}{solPoints ? ' with the shortage bonus' : ''}, so the employer factors are a buffer, not a requirement.</>
              ) : (
                <>
                  The employer needs to bring at least <strong>{estimate.employer_points_needed}</strong> points from diversity and local
                  employment{solPoints ? ', assuming the shortage bonus applies' : ''}.
                </>
              )}
            </>
          )}
        </p>
      </section>

      {!q.clears && !estimate.exempt && (
        <div className="rounded-lg border border-match-low/40 bg-match-low/10 px-4 py-3 text-[13.5px] leading-relaxed">
          <span className="font-semibold">Below the EP qualifying salary.</span> {money(q.offered)} is under about {money(q.threshold)} for
          your age and sector. COMPASS points do not matter until the salary clears this line.
        </div>
      )}
      {estimate.exempt && (
        <div className="rounded-lg border border-match-high/40 bg-match-high/10 px-4 py-3 text-[13.5px] leading-relaxed">
          At {money(q.offered)} a month you are above the COMPASS exemption line, so the points framework should not apply.
        </div>
      )}

      <section className="card p-5 sm:p-6">
        <h3 className="mb-4 text-[15px] font-semibold">Criteria</h3>
        <ol className="divide-y divide-border">
          <Row code="C1" title="Salary vs local peers" owner="You" points={estimate.salary_points} reasoning={estimate.salary_reasoning} tone="you" />
          <Row code="C2" title="Qualifications" owner="You" points={estimate.qualification_points} reasoning={estimate.qualification_reasoning} tone="you" />
          <Row
            code="C3"
            title="Nationality diversity"
            owner="Employer"
            points={null}
            reasoning="Depends on how many people of your nationality the firm already employs. Smaller shares score higher."
            tone="employer"
          />
          <Row
            code="C4"
            title="Support for local employment"
            owner="Employer"
            points={null}
            reasoning="Depends on the firm's local PMET share against others in its sector."
            tone="employer"
          />
          <Row
            code="C5"
            title="Shortage Occupation List bonus"
            owner="Bonus"
            points={solPoints}
            reasoning={estimate.sol_reasoning}
            tone="bonus"
          />
        </ol>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-match-high" /> Working for you
          </h3>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed">
            {estimate.strong_criteria.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
            {estimate.strong_criteria.length === 0 && <li className="text-muted">Nothing stands out.</li>}
          </ul>
        </section>
        <section className="card p-5">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-match-low" /> Working against you
          </h3>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed">
            {estimate.weak_criteria.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
            {estimate.weak_criteria.length === 0 && <li className="text-muted">No clear weak spots.</li>}
          </ul>
        </section>
      </div>

      <section className="card p-5">
        <p className="eyebrow mb-1.5">What would move your odds</p>
        <p className="text-[14px] leading-relaxed">{estimate.recommendation}</p>
      </section>

      <CompassDisclaimer />
    </div>
  )
}
