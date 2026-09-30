import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { LEGAL_DISCLAIMER } from '@/lib/constants'
import { getSession } from '@/lib/queries'
import { matchQuota } from '@/lib/usage'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await getSession()
  if (!profile?.onboarding_complete) redirect('/onboarding')

  const quota = await matchQuota(supabase, user.id, profile.plan)
  const usage = { plan: profile.plan, used: quota.used, limit: quota.limit }

  return (
    <div className="flex min-h-screen">
      <Sidebar usage={usage} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header usage={usage} name={profile.display_name} />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
        <footer className="border-t border-border px-4 py-5 sm:px-6 lg:px-10">
          <p className="mx-auto max-w-[1180px] text-[12px] leading-relaxed text-muted/80">{LEGAL_DISCLAIMER}</p>
        </footer>
      </div>
    </div>
  )
}
