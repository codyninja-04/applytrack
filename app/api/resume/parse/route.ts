import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { aiErrorResponse, jsonError, loadProfile, nullable, requireUser } from '@/lib/api'
import { parseResume, type ResumeSource } from '@/lib/claude/resume-parser'
import { canUse, recordUsage } from '@/lib/usage'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_BYTES = 5 * 1024 * 1024

const TYPES: Record<string, 'pdf' | 'docx' | 'txt'> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
}

function kindFor(file: File): 'pdf' | 'docx' | 'txt' | null {
  if (TYPES[file.type]) return TYPES[file.type]
  const ext = file.name.toLowerCase().split('.').pop()
  return ext === 'pdf' || ext === 'docx' || ext === 'txt' ? ext : null
}

/**
 * Takes a resume as a file (PDF, DOCX, TXT) or pasted text, keeps the
 * original in private storage, and saves a parsed version.
 */
export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonError('Send the resume as a form upload')
  }

  const versionName = nullable(form.get('version_name'), 80)
  if (!versionName) return jsonError('Give this version a name, for example "Backend focused"')

  const profile = await loadProfile(supabase, userId)
  const { count: existing } = await supabase
    .from('resumes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if ((existing ?? 0) >= 1 && !canUse(profile?.plan, 'multiple_resumes')) {
    return jsonError('Multiple resume versions are a Pro feature. Replace your current one or upgrade.', 403)
  }
  if ((existing ?? 0) >= 20) return jsonError('You have 20 versions already. Delete an old one first.')

  const file = form.get('file')
  const pasted = nullable(form.get('text'), 40_000)

  let source: ResumeSource
  let upload: { bytes: ArrayBuffer; ext: string; contentType: string; name: string } | null = null

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return jsonError('Keep the file under 5 MB')
    const kind = kindFor(file)
    if (!kind) return jsonError('Upload a PDF, DOCX or TXT file')

    const bytes = await file.arrayBuffer()
    upload = { bytes, ext: kind, contentType: file.type || 'application/octet-stream', name: file.name.slice(0, 120) }

    if (kind === 'pdf') {
      source = { kind: 'pdf', base64: Buffer.from(bytes).toString('base64') }
    } else if (kind === 'docx') {
      try {
        const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
        source = { kind: 'text', text: value }
      } catch {
        return jsonError('Could not read that Word file. Try exporting it as PDF.')
      }
    } else {
      source = { kind: 'text', text: Buffer.from(bytes).toString('utf8') }
    }
    if (source.kind === 'text' && source.text.trim().length < 200) {
      return jsonError('That file has almost no text in it. If it is a scanned image, export a text PDF instead.')
    }
  } else if (pasted) {
    if (pasted.length < 200) return jsonError('That looks too short to be a full resume')
    source = { kind: 'text', text: pasted }
  } else {
    return jsonError('Upload a file or paste your resume text')
  }

  let parsed
  try {
    parsed = await parseResume(source)
  } catch (err) {
    return aiErrorResponse(err)
  }

  let filePath: string | null = null
  if (upload) {
    filePath = `${userId}/${crypto.randomUUID()}.${upload.ext}`
    const { error } = await supabase.storage.from('resumes').upload(filePath, upload.bytes, {
      contentType: upload.contentType,
      upsert: false,
    })
    if (error) {
      console.error('[resume upload]', error.message)
      filePath = null // Parsing worked, so keep going without the original file.
    }
  }

  const makePrimary = form.get('make_primary') === 'true' || (existing ?? 0) === 0
  if (makePrimary) {
    await supabase.from('resumes').update({ is_primary: false }).eq('user_id', userId).eq('is_primary', true)
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      version_name: versionName,
      file_url: filePath,
      file_name: upload?.name ?? null,
      raw_text: parsed.rawText,
      parsed_data: parsed.parsed,
      is_primary: makePrimary,
    })
    .select('*')
    .single()

  if (error || !data) {
    if (filePath) await supabase.storage.from('resumes').remove([filePath])
    return jsonError('Could not save the resume', 500)
  }

  await recordUsage(supabase, userId, 'resume_parse')
  return NextResponse.json({ resume: data })
}
