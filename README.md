# ApplyTrack

Resume and job description matching for people applying to Singapore roles on an S Pass or Employment Pass.

Generic job trackers treat every application the same. If you need sponsorship you are already competing against local candidates, so the question that matters is whether a role is worth an hour of tailoring at all. ApplyTrack answers that before you spend the hour:

- **Match score with an honest verdict.** Your resume against the actual JD: skills, level, and whether your work really shows what they want. It says "skip" when it should.
- **Keyword coverage counted in code.** The model picks the terms an ATS would scan for, then we check the resume text literally, so "62% of JD keywords" is a real number.
- **Salary against the pass line.** Every role is checked against the EP or S Pass qualifying salary for your age and sector.
- **COMPASS estimate.** Points for the two criteria you control (salary and qualifications), plus how many the employer has to bring from the two you do not.
- **Resume wording gaps.** Where you describe real experience in words the JD does not use, with rewrites that stay within what you actually did.
- **Sponsorship-aware cover letters.** One paragraph that makes the case for your pass, kept separate so you can reuse it.
- **Pipeline board and trends.** A kanban for tracking, a funnel, and a weekly match score trend that shows whether you are getting more targeted or spraying and praying.

## Stack

Next.js 14 (App Router) · TypeScript strict · Supabase (Postgres, RLS, Google OAuth, Storage) · Claude API · Recharts · Tailwind · Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

### Supabase

1. Create a project and run `supabase/migrations/001_initial_schema.sql` in the SQL editor. It creates the tables, RLS policies, the private `resumes` storage bucket and its policies.
2. Enable Google under Authentication > Providers.
3. Add `http://localhost:3000/auth/callback` (and your production URL) to the redirect allow list.

### Environment

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client and server Supabase access |
| `SUPABASE_SERVICE_ROLE_KEY` | Account deletion only |
| `ANTHROPIC_API_KEY` | All AI features |
| `NEXT_PUBLIC_APP_URL` | Metadata base URL |
| `CLAUDE_MODEL` | Optional, defaults to `claude-sonnet-5` |
| `ENFORCE_PRO` | Optional. `true` locks COMPASS, cover letters, extra resume versions and trends to Pro |

## How the numbers are made

Anything that can be computed is computed, and the model is only asked for judgement.

| What | Where | How |
| --- | --- | --- |
| Match score, verdict, strengths, gaps | `lib/claude/match-analyzer.ts` | Claude, calibrated so most roles land between 35 and 75 |
| Keyword coverage | `lib/match/keywords.ts` | Literal matching with aliases, plurals and punctuation variants ("CI/CD" vs "CICD"), without letting "go" match "google" |
| Salary fit | `lib/passes/thresholds.ts` | Arithmetic when the posting has numbers, the model's read otherwise |
| EP / S Pass qualifying salary | `lib/passes/thresholds.ts` | MOM 2025 figures, interpolated by age between the published ends |
| COMPASS C2, totals, verdict | `lib/passes/compass.ts` | Fixed rules |
| COMPASS C1 and shortage list bonus | `lib/claude/compass-estimator.ts` | Claude, told to pick the lower bracket when unsure |

All Claude calls go through a forced tool call (`lib/claude/client.ts`), so responses are schema-shaped JSON instead of prose that needs parsing.

## Free tier

Five match analyses a calendar month in Singapore time, counted in `usage_events`. A credit is only recorded after an analysis succeeds. Users can read and insert their own usage rows but cannot delete them, and a trigger stops anyone but the service role from changing `plan`.

## Project layout

```
app/
  (auth)/login, signup        Google sign in
  onboarding/                 Profile setup before first use
  (app)/dashboard             Stats, match trend, funnel, targeting read
  (app)/resume                Resume versions, upload and parse
  (app)/applications          Kanban, new analysis flow, detail, match breakdown, cover letter
  (app)/compass               Standalone COMPASS estimator with history
  (app)/settings              Profile, plan usage, sign out, delete account
  api/                        Route handlers
components/                   UI by feature
lib/claude/                   Prompts and structured calls
lib/passes/                   Work pass thresholds and COMPASS rules
lib/match/                    Keyword coverage
supabase/migrations/          Schema, RLS, storage
```

## Not in scope

No automated applications, no LinkedIn scraping (links to LinkedIn are refused and the user is asked to paste the text), no guaranteed sponsorship claims, and no immigration advice beyond general information.

## Disclaimer

ApplyTrack provides estimates and general guidance only. COMPASS point estimates are not official and cannot account for employer-specific workforce data. Actual work pass eligibility is determined solely by MOM. Verify all current criteria and thresholds at mom.gov.sg.
