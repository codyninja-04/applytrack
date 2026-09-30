import { cn } from '@/lib/format'

const TONES = {
  error: 'border-match-low/40 bg-match-low/10',
  warning: 'border-match-medium/40 bg-match-medium/10',
  info: 'border-primary/40 bg-primary/10',
}

export function Alert({
  tone = 'error',
  children,
  className,
}: {
  tone?: keyof typeof TONES
  children: React.ReactNode
  className?: string
}) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-lg border px-3.5 py-2.5 text-[13px] leading-relaxed', TONES[tone], className)}>
      {children}
    </div>
  )
}
