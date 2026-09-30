'use client'

import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/http'
import type { GapReport } from '@/lib/types'

/** Wording fixes: where the resume describes real work in words the JD does not use. */
export function LanguageSuggestions({ applicationId, initial }: { applicationId: string; initial: GapReport | null }) {
  const [report, setReport] = useState<GapReport | null>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  async function generate() {
    setBusy(true)
    setError(null)
    try {
      const data = await api<{ report: GapReport }>('/api/gaps/identify', { method: 'POST', json: { application_id: applicationId } })
      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate suggestions')
    } finally {
      setBusy(false)
    }
  }

  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(i)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // Clipboard can be blocked, the text is still selectable.
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Resume language vs JD language</h3>
          <p className="mt-1 max-w-[560px] text-[13px] leading-relaxed text-muted">
            Places where you describe real experience in words the posting does not use. Rewrites stay within what your
            original line says. Nothing here invents experience.
          </p>
        </div>
        <button className="btn-secondary" onClick={generate} disabled={busy}>
          {busy && <Spinner />}
          {busy ? 'Comparing wording...' : report ? 'Regenerate' : 'Find wording gaps'}
        </button>
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}

      {report && (
        <div className="mt-5 space-y-4 animate-fade-up">
          <p className="text-[14px] leading-relaxed">{report.summary}</p>

          <ol className="space-y-3">
            {report.suggestions.map((s, i) => (
              <li key={i} className="rounded-lg border border-border bg-background/60 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-primary">JD says: {s.jd_phrase}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="eyebrow mb-1">You wrote</p>
                    <p className="text-[13.5px] leading-relaxed text-muted">
                      {s.your_current_wording ?? <em>Nothing in your resume covers this.</em>}
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="eyebrow">Try</p>
                      <button className="text-[12px] font-semibold text-primary hover:underline" onClick={() => copy(s.suggested_rewrite, i)}>
                        {copied === i ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[13.5px] leading-relaxed">{s.suggested_rewrite}</p>
                  </div>
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{s.why}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-match-medium">Interview check: {s.honesty_check}</p>
              </li>
            ))}
          </ol>

          {report.do_not_claim.length > 0 && (
            <div className="rounded-lg border border-match-low/30 bg-match-low/10 p-4">
              <p className="text-[13px] font-semibold">Do not paper over these</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                The resume shows no evidence of them. Rewording will not fix this and an interviewer will find out.
              </p>
              <ul className="mt-2 list-inside list-disc text-[13px] leading-relaxed">
                {report.do_not_claim.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
