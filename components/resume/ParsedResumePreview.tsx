import type { ParsedResume } from '@/lib/types'

export function ParsedResumePreview({ data }: { data: ParsedResume }) {
  return (
    <div className="space-y-6 text-[14px]">
      <section>
        {data.name && <p className="text-[17px] font-semibold">{data.name}</p>}
        {data.headline && <p className="text-muted">{data.headline}</p>}
        <p className="mt-2 leading-relaxed text-muted">{data.summary}</p>
        {data.total_years_experience !== null && (
          <p className="mt-2 text-[13px] text-muted">
            Read as <span className="font-semibold text-text">{data.total_years_experience} years</span> of full-time
            experience. If that looks wrong, your resume dates may be ambiguous to recruiters too.
          </p>
        )}
      </section>

      {data.skills.length > 0 && (
        <section>
          <p className="eyebrow mb-2">Skills picked up ({data.skills.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s) => (
              <span key={s} className="chip bg-surface-2 text-text ring-1 ring-border">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {data.experience.length > 0 && (
        <section>
          <p className="eyebrow mb-2">Experience</p>
          <ol className="space-y-4">
            {data.experience.map((e, i) => (
              <li key={`${e.company}-${i}`} className="border-l-2 border-border pl-3.5">
                <p className="font-semibold">
                  {e.title} <span className="font-normal text-muted">at {e.company}</span>
                </p>
                <p className="text-[12.5px] text-muted">
                  {[e.start, e.end ?? 'Present'].filter(Boolean).join(' to ')}
                </p>
                {e.highlights.length > 0 && (
                  <ul className="mt-1.5 space-y-1 text-muted">
                    {e.highlights.map((h, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {data.education.length > 0 && (
          <section>
            <p className="eyebrow mb-2">Education</p>
            <ul className="space-y-2">
              {data.education.map((e, i) => (
                <li key={i}>
                  <p className="font-medium">{e.qualification}</p>
                  <p className="text-[13px] text-muted">
                    {e.institution}
                    {e.year ? `, ${e.year}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {data.projects.length > 0 && (
          <section>
            <p className="eyebrow mb-2">Projects</p>
            <ul className="space-y-2">
              {data.projects.map((p, i) => (
                <li key={i}>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-[13px] leading-snug text-muted">{p.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {data.certifications.length > 0 && (
        <section>
          <p className="eyebrow mb-2">Certifications</p>
          <p className="text-muted">{data.certifications.join(', ')}</p>
        </section>
      )}
    </div>
  )
}
