import { MATCH_HEX, matchTier } from '@/lib/constants'
import type { KeywordCoverage as Coverage } from '@/lib/types'

export function KeywordCoverage({ coverage }: { coverage: Coverage }) {
  const tier = matchTier(coverage.percent) ?? 'low'
  const total = coverage.found.length + coverage.missing.length

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-semibold">Keyword coverage</h3>
        <p className="text-[12px] text-muted">Exact match, the way an ATS scans</p>
      </div>
      <p className="mt-3 text-[14px] text-muted">
        <span className="text-[22px] font-bold tabular-nums text-text">{coverage.percent}%</span> of JD keywords appear in
        your resume ({coverage.found.length} of {total})
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
        <div className="h-full rounded-full" style={{ width: `${coverage.percent}%`, background: MATCH_HEX[tier] }} />
      </div>

      {coverage.must_have_missing.length > 0 && (
        <p className="mt-4 rounded-lg border border-match-low/30 bg-match-low/10 px-3 py-2 text-[13px] leading-relaxed">
          <span className="font-semibold">Required and missing:</span> {coverage.must_have_missing.join(', ')}. If you have
          this experience, use these exact words. If you do not, a keyword filter will likely drop you.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-2">In your resume</p>
          <div className="flex flex-wrap gap-1.5">
            {coverage.found.length === 0 && <span className="text-[13px] text-muted">None</span>}
            {coverage.found.map((k) => (
              <span key={k} className="chip bg-skill-matched/15 text-match-high ring-1 ring-skill-matched/30">
                {k}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-2">Not in your resume</p>
          <div className="flex flex-wrap gap-1.5">
            {coverage.missing.length === 0 && <span className="text-[13px] text-muted">None</span>}
            {coverage.missing.map((k) => (
              <span key={k} className="chip bg-skill-missing/15 text-match-low ring-1 ring-skill-missing/30">
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
