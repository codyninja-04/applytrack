import { NextResponse } from 'next/server'
import { aiErrorResponse, isUuid, jsonError, loadProfile, readJson, requireUser } from '@/lib/api'
import { writeCoverLetter, type LetterTone } from '@/lib/claude/cover-letter-writer'
import { passFit } from '@/lib/passes/thresholds'
import { canUse, recordUsage } from '@/lib/usage'
import type { Application } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const TONES: LetterTone[] = ['direct', 'warm', 'formal']

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const body = await readJson<{ application_id?: string; tone?: string }>(request)
  if (!isUuid(body?.application_id)) return jsonError('Missing application')
  const tone = TONES.includes(body!.tone as LetterTone) ? (body!.tone as LetterTone) : 'direct'

  const profile = await loadProfile(supabase, userId)
  if (!canUse(profile?.plan, 'cover_letter')) return jsonError('Cover letters are a Pro feature.', 403)

  const { data } = await supabase.from('applications').select('*').eq('id', body!.application_id).maybeSingle()
  const app = data as Application | null
  if (!app) return jsonError('Not found', 404)
  if (!app.job_description || app.job_description.length < 150) return jsonError('Add the job description first')

  let resumeQuery = supabase.from('resumes').select('raw_text, parsed_data')
  resumeQuery = app.resume_id ? resumeQuery.eq('id', app.resume_id) : resumeQuery.eq('is_primary', true)
  const { data: resume } = await resumeQuery.limit(1).maybeSingle()
  if (!resume?.raw_text) return jsonError('Upload a resume first', 404)

  const pass = profile?.work_pass_needed ?? 'either'
  const needsSponsorship = pass !== 'none_have_pr_citizen'

  // Only tell the model the salary clears the bar when our own check agrees.
  let salaryNote: string | null = null
  if (needsSponsorship) {
    const fit = passFit({
      passNeeded: pass,
      age: profile?.age ?? null,
      financial: app.is_financial_sector,
      salaryMin: app.advertised_salary_min,
      salaryMax: app.advertised_salary_max,
    })
    if (fit.status === 'clears') salaryNote = 'The advertised salary already clears the work pass qualifying salary.'
  }

  const name = profile?.display_name || resume.parsed_data?.name || 'The candidate'

  try {
    const letter = await writeCoverLetter({
      candidateName: name,
      roleTitle: app.role_title,
      companyName: app.company_name,
      jobDescription: app.job_description,
      keyStrengths: app.strengths_identified ?? [],
      resumeText: resume.raw_text,
      needsSponsorship,
      workPassType: pass,
      salaryNote,
      tone,
    })

    const { data: updated, error } = await supabase
      .from('applications')
      .update({ cover_letter_draft: letter.full_letter, sponsorship_pitch: letter.sponsorship_paragraph })
      .eq('id', app.id)
      .select('cover_letter_draft, sponsorship_pitch')
      .single()
    if (error) return jsonError('Could not save the draft', 500)

    await recordUsage(supabase, userId, 'cover_letter')
    return NextResponse.json(updated)
  } catch (err) {
    return aiErrorResponse(err)
  }
}
