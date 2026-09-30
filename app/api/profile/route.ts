import { NextResponse } from 'next/server'
import { intOrNull, jsonError, nullable, readJson, requireUser } from '@/lib/api'
import { createServiceClient } from '@/lib/supabase/server'

const PASSES = ['s_pass', 'ep', 'either', 'none_have_pr_citizen']
const DEGREES = ['diploma', 'bachelor', 'masters', 'phd', 'none']
const TIERS = ['top_tier', 'recognised', 'other']

function pick(value: unknown, allowed: string[]): string | null {
  return typeof value === 'string' && allowed.includes(value) ? value : null
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const body = await readJson<Record<string, unknown>>(request)
  if (!body) return jsonError('Invalid request')

  const update: Record<string, unknown> = { user_id: userId }
  if ('display_name' in body) update.display_name = nullable(body.display_name, 80)
  if ('nationality' in body) update.nationality = nullable(body.nationality, 60)
  if ('current_qualification' in body) update.current_qualification = nullable(body.current_qualification, 160)
  if ('field_of_study' in body) update.field_of_study = nullable(body.field_of_study, 120)
  if ('target_industry' in body) update.target_industry = nullable(body.target_industry, 80)
  if ('work_pass_needed' in body) update.work_pass_needed = pick(body.work_pass_needed, PASSES)
  if ('degree_type' in body) update.degree_type = pick(body.degree_type, DEGREES)
  if ('university_tier' in body) update.university_tier = pick(body.university_tier, TIERS)
  if ('years_experience' in body) update.years_experience = intOrNull(body.years_experience, 0, 60)
  if ('age' in body) update.age = intOrNull(body.age, 16, 80)
  if ('current_monthly_salary_expectation' in body) {
    update.current_monthly_salary_expectation = intOrNull(body.current_monthly_salary_expectation, 0, 200_000)
  }
  if (body.onboarding_complete === true) update.onboarding_complete = true

  const { data, error } = await supabase.from('user_profiles').upsert(update).select('*').single()
  if (error) return jsonError('Could not save your profile', 500)
  return NextResponse.json({ profile: data })
}

/** Deletes the account and everything under it. Storage files first, then the auth user. */
export async function DELETE() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const { data: files } = await supabase.storage.from('resumes').list(userId, { limit: 1000 })
  if (files && files.length > 0) {
    await supabase.storage.from('resumes').remove(files.map((f) => `${userId}/${f.name}`))
  }

  try {
    const admin = createServiceClient()
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) throw error
  } catch (err) {
    console.error('[delete account]', err)
    return jsonError('Could not delete the account. Contact support.', 500)
  }

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
