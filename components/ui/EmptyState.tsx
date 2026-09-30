import Link from 'next/link'

export function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string
  body: string
  href?: string
  cta?: string
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-full border border-border bg-background">
        <span className="h-2 w-2 rounded-full bg-primary" />
      </div>
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-[420px] text-[14px] leading-relaxed text-muted">{body}</p>
      {href && cta && (
        <Link href={href} className="btn-primary mt-6">
          {cta}
        </Link>
      )}
    </div>
  )
}
