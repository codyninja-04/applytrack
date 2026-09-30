import type { Metadata } from 'next'
import { COMPASSCalculator } from '@/components/compass/COMPASSCalculator'
import { CriteriaBreakdown } from '@/components/compass/CriteriaBreakdown'
import { PageHeader } from '@/components/ui/PageHeader'
import { MATCH_BADGE } from '@/lib/constants'
import { cn, longDate, money } from '@/lib/format'
import { OUTCOME_COPY } from '@/lib/passes/compass'
import { getSession } from '@/lib/queries'
import type { CompassCheck } from '@/lib/types'

export const metadata: Metadata = { title: 'COMPASS estimator' }

export default async function CompassPage() {
  const { supabase, profile } = await getSession()
  const { data } = await supabase
    .from('compass_checks')
    .select('id, created_at, inputs, result')
    .order('created_at', { ascending: false })
    .limit(8)
  const history = (data ?? []) as CompassCheck[]

  return (
    <>
      <PageHeader
        eyebrow="Employment Pass"
        title="COMPASS estimator"
        description="A rough read on the part of COMPASS your own profile drives. Use it to decide which salary to push for and which firms to target, not as a prediction of MOM's decision."
      />

      <COMPASSCalculator
        defaults={{
          industry: profile?.target_industry ?? '',
          offered_salary: profile?.current_monthly_salary_expectation ?? undefined,
          degree_type: profile?.degree_type ?? undefined,
          university_tier: profile?.university_tier ?? undefined,
          years_experience: profile?.years_experience ?? undefined,
          age: profile?.age ?? undefined,
          nationality: profile?.nationality ?? '',
        }}
      />

      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[16px] font-semibold">Previous estimates</h2>
          <div className="space-y-2">
            {history.map((h) => {
              const outcome = OUTCOME_COPY[h.result.likely_outcome]
              return (
                <details key={h.id} className="card p-4">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="font-semibold">{h.inputs.role_title}</span>
                      <span className="text-muted">
                        {' '}
                        in {h.inputs.industry}, {money(h.inputs.offered_salary)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-[13px] tabular-nums text-muted">{h.result.candidate_points}/40 yours</span>
                      <span className={cn('chip ring-1', MATCH_BADGE[outcome.tone === 'neutral' ? 'medium' : outcome.tone])}>
                        {outcome.label}
                      </span>
                      <span className="text-[12px] text-muted">{longDate(h.created_at)}</span>
                    </span>
                  </summary>
                  <div className="mt-4 border-t border-border pt-4">
                    <CriteriaBreakdown estimate={h.result} />
                  </div>
                </details>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
