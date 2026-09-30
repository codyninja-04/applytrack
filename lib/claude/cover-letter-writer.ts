import type Anthropic from '@anthropic-ai/sdk'
import { HOUSE_STYLE, callStructured, clip, str } from './client'

export type LetterTone = 'direct' | 'warm' | 'formal'

const TONE_NOTES: Record<LetterTone, string> = {
  direct: 'Confident and compact. Lead with the strongest proof point.',
  warm: 'Personable, shows genuine interest in the company, still specific.',
  formal: 'Traditional structure suited to banks, government-linked companies and MNC HR teams.',
}

function buildSystem(needsSponsorship: boolean, passLabel: string, tone: LetterTone): string {
  return `You write cover letters for candidates applying to Singapore roles, some of whom need work pass sponsorship.

Rules:
- Never open with "I am writing to apply for". Start with something specific to the role or company.
- Be concrete. Reference actual projects, numbers and employers from the resume. No generic claims like "passionate team player".
- Under 300 words for the whole letter. Hiring managers skim.
- Do not invent anything that is not in the resume.
- ${
    needsSponsorship
      ? `Include exactly ONE paragraph that addresses ${passLabel} sponsorship directly and confidently. Frame it around the specific value that makes the sponsorship worth it, not "please sponsor me". Reference skills from the resume that the JD suggests are hard to hire for, without being presumptuous about the local talent pool. Mention practical things that lower the employer's effort if true (for example salary already above the qualifying level, or availability to start once approved). This paragraph must also appear word for word inside full_letter.`
      : 'No sponsorship needed. Do not mention work passes at all and return sponsorship_paragraph as null.'
  }
- End with an active, confident close. Not "I hope to hear from you".
- Sign off with the candidate's name.
- Tone: ${TONE_NOTES[tone]}

${HOUSE_STYLE}`
}

const SCHEMA: Anthropic.Tool['input_schema'] = {
  type: 'object',
  properties: {
    full_letter: str,
    sponsorship_paragraph: { type: ['string', 'null'] },
  },
  required: ['full_letter', 'sponsorship_paragraph'],
}

export async function writeCoverLetter(params: {
  candidateName: string
  roleTitle: string
  companyName: string
  jobDescription: string
  keyStrengths: string[]
  resumeText: string
  needsSponsorship: boolean
  workPassType: string
  salaryNote: string | null
  tone: LetterTone
}): Promise<{ full_letter: string; sponsorship_paragraph: string | null }> {
  const passLabel = params.workPassType === 's_pass' ? 'S Pass' : params.workPassType === 'ep' ? 'Employment Pass' : 'work pass'

  const content = `Candidate: ${params.candidateName}
Role: ${params.roleTitle} at ${params.companyName}
Key strengths for this role: ${params.keyStrengths.join('; ') || 'use the resume'}
${params.needsSponsorship ? `Needs ${passLabel} sponsorship.` : 'No sponsorship needed.'}
${params.salaryNote ?? ''}

<resume>
${clip(params.resumeText, 8000)}
</resume>

<job_description>
${clip(params.jobDescription, 5000)}
</job_description>

Write the cover letter.`

  const out = await callStructured<{ full_letter: string; sponsorship_paragraph: string | null }>({
    system: buildSystem(params.needsSponsorship, passLabel, params.tone),
    content,
    toolName: 'save_cover_letter',
    toolDescription: 'Save the cover letter draft.',
    schema: SCHEMA,
    maxTokens: 2000,
  })

  return {
    full_letter: out.full_letter.trim(),
    sponsorship_paragraph: params.needsSponsorship ? out.sponsorship_paragraph?.trim() || null : null,
  }
}
