'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/http'

interface ResumeOption {
  id: string
  version_name: string
  is_primary: boolean
}

/**
 * Re-runs the match, usually against a different resume version to see which
 * one fits a role better. Also where a manually added application gets its
 * first analysis.
 */
export function ReanalyzePanel({
  applicationId,
  resumes,
  currentResumeId,
  jobDescription,
  hasAnalysis,
  remaining,
}: {
  applicationId: string
  resumes: ResumeOption[]
  currentResumeId: string | null
  jobDescription: string
  hasAnalysis: boolean
  remaining: number | null
}) {
  const router = useRouter()
  const [resumeId, setResumeId] = useState(currentResumeId ?? resumes.find((r) => r.is_primary)?.id ?? resumes[0]?.id ?? '')
  const [jd, setJd] = useState(jobDescription)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsJd = jobDescription.trim().length < 150

  async function run() {
    if (!resumeId) return setError('Upload a resume first')
    if (jd.trim().length < 150) return setError('Paste the full job description first')
    setBusy(true)
    setError(null)
    try {
      await api('/api/match/analyze', {
        method: 'POST',
        json: {
          application_id: applicationId,
          resume_id: resumeId,
          job_description: needsJd ? jd : undefined,
        },
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card space-y-4 p-5">
      <div>
        <h3 className="text-[15px] font-semibold">{hasAnalysis ? 'Try another resume version' : 'Run the match analysis'}</h3>
        <p className="mt-1 text-[13px] text-muted">
          {hasAnalysis ? 'Re-scores this role and replaces the analysis above.' : 'Scores your resume against this posting.'}
          {remaining !== null && ` ${remaining} free left this month.`}
        </p>
      </div>
      {needsJd && (
        <div>
          <label className="label" htmlFor="jd-re">Job description</label>
          <textarea id="jd-re" className="input min-h-[200px] text-[13.5px]" value={jd} onChange={(e) => setJd(e.target.value)} />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <select aria-label="Resume version" className="input sm:max-w-[320px]" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.version_name}
              {r.id === currentResumeId ? ' (used last time)' : r.is_primary ? ' (default)' : ''}
            </option>
          ))}
        </select>
        <button className="btn-primary shrink-0" onClick={run} disabled={busy || remaining === 0 || resumes.length === 0}>
          {busy && <Spinner />}
          {busy ? 'Analysing...' : hasAnalysis ? 'Re-run analysis' : 'Analyse match'}
        </button>
      </div>
      {error && <Alert>{error}</Alert>}
    </section>
  )
}
