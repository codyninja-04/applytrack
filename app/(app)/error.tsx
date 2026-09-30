'use client'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-[520px] p-7 text-center">
      <h1 className="text-[20px] font-semibold">Something broke on this page</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        Your data is safe. Try again, and if it keeps happening, reload the page.
      </p>
      {error.digest && <p className="mt-2 text-[12px] text-muted">Reference: {error.digest}</p>}
      <button onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  )
}
