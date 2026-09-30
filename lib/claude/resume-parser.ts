import type Anthropic from '@anthropic-ai/sdk'
import type { ParsedResume } from '@/lib/types'
import { callStructured, clip, str, strArr } from './client'

const SYSTEM = `You extract resumes into structured data. Copy what is there, do not improve, summarise creatively or invent anything.

- raw_text must be the full plain text of the resume in reading order, so later tools can search it for exact wording. Keep bullet points as lines starting with "- ".
- summary is the candidate's own summary if they wrote one. If not, write one neutral sentence describing their current role and years of experience, nothing evaluative.
- total_years_experience counts full-time professional work only. Internships count as a quarter. Round to one decimal. Null if you genuinely cannot tell.
- Keep highlights close to the original wording. They are used later to check keyword matches.
- skills is a flat, de-duplicated list of concrete skills, tools and languages. Drop soft skills like "team player".`

const SCHEMA: Anthropic.Tool['input_schema'] = {
  type: 'object',
  properties: {
    raw_text: str,
    name: { type: ['string', 'null'] },
    headline: { type: ['string', 'null'] },
    summary: str,
    total_years_experience: { type: ['number', 'null'] },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: str,
          company: str,
          start: { type: ['string', 'null'] },
          end: { type: ['string', 'null'] },
          highlights: strArr,
        },
        required: ['title', 'company', 'start', 'end', 'highlights'],
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: { qualification: str, institution: str, year: { type: ['string', 'null'] } },
        required: ['qualification', 'institution', 'year'],
      },
    },
    skills: strArr,
    projects: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: str, description: str, tech: strArr },
        required: ['name', 'description', 'tech'],
      },
    },
    certifications: strArr,
  },
  required: [
    'raw_text',
    'name',
    'headline',
    'summary',
    'total_years_experience',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
  ],
}

type ParseOutput = ParsedResume & { raw_text: string }

export type ResumeSource = { kind: 'pdf'; base64: string } | { kind: 'text'; text: string }

/**
 * PDFs go to the model as a document block, so we get layout-aware text
 * extraction for free instead of fighting two-column templates ourselves.
 */
export async function parseResume(source: ResumeSource): Promise<{ rawText: string; parsed: ParsedResume }> {
  const content: Anthropic.MessageParam['content'] =
    source.kind === 'pdf'
      ? [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: source.base64 } },
          { type: 'text', text: 'Extract this resume.' },
        ]
      : `Extract this resume.\n\n${clip(source.text, 20000)}`

  const out = await callStructured<ParseOutput>({
    system: SYSTEM,
    content,
    toolName: 'save_resume',
    toolDescription: 'Save the structured resume.',
    schema: SCHEMA,
    maxTokens: 8000,
  })

  const { raw_text, ...parsed } = out
  return {
    // For pasted text the original is the source of truth, not the model's copy.
    rawText: source.kind === 'text' ? source.text.trim() : raw_text.trim(),
    parsed: {
      ...parsed,
      experience: parsed.experience ?? [],
      education: parsed.education ?? [],
      skills: Array.from(new Set(parsed.skills ?? [])),
      projects: parsed.projects ?? [],
      certifications: parsed.certifications ?? [],
    },
  }
}
