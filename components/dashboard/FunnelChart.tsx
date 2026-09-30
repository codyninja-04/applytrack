'use client'

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface FunnelStep {
  stage: string
  count: number
  rate: number | null
}

function FunnelTooltip({ active, payload }: { active?: boolean; payload?: { payload: FunnelStep }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] shadow-lift">
      <p className="font-semibold">{p.stage}</p>
      <p className="mt-1 text-muted">
        <span className="font-semibold text-text tabular-nums">{p.count}</span> reached this stage
      </p>
      {p.rate !== null && <p className="text-muted">{p.rate}% of the stage before</p>}
    </div>
  )
}

/** How far sent applications got. Counts use the furthest stage reached, so rejections still count upstream. */
export function FunnelChart({ data }: { data: FunnelStep[] }) {
  return (
    <div className="h-[220px]" role="img" aria-label={`Application funnel: ${data.map((d) => `${d.stage} ${d.count}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="stage" width={82} tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip content={<FunnelTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
          <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} isAnimationActive={false} minPointSize={2}>
            <LabelList dataKey="count" position="right" fill="#F1F5F9" fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
