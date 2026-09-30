import type Anthropic from '@anthropic-ai/sdk'
import { callStructured, clip, str } from './client'

export interface JDDetails {
  company_name: string | null
  role_title: string | null
  industry: string | null
  is_financial_sector: boolean
  salary_min: number | null
  salary_max: number | null
  job_description: string
}

const SYSTEM = `You pull the basic facts out of a job posting. Only report what the text states. Do not guess a company or salary.

- salary_min and salary_max are monthly SGD. Convert annual figures by dividing by 12 and round to the nearest 100. Null if not stated.
- is_financial_sector is true for banks, insurers, asset managers, trading firms and other MAS-regulated financial institutions, since MOM uses a higher salary scale for them.
- industry is a short sector label such as "Fintech", "Banking", "E-commerce", "Logistics", "Government".
- job_description is the posting text itself, cleaned of navigation, cookie banners, "similar jobs" lists and other page clutter. Keep the original wording of the role content.`

const SCHEMA: Anthropic.Tool['input_schema'] = {
  type: 'object',
  properties: {
    company_name: { type: ['string', 'null'] },
    role_title: { type: ['string', 'null'] },
    industry: { type: ['string', 'null'] },
    is_financial_sector: { type: 'boolean' },
    salary_min: { type: ['integer', 'null'] },
    salary_max: { type: ['integer', 'null'] },
    job_description: str,
  },
  required: ['company_name', 'role_title', 'industry', 'is_financial_sector', 'salary_min', 'salary_max', 'job_description'],
}

export async function extractJobDetails(text: string): Promise<JDDetails> {
  return callStructured<JDDetails>({
    system: SYSTEM,
    content: `<posting>\n${clip(text, 15000)}\n</posting>`,
    toolName: 'record_job',
    toolDescription: 'Record the job posting details.',
    schema: SCHEMA,
    maxTokens: 4000,
  })
}
