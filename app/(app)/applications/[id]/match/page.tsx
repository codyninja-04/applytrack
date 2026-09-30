import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CompassForRole } from '@/components/compass/CompassForRole'
import { LanguageSuggestions } from '@/components/match/LanguageSuggestions'
import { MatchResult } from '@/components/match/MatchResult'
import { ReanalyzePanel } from '@/components/match/ReanalyzePanel'
import { getApplication, getSession } from '@/lib/queries'
import { matchQuota } from '@/lib/usage'

export const metadata: Metadata = { title: 'Match breakdown' }

export default async function MatchPage({ params }: { params: { id: string } }) {
  const app = await getApplication(params.id)
  if (!app) notFound()
  const { supabase, user, profile } = await getSession()

  const [{ data: resumes }, quota] = await Promise.all([
    supabase.from('resumes').select('id, version_name, is_primary').order('created_at', { ascending: false }),
    matchQuota(supabase, user.id, profile?.plan),
  ])

  const hasAnalysis = Boolean(app.match_breakdown)
  const usedResume = resumes?.find((r) => r.id === app.resume_id)
  const epRelevant = profile?.work_pass_needed === 'ep' || profile?.work_pass_needed === 'either'

  return (
    <div className="space-y-8">
      {hasAnalysis && (
        <>
          <p className="text-[13px] text-muted">
            Scored against{' '}
            <span className="font-medium text-text">{usedResume?.version_name ?? 'a deleted resume version'}</span>.
          </p>
          <MatchResult application={app} profile={profile} />
          <LanguageSuggestions key={app.match_analyzed_at} applicationId={app.id} initial={app.language_suggestions} />
        </>
      )}

      <ReanalyzePanel
        key={app.match_analyzed_at ?? 'none'}
        applicationId={app.id}
        resumes={resumes ?? []}
        currentResumeId={app.resume_id}
        jobDescription={app.job_description}
        hasAnalysis={hasAnalysis}
        remaining={quota.remaining}
      />

      {epRelevant && (
        <CompassForRole
          applicationId={app.id}
          existing={app.compass_estimate}
          defaults={{
            offered_salary: app.advertised_salary_min ?? app.advertised_salary_max ?? undefined,
            role_title: app.role_title,
            industry: app.industry ?? profile?.target_industry ?? '',
            is_financial_sector: app.is_financial_sector,
            degree_type: profile?.degree_type ?? undefined,
            university_tier: profile?.university_tier ?? undefined,
            years_experience: profile?.years_experience ?? undefined,
            age: profile?.age ?? undefined,
            nationality: profile?.nationality ?? '',
          }}
        />
      )}
    </div>
  )
}
