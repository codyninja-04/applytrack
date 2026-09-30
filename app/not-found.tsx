import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-[26px] font-bold">Nothing here</h1>
      <p className="mt-2 max-w-[380px] text-[14px] text-muted">
        That page does not exist, or it belongs to someone else&apos;s account.
      </p>
      <Link href="/dashboard" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </main>
  )
}
