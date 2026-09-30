'use client'

import { useState } from 'react'
import type { CompassEstimate, CompassInputs } from '@/lib/types'
import { COMPASSCalculator } from './COMPASSCalculator'
import { CriteriaBreakdown } from './CriteriaBreakdown'

/** COMPASS for one specific application, prefilled from the posting and the profile. */
export function CompassForRole({
  applicationId,
  existing,
  defaults,
}: {
  applicationId: string
  existing: CompassEstimate | null
  defaults: Partial<CompassInputs>
}) {
  const [editing, setEditing] = useState(!existing)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-semibold">COMPASS for this role</h2>
          <p className="mt-1 text-[13px] text-muted">Only relevant for EP. Uses the advertised salary and your profile.</p>
        </div>
        {existing && (
          <button className="btn-ghost" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Show saved estimate' : 'Re-estimate'}
          </button>
        )}
      </div>
      {editing ? (
        <COMPASSCalculator defaults={defaults} applicationId={applicationId} />
      ) : (
        existing && <CriteriaBreakdown estimate={existing} />
      )}
    </section>
  )
}
