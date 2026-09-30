import { MATCH_HEX, MATCH_TEXT, matchTier } from '@/lib/constants'
import { cn } from '@/lib/format'

const TIER_WORD = { high: 'Strong fit', medium: 'Partial fit', low: 'Weak fit' }

/** Half-circle gauge. Colour bands match the spec: 75+ green, 50 to 74 amber, below 50 red. */
export function MatchScoreGauge({ score, size = 200 }: { score: number; size?: number }) {
  const tier = matchTier(score) ?? 'low'
  const stroke = 14
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const arc = Math.PI * r
  const filled = (Math.max(0, Math.min(100, score)) / 100) * arc

  const path = `M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg
        width={size}
        height={size / 2 + stroke / 2}
        viewBox={`0 0 ${size} ${size / 2 + stroke / 2}`}
        role="img"
        aria-label={`Match score ${score} out of 100, ${TIER_WORD[tier].toLowerCase()}`}
      >
        <path d={path} fill="none" stroke="#334155" strokeWidth={stroke} strokeLinecap="round" />
        {/* Threshold ticks at 50 and 75 so the colour bands are readable without a legend */}
        {[50, 75].map((t) => {
          const a = Math.PI - (t / 100) * Math.PI
          const x1 = cx + (r - stroke) * Math.cos(a)
          const y1 = cy - (r - stroke) * Math.sin(a)
          const x2 = cx + (r - stroke - 6) * Math.cos(a)
          const y2 = cy - (r - stroke - 6) * Math.sin(a)
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth={2} strokeLinecap="round" />
        })}
        <path
          d={path}
          fill="none"
          stroke={MATCH_HEX[tier]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arc}`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className={cn('text-score tabular-nums', MATCH_TEXT[tier])}>{score}</span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{TIER_WORD[tier]}</span>
      </div>
    </div>
  )
}
