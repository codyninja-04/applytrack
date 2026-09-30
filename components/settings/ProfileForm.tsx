'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { DEGREE_LABEL, INDUSTRIES, PASS_LABEL, TIER_LABEL } from '@/lib/constants'
import { api } from '@/lib/http'
import { cn } from '@/lib/format'
import type { DegreeType, UniversityTier, UserProfile, WorkPassNeeded } from '@/lib/types'

const PASS_HELP: Record<WorkPassNeeded, string> = {
  ep: 'Professionals, managers, executives. Assessed under COMPASS.',
  s_pass: 'Mid-skilled roles. Company quota applies, no COMPASS.',
  either: 'Open to both. We check EP first, then S Pass.',
  none_have_pr_citizen: 'No sponsorship. Sponsorship features switch off.',
}

export function ProfileForm({
  profile,
  mode,
}: {
  profile: UserProfile | null
  mode: 'onboarding' | 'settings'
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    display_name: profile?.display_name ?? '',
    nationality: profile?.nationality ?? '',
    work_pass_needed: (profile?.work_pass_needed ?? 'ep') as WorkPassNeeded,
    age: profile?.age?.toString() ?? '',
    years_experience: profile?.years_experience?.toString() ?? '',
    degree_type: (profile?.degree_type ?? 'bachelor') as DegreeType,
    university_tier: (profile?.university_tier ?? 'recognised') as UniversityTier,
    field_of_study: profile?.field_of_study ?? '',
    target_industry: profile?.target_industry ?? '',
    current_monthly_salary_expectation: profile?.current_monthly_salary_expectation?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.age || !form.years_experience) {
      setError('Age and years of experience drive the salary thresholds, so both are needed.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api('/api/profile', {
        method: 'PATCH',
        json: { ...form, onboarding_complete: mode === 'onboarding' ? true : undefined },
      })
      if (mode === 'onboarding') {
        router.push('/resume/upload?first=1')
      } else {
        setSaved(true)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const isDegree = form.degree_type !== 'none' && form.degree_type !== 'diploma'

  return (
    <form onSubmit={submit} className="space-y-7">
      <fieldset className="space-y-3">
        <legend className="mb-3 text-[15px] font-semibold">Which pass do you need?</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(Object.keys(PASS_LABEL) as WorkPassNeeded[]).map((p) => (
            <label
              key={p}
              className={cn(
                'cursor-pointer rounded-lg border p-3.5 transition',
                form.work_pass_needed === p ? 'border-primary bg-primary/10' : 'border-border hover:border-slate-500'
              )}
            >
              <input
                type="radio"
                name="pass"
                value={p}
                checked={form.work_pass_needed === p}
                onChange={() => set('work_pass_needed', p)}
                className="sr-only"
              />
              <span className="block text-[14px] font-semibold">{PASS_LABEL[p]}</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{PASS_HELP[p]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="display_name">Name on your cover letters</label>
          <input id="display_name" className="input" value={form.display_name} onChange={(e) => set('display_name', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="nationality">Nationality</label>
          <input
            id="nationality"
            className="input"
            placeholder="Only used for COMPASS context"
            value={form.nationality}
            onChange={(e) => set('nationality', e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="age">Age</label>
          <input id="age" type="number" inputMode="numeric" min={16} max={80} className="input" value={form.age} onChange={(e) => set('age', e.target.value)} />
          <p className="mt-1 text-[12px] text-muted">EP and S Pass minimum salaries rise with age.</p>
        </div>
        <div>
          <label className="label" htmlFor="years">Years of full-time experience</label>
          <input id="years" type="number" inputMode="numeric" min={0} max={60} className="input" value={form.years_experience} onChange={(e) => set('years_experience', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="degree">Highest qualification</label>
          <select id="degree" className="input" value={form.degree_type} onChange={(e) => set('degree_type', e.target.value as DegreeType)}>
            {(Object.keys(DEGREE_LABEL) as DegreeType[]).map((d) => (
              <option key={d} value={d}>{DEGREE_LABEL[d]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="tier">University tier</label>
          <select
            id="tier"
            className="input"
            value={form.university_tier}
            disabled={!isDegree}
            onChange={(e) => set('university_tier', e.target.value as UniversityTier)}
          >
            {(Object.keys(TIER_LABEL) as UniversityTier[]).map((t) => (
              <option key={t} value={t}>{TIER_LABEL[t]}</option>
            ))}
          </select>
          <p className="mt-1 text-[12px] text-muted">Top-tier means on MOM&apos;s COMPASS list, not just well ranked.</p>
        </div>
        <div>
          <label className="label" htmlFor="field">Field of study</label>
          <input id="field" className="input" placeholder="Computer Science" value={form.field_of_study} onChange={(e) => set('field_of_study', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="industry">Target industry</label>
          <select id="industry" className="input" value={form.target_industry} onChange={(e) => set('target_industry', e.target.value)}>
            <option value="">Any</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="salary">Monthly salary you are aiming for (SGD)</label>
          <input
            id="salary"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            className="input sm:max-w-[260px]"
            placeholder="6500"
            value={form.current_monthly_salary_expectation}
            onChange={(e) => set('current_monthly_salary_expectation', e.target.value)}
          />
          <p className="mt-1 text-[12px] text-muted">Used to flag roles that pay below what you want.</p>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Spinner />}
          {mode === 'onboarding' ? 'Continue to resume upload' : 'Save profile'}
        </button>
        {saved && <span className="text-[13px] text-match-high">Saved</span>}
      </div>
    </form>
  )
}
