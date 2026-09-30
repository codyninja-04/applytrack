import type { Metadata } from 'next'
import { ResumeUploader } from '@/components/resume/ResumeUploader'
import { Alert } from '@/components/ui/Alert'
import { PageHeader } from '@/components/ui/PageHeader'
import { getSession } from '@/lib/queries'
import { canUse } from '@/lib/usage'

export const metadata: Metadata = { title: 'Upload resume' }

export default async function UploadResumePage({ searchParams }: { searchParams: { first?: string } }) {
  const { supabase, profile } = await getSession()
  const { count } = await supabase.from('resumes').select('id', { count: 'exact', head: true })
  const hasExisting = (count ?? 0) > 0
  const blocked = hasExisting && !canUse(profile?.plan, 'multiple_resumes')

  return (
    <div className="max-w-[760px]">
      <PageHeader
        eyebrow={searchParams.first ? 'Step 2 of 2' : 'Resumes'}
        title={hasExisting ? 'Add a resume version' : 'Upload your resume'}
        description="We read it the way an ATS would. If a section does not show up in the preview afterwards, recruiters' software probably misses it too."
      />
      {blocked ? (
        <Alert tone="warning">
          Multiple resume versions are part of Pro. Delete your current version to replace it, or upgrade.
        </Alert>
      ) : (
        <ResumeUploader hasExisting={hasExisting} />
      )}
    </div>
  )
}
