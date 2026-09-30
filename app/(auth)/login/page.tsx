import Link from 'next/link'
import type { Metadata } from 'next'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { AuthShell } from '@/components/auth/AuthShell'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string }
}) {
  const next = searchParams.next?.startsWith('/') ? searchParams.next : '/dashboard'

  return (
    <AuthShell title="Welcome back" subtitle="Your pipeline and match scores are where you left them.">
      {searchParams.error && (
        <p className="rounded-lg border border-match-low/40 bg-match-low/10 px-3 py-2 text-[13px]">
          Sign in did not complete. Try again.
        </p>
      )}
      <GoogleButton next={next} />
      <p className="text-center text-[13px] text-muted">
        First time here?{' '}
        <Link href="/signup" className="font-medium text-text underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
