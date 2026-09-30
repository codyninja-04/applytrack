'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'
import { longDate } from '@/lib/format'
import { api } from '@/lib/http'
import type { Resume } from '@/lib/types'
import { ParsedResumePreview } from './ParsedResumePreview'

export function ResumeVersionCard({ resume, usage }: { resume: Resume; usage: { count: number; avg: number | null } }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(resume.version_name)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parsed = resume.parsed_data

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label)
    setError(null)
    try {
      await fn()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const rename = () =>
    run('rename', async () => {
      await api(`/api/resume/${resume.id}`, { method: 'PATCH', json: { version_name: name } })
      setEditing(false)
    })

  const makePrimary = () => run('primary', () => api(`/api/resume/${resume.id}`, { method: 'PATCH', json: { is_primary: true } }))

  const remove = () => {
    if (!confirm(`Delete "${resume.version_name}"? Applications that used it keep their scores.`)) return
    run('delete', () => api(`/api/resume/${resume.id}`, { method: 'DELETE' }))
  }

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input className="input py-1.5" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoFocus />
              <button className="btn-primary px-3 py-1.5" onClick={rename} disabled={busy !== null}>
                Save
              </button>
              <button
                className="btn-ghost px-3 py-1.5"
                onClick={() => {
                  setEditing(false)
                  setName(resume.version_name)
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="truncate text-company">{resume.version_name}</h2>
              {resume.is_primary && <span className="chip bg-primary/15 text-primary ring-1 ring-primary/30">Default</span>}
            </div>
          )}
          <p className="mt-1 text-[13px] text-muted">
            Added {longDate(resume.created_at)}
            {resume.file_name ? ` from ${resume.file_name}` : ' from pasted text'}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {!resume.is_primary && (
            <button className="btn-ghost px-3 py-1.5 text-[13px]" onClick={makePrimary} disabled={busy !== null}>
              {busy === 'primary' && <Spinner className="h-3.5 w-3.5" />}
              Make default
            </button>
          )}
          {!editing && (
            <button className="btn-ghost px-3 py-1.5 text-[13px]" onClick={() => setEditing(true)}>
              Rename
            </button>
          )}
          {resume.file_url && (
            <a className="btn-ghost px-3 py-1.5 text-[13px]" href={`/api/resume/${resume.id}`} target="_blank" rel="noreferrer">
              Original
            </a>
          )}
          <button className="btn-ghost px-3 py-1.5 text-[13px] hover:text-match-low" onClick={remove} disabled={busy !== null}>
            {busy === 'delete' && <Spinner className="h-3.5 w-3.5" />}
            Delete
          </button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Skills found" value={parsed?.skills.length ?? 0} />
        <Stat label="Roles" value={parsed?.experience.length ?? 0} />
        <Stat label="Used in" value={`${usage.count} ${usage.count === 1 ? 'role' : 'roles'}`} />
        <Stat label="Avg match" value={usage.avg === null ? '-' : `${usage.avg}%`} />
      </dl>

      {error && <p className="mt-3 text-[13px] text-match-low">{error}</p>}

      {parsed && (
        <div className="mt-4 border-t border-border pt-4">
          <button className="text-[13px] font-semibold text-primary hover:underline" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? 'Hide what we parsed' : 'Show what we parsed'}
          </button>
          {open && (
            <div className="mt-4 animate-fade-up">
              <ParsedResumePreview data={parsed} />
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-background/60 px-3 py-2.5">
      <dt className="text-[11.5px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
