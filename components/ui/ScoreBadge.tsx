import { MATCH_BADGE, matchTier } from '@/lib/constants'
import { cn } from '@/lib/format'

export function ScoreBadge({ score, size = 'sm' }: { score: number | null | undefined; size?: 'sm' | 'md' }) {
  const tier = matchTier(score)
  if (!tier) {
    return (
      <span className={cn('chip bg-surface-2 text-muted ring-1 ring-border', size === 'md' && 'px-2.5 py-1.5 text-[13px]')}>
        Not scored
      </span>
    )
  }
  return (
    <span
      className={cn('chip tabular-nums ring-1', MATCH_BADGE[tier], size === 'md' && 'px-2.5 py-1.5 text-[13px]')}
      title="Match score"
    >
      {score}% match
    </span>
  )
}
