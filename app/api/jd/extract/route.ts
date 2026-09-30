import { NextResponse } from 'next/server'
import { aiErrorResponse, jsonError, readJson, requireUser } from '@/lib/api'
import { extractJobDetails } from '@/lib/claude/jd-extractor'
import { PostingFetchError, fetchPostingText } from '@/lib/fetch-posting'
import { looksFinancialSector } from '@/lib/passes/thresholds'

export const runtime = 'nodejs'
export const maxDuration = 45

/**
 * Pulls company, role, industry and salary out of a posting, either from a
 * link we fetch or text the user pasted. Free: it saves typing, it is not the
 * analysis they are paying for.
 */
export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const body = await readJson<{ url?: string; text?: string }>(request)
  if (!body || (!body.url && !body.text)) return jsonError('Send a link or the job text')

  let text: string
  if (body.url) {
    try {
      text = await fetchPostingText(body.url)
    } catch (err) {
      if (err instanceof PostingFetchError) return jsonError(err.message, 422)
      return jsonError('Could not load that page. Paste the job text instead.', 422)
    }
  } else {
    text = String(body.text).slice(0, 30_000)
    if (text.trim().length < 150) return jsonError('Paste the full job description, that looks too short')
  }

  try {
    const details = await extractJobDetails(text)
    return NextResponse.json({
      details: {
        ...details,
        // Pasted text is already clean, keep it verbatim.
        job_description: body.url ? details.job_description : text.trim(),
        is_financial_sector: details.is_financial_sector || looksFinancialSector(details.industry),
      },
    })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
