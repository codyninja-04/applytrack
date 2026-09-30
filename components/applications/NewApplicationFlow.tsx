'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MatchResult } from '@/components/match/MatchResult'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { INDUSTRIES } from '@/lib/constants'
import { cn } from '@/lib/format'
import { api } from '@/lib/http'
import { looksFinancialSector } from '@/lib/passes/thresholds'
import type { Application, UserProfile } from '@/lib/types'

interface ResumeOption {
  id: string
  version_name: string
  is_primary: boolean
}

interface JDDetails {
  company_name: string | null
  role_title: string | null
  industry: string | null
  is_financial_sector: boolean
  salary_min: number | null
  salary_max: number | null
  job_description: string
}

const LOADING_LINES = [
  'Comparing your resume against this role...',
  'Pulling out what the JD actually requires...',
  'Checking which keywords an ATS would find...',
  'Weighing your experience against the level they want...',
  'Writing the honest verdict...',
]

export function NewApplicationFlow({
  resumes,
  profile,
  remaining,
}: {
  resumes: ResumeOption[]
  profile: Pick<UserProfile, 'work_pass_needed' | 'age' | 'current_monthly_salary_expectation'> | null
  remaining: number | null
}) {
  const router = useRouter()
  const [source, setSource] = useState<'paste' | 'url'>('paste')
  const [url, setUrl] = useState('')
  const [jd, setJd] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [industry, setIndustry] = useState('')
  const [financial, setFinancial] = useState(false)
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [resumeId, setResumeId] = useState(resumes.find((r) => r.is_primary)?.id ?? resumes[0]?.id ?? '')

  const [extracting, setExtracting] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [line, setLine] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Application | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    if (!analysing) return
    setLine(0)
    const t = setInterval(() => setLine((l) => Math.min(l + 1, LOADING_LINES.length - 1)), 3500)
    return () => clearInterval(t)
  }, [analysing])

  function applyDetails(d: JDDetails) {
    setJd(d.job_description)
    if (d.company_name) setCompany(d.company_name)
    if (d.role_title) setRole(d.role_title)
    if (d.industry) setIndustry(d.industry)
    setFinancial(d.is_financial_sector)
    if (d.salary_min) setSalaryMin(String(d.salary_min))
    if (d.salary_max) setSalaryMax(String(d.salary_max))
  }

  async function extract() {
    setExtracting(true)
    setError(null)
    try {
      const payload = source === 'url' ? { url } : { text: jd }
      const data = await api<{ details: JDDetails }>('/api/jd/extract', { method: 'POST', json: payload })
      applyDetails(data.details)
      if (source === 'url') setSource('paste')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the posting')
    } finally {
      setExtracting(false)
    }
  }

  async function analyse(e: React.FormEvent) {
    e.preventDefault()
    if (jd.trim().length < 150) return setError('Paste the full job description. Short snippets give meaningless scores.')
    if (!company.trim() || !role.trim()) return setError('Add the company and role title, or use auto-fill.')
    if (!resumeId) return setError('Pick a resume version')

    setAnalysing(true)
    setError(null)
    try {
      const data = await api<{ application: Application }>('/api/match/analyze', {
        method: 'POST',
        json: {
          resume_id: resumeId,
          job_description: jd,
          company_name: company,
          role_title: role,
          industry: industry || null,
          is_financial_sector: financial,
          job_posting_url: url || null,
          advertised_salary_min: salaryMin || null,
          advertised_salary_max: salaryMax || null,
        },
      })
      setResult(data.application)
      router.refresh()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalysing(false)
    }
  }

  async function act(kind: 'save' | 'skip') {
    if (!result) return
    setActing(kind)
    try {
      if (kind === 'skip') {
        await api(`/api/applications/${result.id}`, { method: 'PATCH', json: { status: 'skipped' } })
        router.push('/applications?skipped=1')
      } else {
        router.push(`/applications/${result.id}`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update')
      setActing(null)
    }
  }

  if (result) {
    return (
      <div className="space-y-5 animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Match analysis</p>
            <h2 className="mt-1 text-[22px] font-bold leading-tight">
              {result.role_title} <span className="font-medium text-muted">at {result.company_name}</span>
            </h2>
          </div>
          <button className="btn-ghost" onClick={() => setResult(null)}>
            Edit and re-run
          </button>
        </div>

        <MatchResult application={result} profile={profile} />

        <div className="card sticky bottom-3 z-10 flex flex-col gap-2 p-3 shadow-lift sm:flex-row sm:items-center sm:justify-between">
          <p className="px-2 text-[13px] text-muted">Saved in Researching. Decide what happens next.</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/applications/${result.id}/cover-letter`} className="btn-primary">
              Generate cover letter
            </Link>
            <button className="btn-secondary" onClick={() => act('save')} disabled={acting !== null}>
              {acting === 'save' && <Spinner />}
              Save to pipeline
            </button>
            <button className="btn-ghost hover:text-match-low" onClick={() => act('skip')} disabled={acting !== null}>
              {acting === 'skip' && <Spinner />}
              Don&apos;t apply, skip
            </button>
          </div>
        </div>
        {error && <Alert>{error}</Alert>}
      </div>
    )
  }

  const outOfCredits = remaining === 0

  return (
    <form onSubmit={analyse} className="space-y-5">
      <section className="card space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <StepDot n={1} />
          <h2 className="text-[16px] font-semibold">The job</h2>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-background p-1" role="tablist">
          {(['paste', 'url'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={source === m}
              onClick={() => setSource(m)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition',
                source === m ? 'bg-surface-2 text-text' : 'text-muted hover:text-text'
              )}
            >
              {m === 'paste' ? 'Paste description' : 'From a link'}
            </button>
          ))}
        </div>

        {source === 'url' ? (
          <div>
            <label className="label" htmlFor="jd-url">Job posting link</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="jd-url"
                type="url"
                className="input"
                placeholder="https://careers.company.com/jobs/123"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button type="button" className="btn-secondary shrink-0" onClick={extract} disabled={extracting || !url}>
                {extracting && <Spinner />}
                {extracting ? 'Fetching...' : 'Fetch posting'}
              </button>
            </div>
            <p className="mt-1.5 text-[12px] text-muted">
              Works for most company career pages and MyCareersFuture. LinkedIn blocks fetching, paste the text for those.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-1.5 flex items-end justify-between">
              <label className="label mb-0" htmlFor="jd">Job description</label>
              <button
                type="button"
                className="text-[12.5px] font-semibold text-primary hover:underline disabled:opacity-50"
                onClick={extract}
                disabled={extracting || jd.trim().length < 150}
              >
                {extracting ? 'Reading...' : 'Auto-fill details below'}
              </button>
            </div>
            <textarea
              id="jd"
              className="input min-h-[260px] text-[13.5px] leading-relaxed"
              placeholder="Paste the whole posting, including requirements and nice-to-haves"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            <p className="mt-1 text-right text-[12px] text-muted tabular-nums">{jd.length.toLocaleString()} characters</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="company">Company</label>
            <input id="company" className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="role">Role title</label>
            <input id="role" className="input" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="industry">Industry</label>
            <input
              id="industry"
              className="input"
              list="industries"
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value)
                setFinancial(looksFinancialSector(e.target.value))
              }}
            />
            <datalist id="industries">
              {INDUSTRIES.map((i) => (
                <option key={i} value={i} />
              ))}
            </datalist>
          </div>
          <div>
            <span className="label">Advertised monthly salary (SGD)</span>
            <div className="flex items-center gap-2">
              <input
                aria-label="Minimum salary"
                type="number"
                inputMode="numeric"
                className="input"
                placeholder="Min"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
              <span className="text-muted">to</span>
              <input
                aria-label="Maximum salary"
                type="number"
                inputMode="numeric"
                className="input"
                placeholder="Max"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-[14px]">
          <input type="checkbox" checked={financial} onChange={(e) => setFinancial(e.target.checked)} className="h-4 w-4 accent-primary" />
          Financial services employer (MOM uses a higher salary scale)
        </label>
      </section>

      <section className="card space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <StepDot n={2} />
          <h2 className="text-[16px] font-semibold">Your resume</h2>
        </div>
        <div className="max-w-[420px]">
          <label className="label" htmlFor="resume">Resume version</label>
          <select id="resume" className="input" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.version_name}
                {r.is_primary ? ' (default)' : ''}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && <Alert>{error}</Alert>}
      {outOfCredits && (
        <Alert tone="warning">You have used this month&apos;s free analyses. They reset on the 1st of next month.</Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="btn-primary py-3" disabled={analysing || outOfCredits}>
          {analysing && <Spinner />}
          {analysing ? LOADING_LINES[line] : 'Analyse match'}
        </button>
        {remaining !== null && !outOfCredits && (
          <p className="text-[13px] text-muted">
            {remaining} free {remaining === 1 ? 'analysis' : 'analyses'} left this month
          </p>
        )}
      </div>
    </form>
  )
}

function StepDot({ n }: { n: number }) {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-[13px] font-bold text-primary ring-1 ring-primary/30">
      {n}
    </span>
  )
}
