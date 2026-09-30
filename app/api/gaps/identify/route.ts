import { NextResponse } from 'next/server'
import { aiErrorResponse, isUuid, jsonError, readJson, requireUser } from '@/lib/api'
import { identifyGaps } from '@/lib/claude/gap-finder'
import { recordUsage } from '@/lib/usage'
import type { Application } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Resume wording versus JD wording, for an application that has been analysed. */
export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const body = await readJson<{ application_id?: string }>(request)
  if (!isUuid(body?.application_id)) return jsonError('Missing application')

  const { data } = await supabase.from('applications').select('*').eq('id', body!.application_id).maybeSingle()
  const app = data as Application | null
  if (!app) return jsonError('Not found', 404)
  if (!app.resume_id || !app.match_breakdown) return jsonError('Run the match analysis first')

  const { data: resume } = await supabase.from('resumes').select('raw_text').eq('id', app.resume_id).maybeSingle()
  if (!resume?.raw_text) return jsonError('The resume used for this match was deleted. Re-run the match.', 404)

  try {
    const report = await identifyGaps({
      resumeText: resume.raw_text,
      jobDescription: app.job_description,
      roleTitle: app.role_title,
      knownGaps: app.gaps_identified ?? [],
      missingKeywords: app.match_breakdown.keyword_coverage.missing,
    })

    const { error } = await supabase.from('applications').update({ language_suggestions: report }).eq('id', app.id)
    if (error) return jsonError('Could not save the suggestions', 500)

    await recordUsage(supabase, userId, 'gaps')
    return NextResponse.json({ report })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
