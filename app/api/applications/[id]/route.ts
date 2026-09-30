import { NextResponse } from 'next/server'
import { intOrNull, isUuid, jsonError, nullable, readJson, requireUser } from '@/lib/api'
import { ALL_STATUSES, nextFurthest } from '@/lib/constants'
import { sgToday } from '@/lib/format'
import type { ApplicationStatus, PipelineStage } from '@/lib/types'

type Params = { params: { id: string } }

const TEXT_FIELDS: Record<string, number> = {
  company_name: 120,
  role_title: 160,
  industry: 80,
  job_posting_url: 1000,
  notes: 5000,
  cover_letter_draft: 10_000,
  sponsorship_pitch: 3000,
}

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  if (!isUuid(params.id)) return jsonError('Not found', 404)

  const { data } = await auth.supabase.from('applications').select('*').eq('id', params.id).maybeSingle()
  if (!data) return jsonError('Not found', 404)
  return NextResponse.json({ application: data })
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase } = auth
  if (!isUuid(params.id)) return jsonError('Not found', 404)

  const body = await readJson<Record<string, unknown>>(request)
  if (!body) return jsonError('Invalid request')

  const { data: current } = await supabase
    .from('applications')
    .select('id, status, furthest_stage, applied_date')
    .eq('id', params.id)
    .maybeSingle()
  if (!current) return jsonError('Not found', 404)

  const update: Record<string, unknown> = {}

  for (const [field, max] of Object.entries(TEXT_FIELDS)) {
    if (field in body) {
      const value = nullable(body[field], max)
      if ((field === 'company_name' || field === 'role_title') && !value) {
        return jsonError('Company and role cannot be empty')
      }
      update[field] = value
    }
  }

  for (const field of ['advertised_salary_min', 'advertised_salary_max'] as const) {
    if (field in body) update[field] = intOrNull(body[field], 0, 200_000)
  }

  if ('is_financial_sector' in body) update.is_financial_sector = Boolean(body.is_financial_sector)

  if ('applied_date' in body) {
    const d = nullable(body.applied_date, 10)
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return jsonError('Use a YYYY-MM-DD date')
    update.applied_date = d
  }

  if ('status' in body) {
    const status = String(body.status) as ApplicationStatus
    if (!ALL_STATUSES.includes(status)) return jsonError('Unknown status')
    update.status = status
    update.furthest_stage = nextFurthest(current.furthest_stage as PipelineStage, status)
    // Moving out of researching means it went out the door, so stamp the date.
    const sent = status !== 'researching' && status !== 'skipped'
    if (sent && !current.applied_date && !('applied_date' in body)) update.applied_date = sgToday()
  }

  if (Object.keys(update).length === 0) return jsonError('Nothing to change')

  const { data, error } = await supabase.from('applications').update(update).eq('id', params.id).select('*').single()
  if (error) return jsonError('Could not save', 500)
  return NextResponse.json({ application: data })
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  if (!isUuid(params.id)) return jsonError('Not found', 404)

  const { error, count } = await auth.supabase
    .from('applications')
    .delete({ count: 'exact' })
    .eq('id', params.id)
  if (error) return jsonError('Could not delete', 500)
  if (!count) return jsonError('Not found', 404)
  return NextResponse.json({ ok: true })
}
