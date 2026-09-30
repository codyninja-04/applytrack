import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CoverLetterDraft } from '@/components/applications/CoverLetterDraft'
import { PASS_LABEL } from '@/lib/constants'
import { getApplication, getSession } from '@/lib/queries'

export const metadata: Metadata = { title: 'Cover letter' }

export default async function CoverLetterPage({ params }: { params: { id: string } }) {
  const app = await getApplication(params.id)
  if (!app) notFound()
  const { profile } = await getSession()

  const pass = profile?.work_pass_needed ?? 'either'

  return (
    <CoverLetterDraft
      applicationId={app.id}
      companyName={app.company_name}
      initialLetter={app.cover_letter_draft}
      initialPitch={app.sponsorship_pitch}
      needsSponsorship={pass !== 'none_have_pr_citizen'}
      passLabel={PASS_LABEL[pass]}
    />
  )
}
