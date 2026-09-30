'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/format'
import { api } from '@/lib/http'

type Tone = 'direct' | 'warm' | 'formal'

const TONES: { id: Tone; label: string; hint: string }[] = [
  { id: 'direct', label: 'Direct', hint: 'Startups, tech' },
  { id: 'warm', label: 'Warm', hint: 'Mission-driven teams' },
  { id: 'formal', label: 'Formal', hint: 'Banks, GLCs, MNC HR' },
]

function words(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export function CoverLetterDraft({
  applicationId,
  companyName,
  initialLetter,
  initialPitch,
  needsSponsorship,
  passLabel,
}: {
  applicationId: string
  companyName: string
  initialLetter: string | null
  initialPitch: string | null
  needsSponsorship: boolean
  passLabel: string
}) {
  const router = useRouter()
  const [tone, setTone] = useState<Tone>('direct')
  const [letter, setLetter] = useState(initialLetter ?? '')
  const [pitch, setPitch] = useState(initialPitch ?? '')
  const [savedLetter, setSavedLetter] = useState(initialLetter ?? '')
  const [savedPitch, setSavedPitch] = useState(initialPitch ?? '')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'letter' | 'pitch' | null>(null)

  const dirty = letter !== savedLetter || pitch !== savedPitch
  const count = words(letter)
  const pitchInLetter = Boolean(savedPitch) && letter.includes(savedPitch)

  async function generate() {
    if (letter && dirty && !confirm('Replace your edited draft with a new one?')) return
    setGenerating(true)
    setError(null)
    try {
      const data = await api<{ cover_letter_draft: string; sponsorship_pitch: string | null }>('/api/cover-letter/generate', {
        method: 'POST',
        json: { application_id: applicationId, tone },
      })
      setLetter(data.cover_letter_draft)
      setPitch(data.sponsorship_pitch ?? '')
      setSavedLetter(data.cover_letter_draft)
      setSavedPitch(data.sponsorship_pitch ?? '')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not write the letter')
    } finally {
      setGenerating(false)
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await api(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        json: { cover_letter_draft: letter, sponsorship_pitch: pitch },
      })
      setSavedLetter(letter)
      setSavedPitch(pitch)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  /** Swaps the old sponsorship paragraph in the letter for the edited one. */
  function pushPitchIntoLetter() {
    if (!savedPitch || !letter.includes(savedPitch)) return
    setLetter((l) => l.replace(savedPitch, pitch))
    setSavedPitch(pitch)
  }

  async function copy(which: 'letter' | 'pitch') {
    try {
      await navigator.clipboard.writeText(which === 'letter' ? letter : pitch)
      setCopied(which)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      setError('Copy was blocked by the browser. Select the text and copy it manually.')
    }
  }

  function download() {
    const blob = new Blob([letter], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `Cover letter - ${companyName}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5">
      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label">Tone</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tone">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={tone === t.id}
                onClick={() => setTone(t.id)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition',
                  tone === t.id ? 'border-primary bg-primary/10' : 'border-border hover:border-slate-500'
                )}
              >
                <span className="block text-[13.5px] font-semibold">{t.label}</span>
                <span className="block text-[11.5px] text-muted">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary" onClick={generate} disabled={generating}>
          {generating && <Spinner />}
          {generating ? 'Writing...' : letter ? 'Regenerate' : 'Generate cover letter'}
        </button>
      </section>

      {error && <Alert>{error}</Alert>}

      {!letter && !generating && (
        <div className="card p-6 text-[14px] leading-relaxed text-muted">
          The letter uses your resume, the strengths from the match analysis and the job description.
          {needsSponsorship
            ? ` It includes one paragraph making the case for your ${passLabel}, framed around what you bring rather than asking for a favour.`
            : ' Sponsorship is not mentioned since you do not need a pass.'}{' '}
          It stays under 300 words and never opens with &quot;I am writing to apply&quot;.
        </div>
      )}

      {(letter || generating) && (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold">Full letter</h2>
              <span className={cn('text-[12px] tabular-nums', count > 300 ? 'text-match-medium' : 'text-muted')}>
                {count} words{count > 300 ? ', over 300' : ''}
              </span>
            </div>
            {generating && !letter ? (
              <div className="space-y-2.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="skeleton h-4" style={{ width: `${70 + ((i * 13) % 30)}%` }} />
                ))}
              </div>
            ) : (
              <textarea
                aria-label="Cover letter"
                className="input min-h-[460px] font-[450] leading-[1.7]"
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
              />
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={save} disabled={saving || !dirty}>
                {saving && <Spinner />}
                {dirty ? 'Save changes' : 'Saved'}
              </button>
              <button className="btn-secondary" onClick={() => copy('letter')} disabled={!letter}>
                {copied === 'letter' ? 'Copied' : 'Copy'}
              </button>
              <button className="btn-ghost" onClick={download} disabled={!letter}>
                Download .txt
              </button>
            </div>
          </section>

          {needsSponsorship && (
            <section className="h-fit rounded-xl border border-sponsorship/40 bg-sponsorship/[0.07] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-sponsorship">Sponsorship paragraph</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                Kept separate so you can reuse it in emails and recruiter messages, or tune it on its own.
              </p>
              <textarea
                aria-label="Sponsorship paragraph"
                className="input mt-3 min-h-[220px] border-sponsorship/30 leading-relaxed"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="Generate a letter to get a sponsorship paragraph"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-secondary" onClick={() => copy('pitch')} disabled={!pitch}>
                  {copied === 'pitch' ? 'Copied' : 'Copy paragraph'}
                </button>
                {pitchInLetter && pitch !== savedPitch && (
                  <button className="btn-ghost" onClick={pushPitchIntoLetter}>
                    Update in letter
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
