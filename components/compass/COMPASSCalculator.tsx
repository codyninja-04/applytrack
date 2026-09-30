'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { DEGREE_LABEL, INDUSTRIES, TIER_LABEL } from '@/lib/constants'
import { api } from '@/lib/http'
import { money } from '@/lib/format'
import { COMPASS_EXEMPT_SALARY, epQualifyingSalary, looksFinancialSector } from '@/lib/passes/thresholds'
import type { CompassEstimate, CompassInputs, DegreeType, UniversityTier } from '@/lib/types'
import { CompassDisclaimer, CriteriaBreakdown } from './CriteriaBreakdown'

export function COMPASSCalculator({
  defaults,
  applicationId,
}: {
  defaults: Partial<CompassInputs>
  applicationId?: string
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    offered_salary: defaults.offered_salary?.toString() ?? '',
    role_title: defaults.role_title ?? '',
    industry: defaults.industry ?? '',
    is_financial_sector: defaults.is_financial_sector ?? false,
    degree_type: (defaults.degree_type ?? 'bachelor') as DegreeType,
    university_tier: (defaults.university_tier ?? 'recognised') as UniversityTier,
    years_experience: defaults.years_experience?.toString() ?? '',
    age: defaults.age?.toString() ?? '',
    nationality: defaults.nationality ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompassEstimate | null>(null)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  // Instant, no-AI feedback on the one hard line: the EP qualifying salary.
  const age = Number(form.age) || null
  const salary = Number(form.offered_salary) || 0
  const threshold = epQualifyingSalary(age, form.is_financial_sector)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const data = await api<{ result: CompassEstimate }>('/api/compass/estimate', {
        method: 'POST',
        json: { ...form, application_id: applicationId },
      })
      setResult(data.result)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimate failed')
    } finally {
      setBusy(false)
    }
  }

  const isDegree = form.degree_type !== 'none' && form.degree_type !== 'diploma'

  return (
    <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
      <form onSubmit={submit} className="card h-fit space-y-4 p-5 sm:p-6">
        <div>
          <label className="label" htmlFor="c-salary">Offered or expected monthly salary (SGD)</label>
          <input id="c-salary" type="number" inputMode="numeric" className="input" value={form.offered_salary} onChange={(e) => set('offered_salary', e.target.value)} />
          {salary > 0 && (
            <p className={`mt-1.5 text-[12.5px] ${salary >= threshold ? 'text-match-high' : 'text-match-low'}`}>
              {salary >= COMPASS_EXEMPT_SALARY
                ? 'Above the COMPASS exemption line.'
                : salary >= threshold
                  ? `Clears the EP qualifying salary of about ${money(threshold)}${age ? ` at ${age}` : ''}.`
                  : `Below the EP qualifying salary of about ${money(threshold)}${age ? ` at ${age}` : ''}.`}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="c-role">Role title</label>
            <input id="c-role" className="input" value={form.role_title} onChange={(e) => set('role_title', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="c-industry">Industry</label>
            <select
              id="c-industry"
              className="input"
              value={form.industry}
              onChange={(e) => {
                set('industry', e.target.value)
                set('is_financial_sector', looksFinancialSector(e.target.value))
              }}
            >
              <option value="">Choose</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
              {form.industry && !INDUSTRIES.includes(form.industry) && <option value={form.industry}>{form.industry}</option>}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-[13.5px]">
          <input type="checkbox" checked={form.is_financial_sector} onChange={(e) => set('is_financial_sector', e.target.checked)} className="h-4 w-4 accent-primary" />
          Financial services (higher salary scale)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="c-degree">Qualification</label>
            <select id="c-degree" className="input" value={form.degree_type} onChange={(e) => set('degree_type', e.target.value as DegreeType)}>
              {(Object.keys(DEGREE_LABEL) as DegreeType[]).map((d) => (
                <option key={d} value={d}>
                  {DEGREE_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="c-tier">University tier</label>
            <select id="c-tier" className="input" value={form.university_tier} disabled={!isDegree} onChange={(e) => set('university_tier', e.target.value as UniversityTier)}>
              {(Object.keys(TIER_LABEL) as UniversityTier[]).map((t) => (
                <option key={t} value={t}>
                  {TIER_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="c-years">Years experience</label>
            <input id="c-years" type="number" className="input" value={form.years_experience} onChange={(e) => set('years_experience', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="c-age">Age</label>
            <input id="c-age" type="number" className="input" value={form.age} onChange={(e) => set('age', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="c-nat">Nationality</label>
          <input id="c-nat" className="input" placeholder="For context only" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
          <p className="mt-1 text-[12px] text-muted">Only used to explain C3. It is not shown anywhere else.</p>
        </div>
        {error && <Alert>{error}</Alert>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner />}
          {busy ? 'Estimating...' : 'Estimate'}
        </button>
      </form>

      <div>
        {result ? (
          <div className="animate-fade-up">
            <CriteriaBreakdown estimate={result} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-[16px] font-semibold">How COMPASS works, briefly</h2>
              <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-muted">
                <li>Four criteria score 0, 10 or 20 each. An EP needs 40 in total, not a pass on every one.</li>
                <li>Salary and qualifications come from you. Nationality diversity and local hiring come from the employer.</li>
                <li>Roles on the Shortage Occupation List can add a 20 point bonus.</li>
                <li>Above {money(COMPASS_EXEMPT_SALARY)} a month, COMPASS does not apply.</li>
                <li>S Pass is not assessed under COMPASS. It uses a salary floor and company quotas instead.</li>
              </ul>
            </div>
            <CompassDisclaimer />
          </div>
        )}
      </div>
    </div>
  )
}
