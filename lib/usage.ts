import type { SupabaseClient } from '@supabase/supabase-js'
import type { Plan } from '@/lib/types'

export type UsageKind = 'match' | 'cover_letter' | 'compass' | 'gaps' | 'resume_parse'

/** Free tier: 5 match analyses a calendar month (Singapore time). */
export const FREE_MATCH_LIMIT = 5

/**
 * Pro-only features. Billing is not wired yet, so gating is off unless
 * ENFORCE_PRO=true. The free match limit is always enforced.
 */
export const PRO_FEATURES = ['compass', 'cover_letter', 'multiple_resumes', 'trends'] as const
export type ProFeature = (typeof PRO_FEATURES)[number]

export function proGatingOn(): boolean {
  return process.env.ENFORCE_PRO === 'true'
}

export function canUse(plan: Plan | null | undefined, _feature: ProFeature): boolean {
  if (!proGatingOn()) return true
  return plan === 'pro'
}

/** First instant of the current month in Singapore (UTC+8, no DST), as ISO. */
export function sgMonthStart(now = new Date()): string {
  const sg = new Date(now.getTime() + 8 * 3600_000)
  const start = Date.UTC(sg.getUTCFullYear(), sg.getUTCMonth(), 1) - 8 * 3600_000
  return new Date(start).toISOString()
}

export async function countThisMonth(supabase: SupabaseClient, userId: string, kind: UsageKind): Promise<number> {
  const { count } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', kind)
    .gte('created_at', sgMonthStart())
  return count ?? 0
}

export async function matchQuota(
  supabase: SupabaseClient,
  userId: string,
  plan: Plan | null | undefined
): Promise<{ used: number; limit: number | null; remaining: number | null }> {
  const used = await countThisMonth(supabase, userId, 'match')
  if (plan === 'pro') return { used, limit: null, remaining: null }
  return { used, limit: FREE_MATCH_LIMIT, remaining: Math.max(0, FREE_MATCH_LIMIT - used) }
}

/** Recorded only after a call succeeds, so failed analyses never cost a credit. */
export async function recordUsage(supabase: SupabaseClient, userId: string, kind: UsageKind): Promise<void> {
  const { error } = await supabase.from('usage_events').insert({ user_id: userId, kind })
  if (error) console.error('[usage]', error.message)
}
