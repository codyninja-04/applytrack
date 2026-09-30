import { NextResponse } from 'next/server'
import { isUuid, jsonError, nullable, readJson, requireUser } from '@/lib/api'

type Params = { params: { id: string } }

/** Short-lived signed link to the original upload. */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  if (!isUuid(params.id)) return jsonError('Not found', 404)

  const { data } = await auth.supabase.from('resumes').select('file_url').eq('id', params.id).maybeSingle()
  if (!data?.file_url) return jsonError('No original file stored for this version', 404)

  const { data: signed, error } = await auth.supabase.storage.from('resumes').createSignedUrl(data.file_url, 60)
  if (error || !signed) return jsonError('Could not open the file', 500)
  return NextResponse.redirect(signed.signedUrl)
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth
  if (!isUuid(params.id)) return jsonError('Not found', 404)

  const body = await readJson<{ version_name?: string; is_primary?: boolean }>(request)
  if (!body) return jsonError('Invalid request')

  const update: Record<string, unknown> = {}
  if (body.version_name !== undefined) {
    const name = nullable(body.version_name, 80)
    if (!name) return jsonError('Name cannot be empty')
    update.version_name = name
  }

  if (body.is_primary === true) {
    await supabase.from('resumes').update({ is_primary: false }).eq('user_id', userId).eq('is_primary', true)
    update.is_primary = true
  }

  if (Object.keys(update).length === 0) return jsonError('Nothing to change')

  const { data, error } = await supabase.from('resumes').update(update).eq('id', params.id).select('*').maybeSingle()
  if (error) return jsonError('Could not update the resume', 500)
  if (!data) return jsonError('Not found', 404)
  return NextResponse.json({ resume: data })
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth
  if (!isUuid(params.id)) return jsonError('Not found', 404)

  const { data: resume } = await supabase
    .from('resumes')
    .select('id, file_url, is_primary')
    .eq('id', params.id)
    .maybeSingle()
  if (!resume) return jsonError('Not found', 404)

  const { error } = await supabase.from('resumes').delete().eq('id', params.id)
  if (error) return jsonError('Could not delete the resume', 500)

  if (resume.file_url) await supabase.storage.from('resumes').remove([resume.file_url])

  // Promote the newest remaining version so there is always a default.
  if (resume.is_primary) {
    const { data: next } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (next) await supabase.from('resumes').update({ is_primary: true }).eq('id', next.id)
  }

  return NextResponse.json({ ok: true })
}
