import type { WorkPassNeeded } from '@/lib/types'

/**
 * Work pass salary rules we can compute without asking a model.
 *
 * Figures are MOM's published qualifying salaries for new applications:
 *   EP     from 1 Jan 2025: $5,600 at 23, rising with age to $10,700 at 45
 *          (financial services $6,200 to $11,800)
 *   S Pass from 1 Sep 2025: $3,300 at 23, rising with age to $4,800 at 45
 *          (financial services $3,800 to $5,650)
 *   COMPASS exemption: fixed monthly salary of $22,500 and above
 *
 * MOM publishes the scale in steps. We interpolate linearly between the two
 * published ends, so a mid-career number here can be off by a couple of
 * hundred dollars. Anything within BORDERLINE_BAND of the line is shown as
 * borderline for that reason. These numbers change, which is why every place
 * that shows them also says to check mom.gov.sg.
 */

export const THRESHOLDS_AS_OF = 'MOM figures for 2025 applications'

interface Scale {
  base: number
  max: number
}

const EP: Record<'general' | 'financial', Scale> = {
  general: { base: 5600, max: 10700 },
  financial: { base: 6200, max: 11800 },
}

const S_PASS: Record<'general' | 'financial', Scale> = {
  general: { base: 3300, max: 4800 },
  financial: { base: 3800, max: 5650 },
}

export const COMPASS_EXEMPT_SALARY = 22500
export const COMPASS_PASS_MARK = 40
const MIN_AGE = 23
const MAX_AGE = 45
const BORDERLINE_BAND = 300

function scaled(scale: Scale, age: number | null): number {
  if (age === null || age <= MIN_AGE) return scale.base
  if (age >= MAX_AGE) return scale.max
  const t = (age - MIN_AGE) / (MAX_AGE - MIN_AGE)
  return Math.round((scale.base + t * (scale.max - scale.base)) / 50) * 50
}

export function epQualifyingSalary(age: number | null, financial: boolean): number {
  return scaled(financial ? EP.financial : EP.general, age)
}

export function sPassQualifyingSalary(age: number | null, financial: boolean): number {
  return scaled(financial ? S_PASS.financial : S_PASS.general, age)
}

export type PassFitStatus = 'clears' | 'borderline' | 'below' | 'unknown' | 'not_needed'

export interface PassFit {
  status: PassFitStatus
  pass: 'ep' | 's_pass' | null
  threshold: number | null
  salary: number | null
  message: string
}

/**
 * Checks a role's salary against the qualifying salary for the pass the
 * candidate needs. For "either" we check EP first and fall back to S Pass,
 * since a role that only clears S Pass is still a real option.
 */
export function passFit(params: {
  passNeeded: WorkPassNeeded | null
  age: number | null
  financial: boolean
  salaryMin: number | null
  salaryMax: number | null
}): PassFit {
  const { passNeeded, age, financial } = params

  if (passNeeded === 'none_have_pr_citizen') {
    return { status: 'not_needed', pass: null, threshold: null, salary: null, message: 'No work pass needed.' }
  }

  // Use the bottom of the band. Employers anchor offers low, and MOM looks at
  // the actual fixed salary on the application, not the advertised ceiling.
  const salary = params.salaryMin ?? params.salaryMax
  if (!salary) {
    return {
      status: 'unknown',
      pass: passNeeded === 's_pass' ? 's_pass' : 'ep',
      threshold: null,
      salary: null,
      message: 'No salary on the posting. Ask early, it decides whether a pass is even possible.',
    }
  }

  const ep = epQualifyingSalary(age, financial)
  const sp = sPassQualifyingSalary(age, financial)

  const judge = (pass: 'ep' | 's_pass', threshold: number): PassFit => {
    const label = pass === 'ep' ? 'EP' : 'S Pass'
    if (salary >= threshold + BORDERLINE_BAND) {
      return { status: 'clears', pass, threshold, salary, message: `Clears the ${label} qualifying salary of about $${threshold.toLocaleString()}.` }
    }
    if (salary >= threshold - BORDERLINE_BAND) {
      return {
        status: 'borderline',
        pass,
        threshold,
        salary,
        message: `Right on the ${label} line of about $${threshold.toLocaleString()}. Confirm the exact figure for your age on mom.gov.sg.`,
      }
    }
    return {
      status: 'below',
      pass,
      threshold,
      salary,
      message: `Below the ${label} qualifying salary of about $${threshold.toLocaleString()} for your age. The employer would need to pay more to sponsor you.`,
    }
  }

  if (passNeeded === 's_pass') return judge('s_pass', sp)

  const epFit = judge('ep', ep)
  if (passNeeded === 'ep' || epFit.status !== 'below') return epFit

  // "either" (or unset): fall back to S Pass when EP is out of reach
  const spFit = judge('s_pass', sp)
  if (spFit.status === 'below') return epFit
  return {
    ...spFit,
    message: `Below EP for your age, but ${spFit.status === 'clears' ? 'clears' : 'is borderline for'} S Pass at about $${sp.toLocaleString()}. S Pass has quota limits per company, so ask whether they have room.`,
  }
}

/** Salary fit against the candidate's own expectation, when both are known. */
export function salaryFitFromNumbers(
  expectation: number | null,
  min: number | null,
  max: number | null
): 'below_range' | 'within_range' | 'above_range' | null {
  if (!expectation || (!min && !max)) return null
  const low = min ?? max!
  const high = max ?? min!
  if (expectation > high) return 'below_range'
  if (expectation < low * 0.85) return 'above_range'
  return 'within_range'
}

/** Keyword hints that put a role under the higher financial services scale. */
export function looksFinancialSector(industry: string | null | undefined): boolean {
  if (!industry) return false
  return /(bank|financ|fintech|insur|asset management|wealth|trading|investment|capital markets|securities|fund)/i.test(
    industry
  )
}
