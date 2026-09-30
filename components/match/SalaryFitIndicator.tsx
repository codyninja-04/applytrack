import { MATCH_BADGE, PASS_LABEL, SALARY_FIT_META } from '@/lib/constants'
import { cn, salaryRange } from '@/lib/format'
import { THRESHOLDS_AS_OF, passFit } from '@/lib/passes/thresholds'
import type { SalaryFit, UserProfile } from '@/lib/types'

export function SalaryFitBadge({ fit }: { fit: SalaryFit }) {
  const meta = SALARY_FIT_META[fit]
  return (
    <span
      className={cn(
        'chip uppercase tracking-[0.04em] ring-1',
        meta.tone === 'neutral' ? 'bg-surface-2 text-muted ring-border' : MATCH_BADGE[meta.tone]
      )}
    >
      {meta.label}
    </span>
  )
}

const PASS_TONE = {
  clears: 'high',
  borderline: 'medium',
  below: 'low',
} as const

/**
 * Two separate questions in one card: does the pay work for you, and does it
 * clear the work pass line so the employer can sponsor you at all.
 */
export function SalaryFitIndicator({
  fit,
  salaryMin,
  salaryMax,
  financial,
  profile,
}: {
  fit: SalaryFit
  salaryMin: number | null
  salaryMax: number | null
  financial: boolean
  profile: Pick<UserProfile, 'work_pass_needed' | 'age' | 'current_monthly_salary_expectation'> | null
}) {
  const pass = passFit({
    passNeeded: profile?.work_pass_needed ?? 'either',
    age: profile?.age ?? null,
    financial,
    salaryMin,
    salaryMax,
  })
  const range = salaryRange(salaryMin, salaryMax)

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold">Salary</h3>
        <SalaryFitBadge fit={fit} />
      </div>
      <p className="mt-2 text-[14px] text-muted">
        {range ? (
          <>
            Advertised <span className="font-semibold text-text">{range}</span> a month
          </>
        ) : (
          'No salary on the posting.'
        )}
        {profile?.current_monthly_salary_expectation
          ? `. You are aiming for $${profile.current_monthly_salary_expectation.toLocaleString('en-SG')}.`
          : ''}
      </p>

      {pass.status !== 'not_needed' && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">{pass.pass ? PASS_LABEL[pass.pass] : 'Work pass'} threshold</p>
            {pass.status !== 'unknown' && (
              <span className={cn('chip ring-1', MATCH_BADGE[PASS_TONE[pass.status]])}>
                {pass.status === 'clears' ? 'Clears' : pass.status === 'borderline' ? 'Borderline' : 'Below'}
              </span>
            )}
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed">{pass.message}</p>
          <p className="mt-2 text-[12px] text-muted">
            {financial ? 'Financial services scale. ' : ''}
            {profile?.age ? `Based on age ${profile.age}. ` : 'Add your age in settings for an age-adjusted figure. '}
            {THRESHOLDS_AS_OF}, verify at mom.gov.sg.
          </p>
        </div>
      )}
    </section>
  )
}
