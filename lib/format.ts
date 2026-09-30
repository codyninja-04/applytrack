export function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return '-'
  return `$${Math.round(n).toLocaleString('en-SG')}`
}

export function salaryRange(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min && max && min !== max) return `${money(min)} to ${money(max)}`
  return money(min ?? max)
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', timeZone: 'Asia/Singapore' })
}

export function longDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Singapore',
  })
}

/** Whole days between a date and today in Singapore. */
export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const sgToday = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
  const a = Date.parse(`${dateStr.slice(0, 10)}T00:00:00Z`)
  const b = Date.parse(`${sgToday}T00:00:00Z`)
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

export function sgToday(): string {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
}

export function relativeDays(n: number | null): string {
  if (n === null) return ''
  if (n === 0) return 'today'
  if (n === 1) return '1 day ago'
  return `${n} days ago`
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
