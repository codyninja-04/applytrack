import type { CompassEstimate, CompassPoints, CompassInputs, DegreeType, UniversityTier } from '@/lib/types'
import { COMPASS_EXEMPT_SALARY, COMPASS_PASS_MARK, epQualifyingSalary } from './thresholds'

/**
 * COMPASS scoring we can do in code. The model only gets asked the one thing
 * we cannot compute: where a salary sits against local PMET pay for that
 * sector and age (C1). Everything else, including the totals and the verdict,
 * is arithmetic here so the numbers on screen always add up.
 *
 * Foundational criteria, 0 / 10 / 20 each, pass mark 40 in total:
 *   C1 Salary vs local PMET pay in the sector, by age (65th and 90th percentile)
 *   C2 Qualifications (top-tier institution 20, degree 10, below degree 0)
 *   C3 Diversity of nationalities at the firm            (employer side)
 *   C4 Support for local employment at the firm          (employer side)
 * Bonus: C5 Shortage Occupation List (+20), C6 Strategic Economic Priorities (+10, employer side)
 */

export const COMPASS_DISCLAIMER =
  'This is an estimate only. The actual COMPASS assessment is done by MOM based on your employer\'s submission and current workforce data. Verify current criteria at mom.gov.sg.'

export function qualificationPoints(
  degree: DegreeType,
  tier: UniversityTier
): { points: CompassPoints; reasoning: string } {
  const isDegree = degree === 'bachelor' || degree === 'masters' || degree === 'phd'
  if (!isDegree) {
    return {
      points: 0,
      reasoning:
        degree === 'diploma'
          ? 'A diploma sits below degree level under C2, so it scores 0. Salary and the employer side have to carry the application.'
          : 'Without a degree, C2 scores 0. Salary and the employer side have to carry the application.',
    }
  }
  if (tier === 'top_tier') {
    return {
      points: 20,
      reasoning: 'A degree from an institution on MOM\'s top-tier list scores the full 20. Check your university is actually on that list, it is narrower than most global rankings.',
    }
  }
  return {
    points: 10,
    reasoning: 'A degree-level qualification scores 10. The full 20 is reserved for MOM\'s top-tier institution list.',
  }
}

export function buildEstimate(params: {
  inputs: CompassInputs
  salaryPoints: CompassPoints
  salaryReasoning: string
  solPossible: boolean
  solReasoning: string
  strong: string[]
  weak: string[]
  recommendation: string
}): CompassEstimate {
  const { inputs } = params
  const qual = qualificationPoints(inputs.degree_type, inputs.university_tier)
  const threshold = epQualifyingSalary(inputs.age, inputs.is_financial_sector)
  const clears = inputs.offered_salary >= threshold
  const exempt = inputs.offered_salary >= COMPASS_EXEMPT_SALARY

  const candidate = params.salaryPoints + qual.points
  const employerNeeded = Math.max(0, COMPASS_PASS_MARK - candidate - (params.solPossible ? 20 : 0))

  let outcome: CompassEstimate['likely_outcome']
  if (exempt) outcome = 'exempt'
  else if (!clears) outcome = 'difficult'
  else if (employerNeeded === 0) outcome = 'strong'
  else if (employerNeeded <= 20) outcome = 'depends_on_employer'
  else outcome = 'difficult'

  return {
    exempt,
    salary_points: params.salaryPoints,
    salary_reasoning: params.salaryReasoning,
    qualification_points: qual.points,
    qualification_reasoning: qual.reasoning,
    sol_bonus_possible: params.solPossible,
    sol_reasoning: params.solReasoning,
    candidate_points: candidate,
    employer_points_needed: employerNeeded,
    likely_outcome: outcome,
    strong_criteria: params.strong,
    weak_criteria: params.weak,
    recommendation: params.recommendation,
    qualifying_salary: { threshold, offered: inputs.offered_salary, clears },
    disclaimer: COMPASS_DISCLAIMER,
    generated_at: new Date().toISOString(),
  }
}

export const OUTCOME_COPY: Record<CompassEstimate['likely_outcome'], { label: string; tone: 'high' | 'medium' | 'low' | 'neutral' }> = {
  exempt: { label: 'COMPASS exempt at this salary', tone: 'high' },
  strong: { label: 'Clears 40 on your side alone', tone: 'high' },
  depends_on_employer: { label: 'Depends on the employer', tone: 'medium' },
  difficult: { label: 'Uphill', tone: 'low' },
}
