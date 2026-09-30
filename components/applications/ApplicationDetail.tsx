'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { ALL_STATUSES, MATCH_BADGE, RECOMMENDATION_META, STATUS_META } from '@/lib/constants'
import { cn, daysSince, longDate, relativeDays } from '@/lib/format'
import { api } from '@/lib/http'
import type { Application, ApplicationStatus } from '@/lib/types'

export function ApplicationDetail({ app }: { app: Application }) {
  const router = useRouter()
  const [form, setForm] = useState({
    status: app.status,
    applied_date: app.applied_date ?? '',
    job_posting_url: app.job_posting_url ?? '',
    advertised_salary_min: app.advertised_salary_min?.toString() ?? '',
    advertised_salary_max: app.advertised_salary_max?.toString() ?? '',
    notes: app.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [showJd, setShowJd] = useState(false)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await api(`/api/applications/${app.id}`, {
        method: 'PATCH',
        json: { ...form, applied_date: form.applied_date || null },
      })
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm(`Delete ${app.role_title} at ${app.company_name}? This also removes its match analysis and cover letter.`)) return
    setDeleting(true)
    try {
      await api(`/api/applications/${app.id}`, { method: 'DELETE' })
      router.push('/applications')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete')
      setDeleting(false)
    }
  }

  const b = app.match_breakdown
  const days = daysSince(app.applied_date)
  const rec = b ? RECOMMENDATION_META[b.recommendation] : null

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {b && rec ? (
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={cn('chip uppercase tracking-[0.04em] ring-1', MATCH_BADGE[rec.tone])}>{rec.label}</span>
              <span className="text-[12px] text-muted">Analysed {longDate(app.match_analyzed_at)}</span>
            </div>
            <div className="mt-4 rounded-lg border-l-4 border-primary bg-background/70 px-4 py-3.5">
              <p className="eyebrow mb-1.5">Honest verdict</p>
              <p className="text-verdict">{b.honest_verdict}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/applications/${app.id}/match`} className="btn-secondary">
                Full breakdown
              </Link>
              <Link href={`/applications/${app.id}/cover-letter`} className="btn-secondary">
                {app.cover_letter_draft ? 'Edit cover letter' : 'Write cover letter'}
              </Link>
            </div>
          </section>
        ) : (
          <section className="card p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold">No match analysis yet</h2>
            <p className="mt-1 text-[14px] text-muted">
              Added manually. Run an analysis from the match tab once the job description is in.
            </p>
            <Link href={`/applications/${app.id}/match`} className="btn-primary mt-4">
              Analyse match
            </Link>
          </section>
        )}

        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Job description</h2>
            <button className="text-[13px] font-semibold text-primary hover:underline" onClick={() => setShowJd((v) => !v)}>
              {showJd ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <div
            className={cn(
              'mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted',
              !showJd && 'max-h-[160px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]'
            )}
          >
            {app.job_description || 'No description saved.'}
          </div>
          {app.job_posting_url && (
            <a href={app.job_posting_url} target="_blank" rel="noreferrer noopener" className="mt-3 inline-block text-[13px] font-semibold text-primary hover:underline">
              Open original posting
            </a>
          )}
        </section>
      </div>

      <aside className="space-y-5">
        <section className="card space-y-4 p-5">
          <h2 className="text-[15px] font-semibold">Tracking</h2>
          {days !== null && <p className="text-[13px] text-muted">Applied {relativeDays(days)}</p>}
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="input" value={form.status} onChange={(e) => set('status', e.target.value as ApplicationStatus)}>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="applied">Applied on</label>
            <input id="applied" type="date" className="input" value={form.applied_date} onChange={(e) => set('applied_date', e.target.value)} />
          </div>
          <div>
            <span className="label">Monthly salary (SGD)</span>
            <div className="flex items-center gap-2">
              <input aria-label="Minimum" type="number" className="input" placeholder="Min" value={form.advertised_salary_min} onChange={(e) => set('advertised_salary_min', e.target.value)} />
              <input aria-label="Maximum" type="number" className="input" placeholder="Max" value={form.advertised_salary_max} onChange={(e) => set('advertised_salary_max', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="url">Posting link</label>
            <input id="url" type="url" className="input" value={form.job_posting_url} onChange={(e) => set('job_posting_url', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              className="input min-h-[110px]"
              placeholder="Recruiter name, what they said about pass sponsorship, interview dates"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
          {error && <Alert>{error}</Alert>}
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving && <Spinner />}
              Save
            </button>
            {saved && <span className="text-[13px] text-match-high">Saved</span>}
          </div>
        </section>

        <button className="btn-danger w-full" onClick={remove} disabled={deleting}>
          {deleting && <Spinner />}
          Delete application
        </button>
      </aside>
    </div>
  )
}
