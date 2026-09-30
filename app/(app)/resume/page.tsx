import Link from 'next/link'
import type { Metadata } from 'next'
import { ResumeVersionCard } from '@/components/resume/ResumeVersionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getSession } from '@/lib/queries'
import type { Resume } from '@/lib/types'

export const metadata: Metadata = { title: 'Resumes' }

export default async function ResumesPage() {
  const { supabase } = await getSession()

  const [{ data: resumes }, { data: apps }] = await Promise.all([
    supabase.from('resumes').select('*').order('is_primary', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('applications').select('resume_id, match_score').not('resume_id', 'is', null),
  ])

  // Which version actually scores better is the useful question once you have more than one.
  const usage = new Map<string, { count: number; total: number; scored: number }>()
  for (const a of apps ?? []) {
    const u = usage.get(a.resume_id) ?? { count: 0, total: 0, scored: 0 }
    u.count++
    if (a.match_score !== null) {
      u.total += a.match_score
      u.scored++
    }
    usage.set(a.resume_id, u)
  }

  const list = (resumes ?? []) as Resume[]

  return (
    <>
      <PageHeader
        eyebrow="Resumes"
        title="Resume versions"
        description="Keep a version per direction you are applying in. Each match remembers which one it used, so you can see which version scores better."
        actions={
          <Link href="/resume/upload" className="btn-primary">
            Add a version
          </Link>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="No resume yet"
          body="Upload your resume first. Every match score is measured against it."
          href="/resume/upload"
          cta="Upload resume"
        />
      ) : (
        <div className="space-y-4">
          {list.map((r) => {
            const u = usage.get(r.id)
            return (
              <ResumeVersionCard
                key={r.id}
                resume={r}
                usage={{ count: u?.count ?? 0, avg: u && u.scored > 0 ? Math.round(u.total / u.scored) : null }}
              />
            )
          })}
        </div>
      )}
    </>
  )
}
