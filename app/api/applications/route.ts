import { NextResponse } from 'next/server'
import { intOrNull, jsonError, nullable, readJson, requireUser } from '@/lib/api'
import { ALL_STATUSES, nextFurthest } from '@/lib/constants'
import { sgToday } from '@/lib/format'
import { looksFinancialSector } from '@/lib/passes/thresholds'
import type { ApplicationStatus } from '@/lib/types'

const LIST_COLUMNS =
  'id, company_name, role_title, status, match_score, match_breakdown, applied_date, advertised_salary_min, advertised_salary_max, created_at, updated_at, furthest_stage'

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { data, error } = await auth.supabase
    .from('applications')
    .select(LIST_COLUMNS)
    .order('updated_at', { ascending: false })
    .limit(500)

  if (error) return jsonError('Could not load applications', 500)
  return NextResponse.json({ applications: data })
}

/** Manual add, for roles you already applied to before using ApplyTrack. */
export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const body = await readJson<Record<string, unknown>>(request)
  if (!body) return jsonError('Invalid request')

  const company = nullable(body.company_name, 120)
  const role = nullable(body.role_title, 160)
  if (!company || !role) return jsonError('Company and role are required')

  const status = (ALL_STATUSES as string[]).includes(String(body.status))
    ? (body.status as ApplicationStatus)
    : 'researching'
  const industry = nullable(body.industry, 80)

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      company_name: company,
      role_title: role,
      industry,
      is_financial_sector: looksFinancialSector(industry),
      job_description: nullable(body.job_description, 30_000) ?? '',
      job_posting_url: nullable(body.job_posting_url, 1000),
      advertised_salary_min: intOrNull(body.advertised_salary_min, 0, 200_000),
      advertised_salary_max: intOrNull(body.advertised_salary_max, 0, 200_000),
      status,
      furthest_stage: nextFurthest('researching', status),
      applied_date: status === 'researching' ? null : nullable(body.applied_date, 10) ?? sgToday(),
    })
    .select('*')
    .single()

  if (error) return jsonError('Could not save the application', 500)
  return NextResponse.json({ application: data })
}
