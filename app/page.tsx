import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { MatchScoreGauge } from '@/components/match/MatchScoreGauge'
import { LEGAL_DISCLAIMER } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

const FEATURES = [
  {
    title: 'A score that says skip',
    body: 'Your resume against the actual JD: skills, level, and the exact keywords an ATS filters on. When a role is a 35, it tells you so and tells you why.',
  },
  {
    title: 'Salary against the pass line',
    body: 'Every role is checked against the EP or S Pass qualifying salary for your age and sector. No point tailoring for a job that cannot sponsor you at that pay.',
  },
  {
    title: 'COMPASS, with the honest caveat',
    body: 'An estimate of the points your salary and degree earn, and how many the employer has to bring. You control 2 of 4 factors, and the page says so.',
  },
  {
    title: 'The sponsorship paragraph',
    body: 'Cover letters that make the case for your pass in one confident paragraph, framed around what you bring. Kept separate so you can reuse it.',
  },
]

const STEPS = [
  ['Upload your resume', 'PDF, Word or pasted text. Keep a version per direction you are applying in.'],
  ['Paste the job', 'The whole posting, or a link to a careers page. Company, role and pay are pulled out for you.'],
  ['Decide in a minute', 'Apply, tailor first, or skip. Everything lands on a board so you can see what converts.'],
]

export default async function LandingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]"
      />

      <header className="relative mx-auto flex max-w-[1140px] items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/dashboard" className="btn-primary">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative">
        <section className="mx-auto grid max-w-[1140px] items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div className="animate-fade-up">
            <p className="eyebrow text-primary">For S Pass and EP candidates in Singapore</p>
            <h1 className="mt-4 text-[40px] font-extrabold leading-[1.05] tracking-[-0.025em] sm:text-[54px]">
              Know if a role is worth your hour before you spend it.
            </h1>
            <p className="mt-5 max-w-[520px] text-[16px] leading-relaxed text-muted">
              You are competing against local candidates who do not need sponsorship. ApplyTrack scores your resume against
              each job, checks the salary against your pass threshold, and tells you plainly when to move on.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={user ? '/applications/new' : '/signup'} className="btn-primary px-5 py-3 text-[15px]">
                Score a job description
              </Link>
              <a href="#how" className="btn-secondary px-5 py-3 text-[15px]">
                How it works
              </a>
            </div>
            <p className="mt-4 text-[13px] text-muted">5 free analyses a month. No card needed.</p>
          </div>

          {/* A static example of the result screen, so people see the tone before signing up. */}
          <div className="card relative p-6 shadow-lift" aria-label="Example analysis">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-muted">Example analysis</p>
                <p className="text-company">Senior Backend Engineer</p>
              </div>
              <span className="chip bg-match-low/15 text-match-low ring-1 ring-match-low/30">SKIP THIS ONE</span>
            </div>
            <div className="mt-4 flex justify-center">
              <MatchScoreGauge score={38} size={180} />
            </div>
            <div className="mt-5 rounded-lg border-l-4 border-primary bg-background/70 px-4 py-3">
              <p className="eyebrow mb-1">Honest verdict</p>
              <p className="text-verdict">
                Skip this one. They want 6+ years owning distributed systems in production and your backend work is two
                years of CRUD APIs. Put the hour into the mid-level roles where you scored 70+.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="chip bg-skill-matched/15 text-match-high ring-1 ring-skill-matched/30">Python</span>
              <span className="chip bg-skill-matched/15 text-match-high ring-1 ring-skill-matched/30">PostgreSQL</span>
              <span className="chip bg-skill-missing/15 text-match-low ring-1 ring-skill-missing/30">Kafka</span>
              <span className="chip bg-skill-missing/15 text-match-low ring-1 ring-skill-missing/30">Kubernetes</span>
              <span className="chip bg-skill-missing/15 text-match-low ring-1 ring-skill-missing/30">System design</span>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-surface/40">
          <div className="mx-auto grid max-w-[1140px] gap-px px-5 py-16 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-5">
                <h2 className="text-[17px] font-semibold">{f.title}</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-[1140px] px-5 py-20">
          <h2 className="text-[28px] font-bold tracking-[-0.01em]">How it works</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="card p-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-[14px] font-bold text-primary ring-1 ring-primary/30">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-[16px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-[1140px] px-5 pb-20">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card p-6">
              <p className="eyebrow">Free</p>
              <p className="mt-2 text-[32px] font-bold">$0</p>
              <ul className="mt-4 space-y-2 text-[14px] text-muted">
                <li>5 match analyses a month</li>
                <li>Salary threshold checks</li>
                <li>Application board</li>
              </ul>
            </div>
            <div className="card border-primary/50 p-6">
              <p className="eyebrow text-primary">Pro</p>
              <p className="mt-2 text-[32px] font-bold">
                $10<span className="text-[15px] font-medium text-muted"> / month</span>
              </p>
              <ul className="mt-4 space-y-2 text-[14px] text-muted">
                <li>Unlimited match analysis</li>
                <li>COMPASS estimator</li>
                <li>Sponsorship-aware cover letters</li>
                <li>Multiple resume versions and trend analytics</li>
              </ul>
            </div>
          </div>
          <p className="mt-6 text-[13px] leading-relaxed text-muted">
            What ApplyTrack will never do: apply to jobs for you, scrape LinkedIn, or promise you a pass.
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1140px] px-5 py-8">
          <p className="text-[12px] leading-relaxed text-muted/80">{LEGAL_DISCLAIMER}</p>
        </div>
      </footer>
    </div>
  )
}
