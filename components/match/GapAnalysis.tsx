export function SkillsMatch({ matched, missing }: { matched: string[]; missing: string[] }) {
  return (
    <section className="card p-5">
      <h3 className="text-[15px] font-semibold">Skills match</h3>
      <p className="mt-1 text-[13px] text-muted">
        {matched.length} of {matched.length + missing.length} skills the role asks for
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {matched.map((s) => (
          <span key={`m-${s}`} className="chip bg-skill-matched/15 text-match-high ring-1 ring-skill-matched/30">
            <Check /> {s}
          </span>
        ))}
        {missing.map((s) => (
          <span key={`x-${s}`} className="chip bg-skill-missing/15 text-match-low ring-1 ring-skill-missing/30">
            <Cross /> {s}
          </span>
        ))}
      </div>
    </section>
  )
}

export function GapAnalysis({ strengths, gaps }: { strengths: string[]; gaps: string[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="card p-5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold">
          <span className="h-2 w-2 rounded-full bg-match-high" /> Strengths for this role
        </h3>
        <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed">
          {strengths.length === 0 && <li className="text-muted">Nothing that stands out for this specific role.</li>}
          {strengths.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-match-high" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="card p-5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold">
          <span className="h-2 w-2 rounded-full bg-match-low" /> Gaps
        </h3>
        <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed">
          {gaps.length === 0 && <li className="text-muted">No real gaps flagged.</li>}
          {gaps.map((g, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-match-low" />
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="mr-1 h-3 w-3" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Cross() {
  return (
    <svg viewBox="0 0 16 16" className="mr-1 h-3 w-3" aria-hidden="true">
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
