import type Anthropic from '@anthropic-ai/sdk'
import type { JDKeyword, MatchBreakdown, SalaryFit } from '@/lib/types'
import { HOUSE_STYLE, callStructured, clip, str, strArr } from './client'

const SYSTEM = `You are a brutally honest hiring manager in Singapore deciding whether a resume actually fits a job description. The candidate usually needs S Pass or EP sponsorship, so they compete at a disadvantage against local candidates. They need real feedback, not encouragement. They apply to 15 or more roles a week and are using you to decide which ones deserve an hour of tailoring.

How to score match_score (0 to 100):
- Skills overlap with the JD's stated requirements carries the most weight. Must-haves count far more than nice-to-haves.
- Years and level of experience versus what is asked. A junior applying to a senior role is a real gap, say so.
- Whether the resume's actual work and projects demonstrate the JD's core responsibilities, not just list the words.
- Calibration: 80+ means a strong shortlist candidate even without sponsorship concerns. Most applications should land between 35 and 75. Below 40 means the gap is too big to tailor around.

jd_keywords: the 12 to 25 terms an ATS or recruiter would scan for, using the JD's exact wording (tools, languages, frameworks, methodologies, domain terms, certifications). Add aliases only for true equivalents (for example "Kubernetes" with "k8s"). Mark must_have for ones the JD states as required. Do not include generic soft skills.

recommendation:
- "apply" when it is a solid fit as is
- "apply_with_changes" when the fit is real but the resume undersells it
- "stretch" when it is possible but the odds are low, worth it only for a dream company
- "skip" when the time is better spent elsewhere

honest_verdict is 2 to 3 sentences. Say whether to apply and, if so, exactly what to lead with. If they should skip, say what the dealbreaker is. Do not soften it.

gaps must be specific ("No production Kubernetes experience, the JD lists it as required") not vague ("could improve cloud skills").

salary_fit compares the JD's pay (if stated anywhere in the text) with the candidate's expectation: below_range means the role pays less than they want. Use "unclear" if the JD gives no pay information.

${HOUSE_STYLE}`

const SCHEMA: Anthropic.Tool['input_schema'] = {
  type: 'object',
  properties: {
    match_score: { type: 'integer', minimum: 0, maximum: 100 },
    skills_match: {
      type: 'object',
      properties: { matched: strArr, missing: strArr },
      required: ['matched', 'missing'],
    },
    experience_match: str,
    seniority_read: { type: 'string', description: 'One short line on the level the JD is really hiring at versus where the candidate sits.' },
    jd_keywords: {
      type: 'array',
      items: {
        type: 'object',
        properties: { term: str, aliases: strArr, must_have: { type: 'boolean' } },
        required: ['term', 'aliases', 'must_have'],
      },
    },
    strengths: strArr,
    gaps: strArr,
    honest_verdict: str,
    recommendation: { type: 'string', enum: ['apply', 'apply_with_changes', 'stretch', 'skip'] },
    salary_fit: { type: 'string', enum: ['below_range', 'within_range', 'above_range', 'unclear'] },
  },
  required: [
    'match_score',
    'skills_match',
    'experience_match',
    'seniority_read',
    'jd_keywords',
    'strengths',
    'gaps',
    'honest_verdict',
    'recommendation',
    'salary_fit',
  ],
}

export interface MatchResult {
  match_score: number
  skills_match: MatchBreakdown['skills_match']
  experience_match: string
  seniority_read: string
  jd_keywords: JDKeyword[]
  strengths: string[]
  gaps: string[]
  honest_verdict: string
  recommendation: MatchBreakdown['recommendation']
  salary_fit: SalaryFit
}

export async function analyzeMatch(params: {
  resumeText: string
  jobDescription: string
  roleTitle: string
  companyName: string
  candidateContext: {
    workPassNeeded: string
    yearsExperience: number | null
    degreeType: string | null
    salaryExpectation: number | null
  }
}): Promise<MatchResult> {
  const ctx = params.candidateContext
  const passLine =
    ctx.workPassNeeded === 'none_have_pr_citizen'
      ? 'Singapore citizen or PR, no sponsorship needed'
      : `needs ${ctx.workPassNeeded === 's_pass' ? 'S Pass' : ctx.workPassNeeded === 'ep' ? 'Employment Pass' : 'EP or S Pass'} sponsorship`

  const content = `Role: ${params.roleTitle} at ${params.companyName}

Candidate context: ${passLine}; ${ctx.yearsExperience ?? 'unknown'} years experience; ${ctx.degreeType ?? 'unknown'} degree; expects ${ctx.salaryExpectation ? `$${ctx.salaryExpectation.toLocaleString()}/month` : 'an unstated salary'}.

<resume>
${clip(params.resumeText, 12000)}
</resume>

<job_description>
${clip(params.jobDescription, 8000)}
</job_description>

Analyse the match honestly.`

  const out = await callStructured<MatchResult>({
    system: SYSTEM,
    content,
    toolName: 'record_match',
    toolDescription: 'Record the resume versus job description assessment.',
    schema: SCHEMA,
    maxTokens: 3000,
  })

  return {
    ...out,
    match_score: Math.max(0, Math.min(100, Math.round(out.match_score))),
    jd_keywords: out.jd_keywords ?? [],
    strengths: out.strengths ?? [],
    gaps: out.gaps ?? [],
  }
}
