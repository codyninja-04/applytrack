import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { getSession } from '@/lib/queries'

export const metadata: Metadata = { title: 'Set up your profile' }

export default async function OnboardingPage() {
  const { profile } = await getSession()
  if (profile?.onboarding_complete) redirect('/dashboard')

  return (
    <main className="mx-auto max-w-[720px] px-4 py-10 sm:py-14">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="mb-8 space-y-2">
        <p className="eyebrow">Step 1 of 2</p>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em]">The facts that decide your odds</h1>
        <p className="max-w-[560px] text-[14px] leading-relaxed text-muted">
          Match scores, salary threshold checks and COMPASS estimates all depend on these. It takes a
          minute and you can change it later in settings.
        </p>
      </div>
      <div className="card p-5 sm:p-7">
        <ProfileForm profile={profile} mode="onboarding" />
      </div>
    </main>
  )
}
