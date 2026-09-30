import Link from 'next/link'
import type { Metadata } from 'next'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { AuthShell } from '@/components/auth/AuthShell'

export const metadata: Metadata = { title: 'Get started' }

const PERKS = [
  'A match score that tells you when to skip a role, not just when to apply',
  'A check on whether the salary clears the EP or S Pass line for your age',
  'Cover letters with a sponsorship paragraph that argues your case',
]

export default function SignupPage() {
  return (
    <AuthShell
      title="Stop tailoring for roles you will not get"
      subtitle="Built for S Pass and EP candidates. Five free analyses a month."
    >
      <ul className="space-y-2.5">
        {PERKS.map((perk) => (
          <li key={perk} className="flex gap-2.5 text-[14px] leading-snug text-muted">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {perk}
          </li>
        ))}
      </ul>
      <GoogleButton next="/onboarding" />
      <p className="text-center text-[13px] text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-text underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
