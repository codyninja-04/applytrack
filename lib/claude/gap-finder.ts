import type Anthropic from '@anthropic-ai/sdk'
import type { GapReport, LanguageSuggestion } from '@/lib/types'
import { HOUSE_STYLE, callStructured, clip, str, strArr } from './client'

const SYSTEM = `You compare the language in a resume with the language in a job description and show where the candidate describes real experience in words an ATS or recruiter will not match.

This is about wording, not invention. For each suggestion:
- jd_phrase is the exact phrase from the JD.
- your_current_wording is the exact line from the resume that describes related work, or null if nothing in the resume covers it.
- suggested_rewrite rewrites that resume line using the JD's language. It must stay true to what the original line says. Never add tools, scale, numbers or responsibilities that are not in the original.
- If your_current_wording is null, do not write a rewrite that claims the experience. Instead suggested_rewrite should describe what they would need to have done to claim it, starting with "Only if true:".
- honesty_check says in one line what the candidate must be able to back up in an interview if they use this wording.

do_not_claim lists JD requirements that the resume shows no evidence of at all. These are things the candidate should not paper over with wording.

Give 4 to 8 suggestions, most valuable first. summary is two sentences on how far wording alone can close the gap.

${HOUSE_STYLE}`

const SCHEMA: Anthropic.Tool['input_schema'] = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          jd_phrase: str,
          your_current_wording: { type: ['string', 'null'] },
          suggested_rewrite: str,
          why: str,
          honesty_check: str,
        },
        required: ['jd_phrase', 'your_current_wording', 'suggested_rewrite', 'why', 'honesty_check'],
      },
    },
    do_not_claim: strArr,
    summary: str,
  },
  required: ['suggestions', 'do_not_claim', 'summary'],
}

export async function identifyGaps(params: {
  resumeText: string
  jobDescription: string
  roleTitle: string
  knownGaps: string[]
  missingKeywords: string[]
}): Promise<GapReport> {
  const content = `Role: ${params.roleTitle}

Gaps already flagged: ${params.knownGaps.join('; ') || 'none'}
JD keywords not found in the resume: ${params.missingKeywords.join(', ') || 'none'}

<resume>
${clip(params.resumeText, 12000)}
</resume>

<job_description>
${clip(params.jobDescription, 8000)}
</job_description>`

  const out = await callStructured<{ suggestions: LanguageSuggestion[]; do_not_claim: string[]; summary: string }>({
    system: SYSTEM,
    content,
    toolName: 'record_language_gaps',
    toolDescription: 'Record resume wording suggestions against the job description.',
    schema: SCHEMA,
    maxTokens: 3000,
  })

  return {
    suggestions: out.suggestions ?? [],
    do_not_claim: out.do_not_claim ?? [],
    summary: out.summary,
    generated_at: new Date().toISOString(),
  }
}
