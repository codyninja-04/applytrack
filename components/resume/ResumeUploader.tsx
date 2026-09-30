'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/format'
import type { Resume } from '@/lib/types'
import { ParsedResumePreview } from './ParsedResumePreview'

const ACCEPT = '.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'

export function ResumeUploader({ hasExisting }: { hasExisting: boolean }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'file' | 'paste'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [name, setName] = useState(hasExisting ? '' : 'General')
  const [primary, setPrimary] = useState(!hasExisting)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<Resume | null>(null)

  function pick(f: File | undefined | null) {
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      setError('Keep the file under 5 MB')
      return
    }
    setError(null)
    setFile(f)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Give this version a name')
    if (mode === 'file' && !file) return setError('Choose a file first')
    if (mode === 'paste' && text.trim().length < 200) return setError('Paste the full resume text')

    const body = new FormData()
    body.set('version_name', name)
    body.set('make_primary', String(primary))
    if (mode === 'file' && file) body.set('file', file)
    else body.set('text', text)

    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/resume/parse', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setSaved(data.resume)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  if (saved?.parsed_data) {
    return (
      <div className="space-y-5 animate-fade-up">
        <Alert tone="info">
          Saved as <strong>{saved.version_name}</strong>. Check what we read below. Anything missing here is
          probably invisible to an ATS as well.
        </Alert>
        <div className="card p-5 sm:p-6">
          <ParsedResumePreview data={saved.parsed_data} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/applications/new" className="btn-primary">
            Analyse a job with it
          </Link>
          <Link href="/resume" className="btn-secondary">
            Back to resumes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="card space-y-6 p-5 sm:p-7">
      <div className="inline-flex rounded-lg border border-border bg-background p-1" role="tablist">
        {(['file', 'paste'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition',
              mode === m ? 'bg-surface-2 text-text' : 'text-muted hover:text-text'
            )}
          >
            {m === 'file' ? 'Upload a file' : 'Paste text'}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            pick(e.dataTransfer.files[0])
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          className={cn(
            'flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition',
            dragging ? 'border-primary bg-primary/10' : 'border-border hover:border-slate-500'
          )}
        >
          <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          {file ? (
            <>
              <p className="text-[15px] font-semibold">{file.name}</p>
              <p className="mt-1 text-[13px] text-muted">{(file.size / 1024).toFixed(0)} KB. Click to choose a different file.</p>
            </>
          ) : (
            <>
              <p className="text-[15px] font-semibold">Drop your resume here</p>
              <p className="mt-1 text-[13px] text-muted">PDF, DOCX or TXT, up to 5 MB</p>
            </>
          )}
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="resume-text">Resume text</label>
          <textarea
            id="resume-text"
            className="input min-h-[280px] font-mono text-[13px] leading-relaxed"
            placeholder="Paste the full text of your resume"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="version">Version name</label>
          <input
            id="version"
            className="input"
            placeholder="Backend focused, Data roles, General"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-[14px]">
          <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} className="h-4 w-4 accent-primary" />
          Use as my default resume
        </label>
      </div>

      {error && <Alert>{error}</Alert>}

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy && <Spinner />}
        {busy ? 'Reading your resume...' : 'Upload and parse'}
      </button>
    </form>
  )
}
