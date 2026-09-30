import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/lib/types'

/** Small helpers so every route handler fails the same way. */

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireUser(): Promise<
  { ok: true; userId: string; supabase: SupabaseClient } | { ok: false; response: NextResponse }
> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, response: jsonError('Sign in first', 401) }
  return { ok: true, userId: user.id, supabase }
}

export async function loadProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile | null> {
  const { data } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle()
  return (data as UserProfile | null) ?? null
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

/** Trims, empties to null, so blank form fields do not become "" in the db. */
export function nullable(value: unknown, max = 500): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed.slice(0, max)
}

export function intOrNull(value: unknown, min = 0, max = 10_000_000): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, n))
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

/** Turns SDK and network failures into something a user can act on. */
export function aiErrorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error'
  console.error('[ai]', message)
  if (/ANTHROPIC_API_KEY/.test(message)) return jsonError('AI is not configured on this deployment.', 503)
  if (/rate|overloaded|529|429/i.test(message)) return jsonError('The AI is busy right now. Try again in a minute.', 503)
  if (/cut off/.test(message)) return jsonError(message, 422)
  return jsonError('The analysis failed. Nothing was charged against your limit, try again.', 502)
}
