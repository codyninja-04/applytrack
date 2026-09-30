import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Application, UserProfile } from '@/lib/types'

/**
 * One auth + profile lookup per request, shared by the layout and the page
 * through React's cache, so navigating does not double the round trips.
 */
export const getSession = cache(async () => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle()
  const profile = (data as UserProfile | null) ?? null

  return { supabase, user, profile }
})

export const getApplication = cache(async (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { supabase } = await getSession()
  const { data } = await supabase.from('applications').select('*').eq('id', id).maybeSingle()
  return (data as Application | null) ?? null
})
