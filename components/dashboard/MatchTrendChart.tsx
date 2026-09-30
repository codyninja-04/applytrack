'use client'

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface TrendPoint {
  week: string
  label: string
  avg: number | null
  count: number
  applied: number
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: TrendPoint }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] shadow-lift">
      <p className="font-semibold">Week of {p.label}</p>
      <p className="mt-1 text-muted">
        Avg match <span className="font-semibold text-text tabular-nums">{p.avg === null ? '-' : `${p.avg}%`}</span>
      </p>
      <p className="text-muted">
        {p.count} analysed, {p.applied} sent
      </p>
    </div>
  )
}

/**
 * Weekly average match score. One series, so no legend: the card title names
 * it. Dashed lines at 50 and 75 mark where the colour bands change.
 */
export function MatchTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div>
      <div className="h-[240px]" role="img" aria-label="Average match score by week">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#334155" strokeOpacity={0.45} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#334155' }} interval="preserveStartEnd" minTickGap={18} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <ReferenceLine y={75} stroke="#22C55E" strokeOpacity={0.45} strokeDasharray="4 4" />
            <ReferenceLine y={50} stroke="#F59E0B" strokeOpacity={0.45} strokeDasharray="4 4" />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#64748B', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#818CF8"
              strokeWidth={2}
              connectNulls
              dot={{ r: 4, fill: '#818CF8', stroke: '#1E293B', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#818CF8', stroke: '#1E293B', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-[12px] text-muted hover:text-text">View as table</summary>
        <table className="mt-2 w-full text-left text-[12.5px]">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-medium">Week of</th>
              <th className="py-1 text-right font-medium">Avg match</th>
              <th className="py-1 text-right font-medium">Analysed</th>
              <th className="py-1 text-right font-medium">Sent</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((d) => (
              <tr key={d.week} className="border-t border-border">
                <td className="py-1">{d.label}</td>
                <td className="py-1 text-right">{d.avg === null ? '-' : `${d.avg}%`}</td>
                <td className="py-1 text-right">{d.count}</td>
                <td className="py-1 text-right">{d.applied}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
