import { NextResponse } from 'next/server'
import { aiErrorResponse, intOrNull, isUuid, jsonError, loadProfile, nullable, readJson, requireUser } from '@/lib/api'
import { estimateCOMPASS } from '@/lib/claude/compass-estimator'
import { canUse, recordUsage } from '@/lib/usage'
import type { CompassInputs, DegreeType, UniversityTier } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 45

const DEGREES: DegreeType[] = ['none', 'diploma', 'bachelor', 'masters', 'phd']
const TIERS: UniversityTier[] = ['top_tier', 'recognised', 'other']

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const profile = await loadProfile(supabase, userId)
  if (!canUse(profile?.plan, 'compass')) return jsonError('The COMPASS estimator is a Pro feature.', 403)

  const body = await readJson<Record<string, unknown>>(request)
  if (!body) return jsonError('Invalid request')

  const salary = intOrNull(body.offered_salary, 0, 200_000)
  const age = intOrNull(body.age, 16, 80)
  const years = intOrNull(body.years_experience, 0, 60)
  const role = nullable(body.role_title, 160)
  const industry = nullable(body.industry, 80)
  const degree = String(body.degree_type) as DegreeType
  const tier = String(body.university_tier) as UniversityTier

  if (!salary || salary < 1000) return jsonError('Enter the monthly salary in SGD')
  if (!age) return jsonError('Enter your age, the salary thresholds scale with it')
  if (years === null) return jsonError('Enter your years of experience')
  if (!role || !industry) return jsonError('Enter the role and industry')
  if (!DEGREES.includes(degree) || !TIERS.includes(tier)) return jsonError('Pick your qualification')

  const inputs: CompassInputs = {
    offered_salary: salary,
    role_title: role,
    industry,
    is_financial_sector: Boolean(body.is_financial_sector),
    degree_type: degree,
    university_tier: tier,
    years_experience: years,
    age,
    nationality: nullable(body.nationality, 60) ?? '',
  }

  let result
  try {
    result = await estimateCOMPASS(inputs)
  } catch (err) {
    return aiErrorResponse(err)
  }

  await supabase.from('compass_checks').insert({ user_id: userId, inputs, result })

  if (isUuid(body.application_id)) {
    await supabase.from('applications').update({ compass_estimate: result }).eq('id', body.application_id)
  }

  await recordUsage(supabase, userId, 'compass')
  return NextResponse.json({ result })
}
