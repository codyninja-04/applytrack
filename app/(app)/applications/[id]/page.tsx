import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'
import { getApplication } from '@/lib/queries'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const app = await getApplication(params.id)
  return { title: app ? `${app.role_title} at ${app.company_name}` : 'Application' }
}

export default async function ApplicationPage({ params }: { params: { id: string } }) {
  const app = await getApplication(params.id)
  if (!app) notFound()
  return <ApplicationDetail key={app.updated_at} app={app} />
}
