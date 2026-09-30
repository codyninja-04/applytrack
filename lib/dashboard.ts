import type { ApplicationStatus, PipelineStage } from '@/lib/types'
import { STAGE_ORDER } from '@/lib/constants'

export interface DashRow {
  id: string
  company_name: string
  role_title: string
  status: ApplicationStatus
  furthest_stage: PipelineStage
  match_score: number | null
  applied_date: string | null
  created_at: string
  updated_at: string
}

const DAY = 86_400_000
const SG_OFFSET = 8 * 3600_000

/** Monday of the Singapore week containing this instant, as YYYY-MM-DD. */
function weekKey(ms: number): string {
  const d = new Date(ms + SG_OFFSET)
  const dow = (d.getUTCDay() + 6) % 7
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow)).toISOString().slice(0, 10)
}

function isSent(r: DashRow): boolean {
  return r.furthest_stage !== 'researching'
}

function avg(nums: number[]): number | null {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null
}

export function weeklyTrend(rows: DashRow[], weeks = 12, now = Date.now()) {
  const buckets = new Map<string, { scores: number[]; count: number; applied: number }>()
  for (let i = weeks - 1; i >= 0; i--) buckets.set(weekKey(now - i * 7 * DAY), { scores: [], count: 0, applied: 0 })

  for (const r of rows) {
    const b = buckets.get(weekKey(Date.parse(r.created_at)))
    if (!b) continue
    b.count++
    if (r.match_score !== null) b.scores.push(r.match_score)
    if (isSent(r)) b.applied++
  }

  return Array.from(buckets.entries()).map(([week, b]) => ({
    week,
    label: new Date(`${week}T00:00:00Z`).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
    avg: avg(b.scores),
    count: b.count,
    applied: b.applied,
  }))
}

export function funnel(rows: DashRow[]) {
  const stages = STAGE_ORDER.slice(1) // applied onwards
  const reached = stages.map((s) => rows.filter((r) => STAGE_ORDER.indexOf(r.furthest_stage) >= STAGE_ORDER.indexOf(s)).length)
  const labels: Record<string, string> = { applied: 'Applied', screening: 'Screening', interview: 'Interview', offer: 'Offer' }
  return stages.map((s, i) => ({
    stage: labels[s],
    count: reached[i],
    rate: i === 0 || reached[i - 1] === 0 ? null : Math.round((reached[i] / reached[i - 1]) * 100),
  }))
}

export type TargetingRead = 'sharper' | 'steady' | 'spraying' | 'not_enough'

/**
 * "Are you getting more targeted or spraying and praying?" Compares the last
 * 28 days of analyses with the 28 before, and counts sends below 50.
 */
export function targeting(rows: DashRow[], now = Date.now()) {
  const recent = rows.filter((r) => now - Date.parse(r.created_at) <= 28 * DAY)
  const prior = rows.filter((r) => {
    const age = now - Date.parse(r.created_at)
    return age > 28 * DAY && age <= 56 * DAY
  })
  const scores = (list: DashRow[]) => list.map((r) => r.match_score).filter((s): s is number => s !== null)

  const recentAvg = avg(scores(recent))
  const priorAvg = avg(scores(prior))
  const recentSent = recent.filter(isSent)
  const lowSends = recentSent.filter((r) => r.match_score !== null && r.match_score < 50).length
  const lowShare = recentSent.length ? Math.round((lowSends / recentSent.length) * 100) : 0

  let read: TargetingRead = 'not_enough'
  if (scores(recent).length >= 3) {
    if (lowShare >= 40) read = 'spraying'
    else if (priorAvg !== null && recentAvg !== null && recentAvg - priorAvg >= 5) read = 'sharper'
    else if (priorAvg !== null && recentAvg !== null && priorAvg - recentAvg >= 5) read = 'spraying'
    else read = 'steady'
  }

  return { recentAvg, priorAvg, lowSends, lowShare, sentRecent: recentSent.length, read }
}

export function headline(rows: DashRow[]) {
  const sent = rows.filter(isSent)
  const responded = sent.filter((r) => STAGE_ORDER.indexOf(r.furthest_stage) >= STAGE_ORDER.indexOf('screening'))
  const active = rows.filter((r) => ['applied', 'screening', 'interview', 'offer'].includes(r.status))
  return {
    total: rows.length,
    sent: sent.length,
    active: active.length,
    interviews: rows.filter((r) => STAGE_ORDER.indexOf(r.furthest_stage) >= STAGE_ORDER.indexOf('interview')).length,
    responseRate: sent.length >= 3 ? Math.round((responded.length / sent.length) * 100) : null,
    avgMatchSent: avg(sent.map((r) => r.match_score).filter((s): s is number => s !== null)),
  }
}
