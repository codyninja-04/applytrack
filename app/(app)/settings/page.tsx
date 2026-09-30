import type { Metadata } from 'next'
import { DangerZone } from '@/components/settings/DangerZone'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { PageHeader } from '@/components/ui/PageHeader'
import { getSession } from '@/lib/queries'
import { FREE_MATCH_LIMIT, countThisMonth, matchQuota } from '@/lib/usage'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const { supabase, user, profile } = await getSession()
  const [quota, letters, compass] = await Promise.all([
    matchQuota(supabase, user.id, profile?.plan),
    countThisMonth(supabase, user.id, 'cover_letter'),
    countThisMonth(supabase, user.id, 'compass'),
  ])
  const pro = profile?.plan === 'pro'

  return (
    <div className="max-w-[820px] space-y-6">
      <PageHeader eyebrow="Settings" title="Profile and plan" description={`Signed in as ${user.email}`} />

      <section className="card p-5 sm:p-7">
        <h2 className="mb-5 text-[16px] font-semibold">Your profile</h2>
        <ProfileForm profile={profile} mode="settings" />
      </section>

      <section className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[16px] font-semibold">Plan</h2>
          <span className="chip bg-primary/15 text-primary ring-1 ring-primary/30">{pro ? 'Pro' : 'Free'}</span>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-background/60 px-3.5 py-3">
            <dt className="text-[12.5px] text-muted">Match analyses this month</dt>
            <dd className="mt-1 text-[18px] font-semibold tabular-nums">
              {quota.used}
              {quota.limit !== null && <span className="text-muted"> / {quota.limit}</span>}
            </dd>
          </div>
          <div className="rounded-lg bg-background/60 px-3.5 py-3">
            <dt className="text-[12.5px] text-muted">Cover letters this month</dt>
            <dd className="mt-1 text-[18px] font-semibold tabular-nums">{letters}</dd>
          </div>
          <div className="rounded-lg bg-background/60 px-3.5 py-3">
            <dt className="text-[12.5px] text-muted">COMPASS estimates this month</dt>
            <dd className="mt-1 text-[18px] font-semibold tabular-nums">{compass}</dd>
          </div>
        </dl>
        {!pro && (
          <div className="mt-5 rounded-lg border border-border p-4">
            <p className="text-[14px] font-semibold">Pro, $10 a month</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
              Unlimited match analysis instead of {FREE_MATCH_LIMIT} a month, the COMPASS estimator, cover letter generation,
              multiple resume versions and match score trends. Billing is coming soon.
            </p>
          </div>
        )}
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-[14px] text-muted">Sign out of ApplyTrack on this device.</p>
        <form action="/auth/signout" method="post">
          <button className="btn-secondary">Sign out</button>
        </form>
      </section>

      <DangerZone />
    </div>
  )
}
