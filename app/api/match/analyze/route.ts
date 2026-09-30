import { NextResponse } from 'next/server'
import { aiErrorResponse, intOrNull, isUuid, jsonError, loadProfile, nullable, readJson, requireUser } from '@/lib/api'
import { analyzeMatch } from '@/lib/claude/match-analyzer'
import { keywordCoverage } from '@/lib/match/keywords'
import { looksFinancialSector, salaryFitFromNumbers } from '@/lib/passes/thresholds'
import { matchQuota, recordUsage } from '@/lib/usage'
import type { MatchBreakdown } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface Body {
  application_id?: string
  resume_id?: string
  company_name?: string
  role_title?: string
  industry?: string
  is_financial_sector?: boolean
  job_description?: string
  job_posting_url?: string
  advertised_salary_min?: number | string | null
  advertised_salary_max?: number | string | null
}

/**
 * Scores a resume version against a JD and caches the result on the
 * application. Without an application_id it creates one in "researching",
 * so every analysis shows up in the trend chart even if it gets skipped.
 */
export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const body = await readJson<Body>(request)
  if (!body) return jsonError('Invalid request')
  if (!isUuid(body.resume_id)) return jsonError('Pick a resume version')

  const profile = await loadProfile(supabase, userId)
  const quota = await matchQuota(supabase, userId, profile?.plan)
  if (quota.remaining === 0) {
    return jsonError(
      `You have used all ${quota.limit} free analyses this month. They reset on the 1st, or go Pro for unlimited.`,
      402
    )
  }

  const { data: resume } = await supabase
    .from('resumes')
    .select('id, raw_text')
    .eq('id', body.resume_id)
    .maybeSingle()
  if (!resume?.raw_text) return jsonError('That resume version has no text. Re-upload it.', 404)

  // Re-analysis of an existing application keeps its stored JD unless a new one is sent.
  let existing: Record<string, unknown> | null = null
  if (body.application_id) {
    if (!isUuid(body.application_id)) return jsonError('Not found', 404)
    const { data } = await supabase.from('applications').select('*').eq('id', body.application_id).maybeSingle()
    if (!data) return jsonError('Not found', 404)
    existing = data
  }

  const jobDescription = nullable(body.job_description, 30_000) ?? (existing?.job_description as string | undefined)
  const companyName = nullable(body.company_name, 120) ?? (existing?.company_name as string | undefined)
  const roleTitle = nullable(body.role_title, 160) ?? (existing?.role_title as string | undefined)
  if (!jobDescription || jobDescription.length < 150) return jsonError('Paste the full job description first')
  if (!companyName || !roleTitle) return jsonError('Add the company name and role title')

  const industry = nullable(body.industry, 80) ?? ((existing?.industry as string | null) ?? null)
  const salaryMin =
    body.advertised_salary_min !== undefined
      ? intOrNull(body.advertised_salary_min, 0, 200_000)
      : ((existing?.advertised_salary_min as number | null) ?? null)
  const salaryMax =
    body.advertised_salary_max !== undefined
      ? intOrNull(body.advertised_salary_max, 0, 200_000)
      : ((existing?.advertised_salary_max as number | null) ?? null)

  let result
  try {
    result = await analyzeMatch({
      resumeText: resume.raw_text,
      jobDescription,
      roleTitle,
      companyName,
      candidateContext: {
        workPassNeeded: profile?.work_pass_needed ?? 'either',
        yearsExperience: profile?.years_experience ?? null,
        degreeType: profile?.degree_type ?? null,
        salaryExpectation: profile?.current_monthly_salary_expectation ?? null,
      },
    })
  } catch (err) {
    return aiErrorResponse(err)
  }

  const coverage = keywordCoverage(resume.raw_text, result.jd_keywords)
  // When we have real numbers, trust arithmetic over the model's read of the JD.
  const numericFit = salaryFitFromNumbers(profile?.current_monthly_salary_expectation ?? null, salaryMin, salaryMax)

  const breakdown: MatchBreakdown = {
    skills_match: result.skills_match,
    experience_match: result.experience_match,
    keyword_coverage: coverage,
    honest_verdict: result.honest_verdict,
    recommendation: result.recommendation,
    salary_fit: numericFit ?? result.salary_fit,
    seniority_read: result.seniority_read,
  }

  const record = {
    resume_id: resume.id,
    company_name: companyName,
    role_title: roleTitle,
    industry,
    is_financial_sector:
      body.is_financial_sector !== undefined ? Boolean(body.is_financial_sector) : looksFinancialSector(industry),
    job_description: jobDescription,
    job_posting_url: nullable(body.job_posting_url, 1000) ?? ((existing?.job_posting_url as string | null) ?? null),
    advertised_salary_min: salaryMin,
    advertised_salary_max: salaryMax,
    match_score: result.match_score,
    match_breakdown: breakdown,
    gaps_identified: result.gaps,
    strengths_identified: result.strengths,
    match_analyzed_at: new Date().toISOString(),
    // A new analysis makes the old wording suggestions stale.
    language_suggestions: null,
  }

  const query = existing
    ? supabase.from('applications').update(record).eq('id', existing.id as string)
    : supabase.from('applications').insert({ ...record, user_id: userId, status: 'researching' })

  const { data: application, error } = await query.select('*').single()
  if (error || !application) {
    console.error('[match save]', error?.message)
    return jsonError('The analysis worked but could not be saved. Try again.', 500)
  }

  await recordUsage(supabase, userId, 'match')

  return NextResponse.json({
    application,
    quota: quota.limit === null ? null : { used: quota.used + 1, limit: quota.limit },
  })
}
