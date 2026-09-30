import { MATCH_BADGE, RECOMMENDATION_META } from '@/lib/constants'
import { cn } from '@/lib/format'
import type { Application, UserProfile } from '@/lib/types'
import { GapAnalysis, SkillsMatch } from './GapAnalysis'
import { KeywordCoverage } from './KeywordCoverage'
import { MatchScoreGauge } from './MatchScoreGauge'
import { SalaryFitIndicator } from './SalaryFitIndicator'

/**
 * The full analysis. The verdict sits right next to the score and is never
 * collapsed or softened, because it is the part that saves the user an hour.
 */
export function MatchResult({
  application,
  profile,
}: {
  application: Application
  profile: Pick<UserProfile, 'work_pass_needed' | 'age' | 'current_monthly_salary_expectation'> | null
}) {
  const b = application.match_breakdown
  if (!b || application.match_score === null) return null
  const rec = RECOMMENDATION_META[b.recommendation]

  return (
    <div className="space-y-4">
      <section className="card grid gap-6 p-5 sm:p-6 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex justify-center">
          <MatchScoreGauge score={application.match_score} />
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('chip uppercase tracking-[0.04em] ring-1', MATCH_BADGE[rec.tone])}>{rec.label}</span>
            <span className="text-[13px] text-muted">{b.seniority_read}</span>
          </div>
          <div className="rounded-lg border-l-4 border-primary bg-background/70 px-4 py-3.5">
            <p className="eyebrow mb-1.5">Honest verdict</p>
            <p className="text-verdict text-text">{b.honest_verdict}</p>
          </div>
          <p className="text-[13.5px] leading-relaxed text-muted">{b.experience_match}</p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkillsMatch matched={b.skills_match.matched} missing={b.skills_match.missing} />
        <SalaryFitIndicator
          fit={b.salary_fit}
          salaryMin={application.advertised_salary_min}
          salaryMax={application.advertised_salary_max}
          financial={application.is_financial_sector}
          profile={profile}
        />
      </div>

      <KeywordCoverage coverage={b.keyword_coverage} />

      <GapAnalysis strengths={application.strengths_identified ?? []} gaps={application.gaps_identified ?? []} />
    </div>
  )
}
