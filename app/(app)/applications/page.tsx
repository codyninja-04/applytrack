import Link from 'next/link'
import type { Metadata } from 'next'
import { ApplicationKanban } from '@/components/applications/ApplicationKanban'
import type { CardApplication } from '@/components/applications/ApplicationCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getSession } from '@/lib/queries'
import type { MatchBreakdown } from '@/lib/types'

export const metadata: Metadata = { title: 'Applications' }

export default async function ApplicationsPage({ searchParams }: { searchParams: { skipped?: string } }) {
  const { supabase } = await getSession()

  const { data } = await supabase
    .from('applications')
    .select('id, company_name, role_title, status, match_score, match_breakdown, applied_date, created_at')
    .order('updated_at', { ascending: false })
    .limit(500)

  const apps: CardApplication[] = (data ?? []).map((a) => ({
    id: a.id,
    company_name: a.company_name,
    role_title: a.role_title,
    status: a.status,
    match_score: a.match_score,
    salary_fit: (a.match_breakdown as MatchBreakdown | null)?.salary_fit ?? null,
    applied_date: a.applied_date,
    created_at: a.created_at,
  }))

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Applications"
        description="Drag cards between columns, or use the menu on each card. Moving a card out of Researching stamps today as the applied date."
        actions={
          <>
            <Link href="/applications/new" className="btn-primary">
              New match analysis
            </Link>
          </>
        }
      />
      {searchParams.skipped && (
        <p className="mb-4 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] text-muted">
          Skipped. That is an hour you did not spend tailoring for a long shot.
        </p>
      )}
      {apps.length === 0 ? (
        <EmptyState
          title="Nothing in the pipeline"
          body="Run a match analysis on a posting you are considering. It lands in Researching until you apply."
          href="/applications/new"
          cta="Analyse a job"
        />
      ) : (
        <ApplicationKanban initial={apps} showArchived={Boolean(searchParams.skipped)} />
      )}
    </>
  )
}
