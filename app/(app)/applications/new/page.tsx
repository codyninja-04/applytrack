import type { Metadata } from 'next'
import { NewApplicationFlow } from '@/components/applications/NewApplicationFlow'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getSession } from '@/lib/queries'
import { matchQuota } from '@/lib/usage'

export const metadata: Metadata = { title: 'New match analysis' }

export default async function NewApplicationPage() {
  const { supabase, user, profile } = await getSession()

  const [{ data: resumes }, quota] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, version_name, is_primary')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false }),
    matchQuota(supabase, user.id, profile?.plan),
  ])

  return (
    <div className="max-w-[920px]">
      <PageHeader
        eyebrow="New analysis"
        title="Is this role worth your hour?"
        description="Paste the posting and get a straight answer before you spend time tailoring. Most roles should not score above 80, and that is the point."
      />
      {!resumes || resumes.length === 0 ? (
        <EmptyState
          title="Upload a resume first"
          body="The score measures your resume against the posting, so we need one to compare."
          href="/resume/upload"
          cta="Upload resume"
        />
      ) : (
        <NewApplicationFlow
          resumes={resumes}
          profile={profile}
          remaining={quota.remaining}
        />
      )}
    </div>
  )
}
