import type Anthropic from '@anthropic-ai/sdk'
import type { CompassEstimate, CompassInputs, CompassPoints } from '@/lib/types'
import { buildEstimate, qualificationPoints } from '@/lib/passes/compass'
import { epQualifyingSalary } from '@/lib/passes/thresholds'
import { HOUSE_STYLE, callStructured, str, strArr } from './client'

const COMPASS_CONTEXT = `Singapore's COMPASS framework (Complementarity Assessment Framework) applies to new Employment Pass applications from September 2023 and renewals from September 2024. It does not apply to S Pass.

Four foundational criteria, each scored 0, 10 or 20. The application needs 40 points in total across all criteria (it does not need to pass each one):
C1 Salary: fixed monthly salary against local PMET salaries in the same sector, benchmarked by age. 20 if at or above the 90th percentile, 10 if at or above the 65th, 0 below the 65th.
C2 Qualifications: 20 for a top-tier institution, 10 for degree-equivalent, 0 below degree.
C3 Diversity: share of the candidate's nationality in the firm's PMET workforce. Employer side.
C4 Support for local employment: firm's local PMET share against sector peers. Employer side.
Bonus: C5 Skills bonus of 20 for jobs on the Shortage Occupation List (mostly specific tech, healthcare, green economy, maritime and advanced manufacturing roles). C6 Strategic Economic Priorities bonus of 10 for qualifying firms, employer side.

Candidates earning a fixed $22,500 a month or more are exempt from COMPASS.
Figures and lists change. Always point the user to mom.gov.sg to verify.`

const SYSTEM = `You give a rough, honest estimate of the two COMPASS items the candidate's own profile drives: C1 (salary) and whether the role could plausibly earn the C5 Shortage Occupation List bonus. C2 is already scored by fixed rules and given to you.

${COMPASS_CONTEXT}

For C1 you do not have MOM's exact percentile tables. Reason from what you know of Singapore PMET pay for that role, sector and age. Be conservative: when unsure between two brackets, pick the lower one and say why. Mention the rough monthly figures you are assuming for the 65th and 90th percentile so the user can sanity check them.

For C5, only say it is possible if the role title and sector genuinely line up with the kind of occupations the Shortage Occupation List covers. A generic software engineer is not automatically on it.

strong_criteria and weak_criteria are short phrases about this candidate specifically. recommendation is 2 to 3 sentences on what would move their odds: salary negotiation, targeting firms with fewer people of their nationality, or roles that qualify for the skills bonus.

${HOUSE_STYLE}`

const SCHEMA: Anthropic.Tool['input_schema'] = {
  type: 'object',
  properties: {
    salary_points: { type: 'integer', enum: [0, 10, 20] },
    salary_reasoning: str,
    sol_bonus_possible: { type: 'boolean' },
    sol_reasoning: str,
    strong_criteria: strArr,
    weak_criteria: strArr,
    recommendation: str,
  },
  required: [
    'salary_points',
    'salary_reasoning',
    'sol_bonus_possible',
    'sol_reasoning',
    'strong_criteria',
    'weak_criteria',
    'recommendation',
  ],
}

interface ModelOutput {
  salary_points: CompassPoints
  salary_reasoning: string
  sol_bonus_possible: boolean
  sol_reasoning: string
  strong_criteria: string[]
  weak_criteria: string[]
  recommendation: string
}

const TIER_LABEL = { top_tier: 'top-tier institution', recognised: 'recognised university', other: 'other institution' }

export async function estimateCOMPASS(inputs: CompassInputs): Promise<CompassEstimate> {
  const qual = qualificationPoints(inputs.degree_type, inputs.university_tier)
  const threshold = epQualifyingSalary(inputs.age, inputs.is_financial_sector)

  const content = `Offered salary: $${inputs.offered_salary.toLocaleString()}/month (EP qualifying salary for this age and sector is about $${threshold.toLocaleString()})
Role: ${inputs.role_title} in ${inputs.industry}${inputs.is_financial_sector ? ' (financial services)' : ''}
Age: ${inputs.age}
Years experience: ${inputs.years_experience}
Qualification: ${inputs.degree_type} from a ${TIER_LABEL[inputs.university_tier]}. C2 already scored at ${qual.points}.
Nationality: ${inputs.nationality || 'not given'}

Estimate C1 and whether C5 is plausible.`

  const out = await callStructured<ModelOutput>({
    system: SYSTEM,
    content,
    toolName: 'record_compass_estimate',
    toolDescription: 'Record the COMPASS estimate for the candidate controllable criteria.',
    schema: SCHEMA,
    maxTokens: 1500,
  })

  const salaryPoints = ([0, 10, 20] as const).includes(out.salary_points) ? out.salary_points : 0

  return buildEstimate({
    inputs,
    salaryPoints,
    salaryReasoning: out.salary_reasoning,
    solPossible: Boolean(out.sol_bonus_possible),
    solReasoning: out.sol_reasoning,
    strong: out.strong_criteria ?? [],
    weak: out.weak_criteria ?? [],
    recommendation: out.recommendation,
  })
}
