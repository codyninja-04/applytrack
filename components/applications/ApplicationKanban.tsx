'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { KANBAN_COLUMNS, STATUS_META, matchTier, MATCH_TEXT } from '@/lib/constants'
import { cn } from '@/lib/format'
import { api } from '@/lib/http'
import type { ApplicationStatus } from '@/lib/types'
import { ApplicationCard, type CardApplication } from './ApplicationCard'

const COLUMN_HINT: Partial<Record<ApplicationStatus, string>> = {
  researching: 'Analysed, not sent yet',
  offer: 'Ask about pass timing early',
}

export function ApplicationKanban({ initial, showArchived }: { initial: CardApplication[]; showArchived: boolean }) {
  const router = useRouter()
  const [apps, setApps] = useState(initial)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<ApplicationStatus | null>(null)
  const [archived, setArchived] = useState(showArchived)
  const [error, setError] = useState<string | null>(null)

  const byStatus = useMemo(() => {
    const map = new Map<ApplicationStatus, CardApplication[]>()
    for (const a of apps) {
      const list = map.get(a.status) ?? []
      list.push(a)
      map.set(a.status, list)
    }
    return map
  }, [apps])

  async function move(id: string, status: ApplicationStatus) {
    const before = apps
    const current = apps.find((a) => a.id === id)
    if (!current || current.status === status) return

    // Optimistic: the board moves now, and rolls back if the save fails.
    setApps((list) =>
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              applied_date:
                a.applied_date ?? (status !== 'researching' && status !== 'skipped' ? new Date().toISOString().slice(0, 10) : null),
            }
          : a
      )
    )
    setError(null)
    try {
      await api(`/api/applications/${id}`, { method: 'PATCH', json: { status } })
      router.refresh()
    } catch (err) {
      setApps(before)
      setError(err instanceof Error ? err.message : 'Could not move that card')
    }
  }

  const archivedList = [...(byStatus.get('withdrawn') ?? []), ...(byStatus.get('skipped') ?? [])]

  return (
    <div className="space-y-5">
      {error && <Alert>{error}</Alert>}

      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="grid min-w-[1080px] grid-cols-6 gap-3">
          {KANBAN_COLUMNS.map((col) => {
            const items = byStatus.get(col) ?? []
            const scored = items.filter((a) => a.match_score !== null)
            const avg = scored.length ? Math.round(scored.reduce((s, a) => s + (a.match_score ?? 0), 0) / scored.length) : null
            const tier = matchTier(avg)

            return (
              <section
                key={col}
                aria-label={STATUS_META[col].label}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverCol(col)
                }}
                onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('text/plain')
                  setOverCol(null)
                  setDragId(null)
                  if (id) move(id, col)
                }}
                className={cn(
                  'flex min-h-[420px] flex-col rounded-xl border bg-background/60 p-2.5 transition',
                  overCol === col ? 'border-primary bg-primary/5' : 'border-border/70'
                )}
              >
                <header className="mb-2.5 px-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-[13px] font-semibold">
                      <span className={cn('h-2 w-2 rounded-full', STATUS_META[col].dot)} />
                      {STATUS_META[col].label}
                    </h2>
                    <span className="text-[12px] tabular-nums text-muted">{items.length}</span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {avg !== null && tier ? (
                      <>
                        Avg match <span className={cn('font-semibold', MATCH_TEXT[tier])}>{avg}%</span>
                      </>
                    ) : (
                      COLUMN_HINT[col] ?? ' '
                    )}
                  </p>
                </header>
                <div className="flex flex-1 flex-col gap-2">
                  {items.map((a) => (
                    <ApplicationCard
                      key={a.id}
                      app={a}
                      dragging={dragId === a.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', a.id)
                        e.dataTransfer.effectAllowed = 'move'
                        setDragId(a.id)
                      }}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverCol(null)
                      }}
                      onMove={(s) => move(a.id, s)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-border/70 p-4 text-center text-[12px] text-muted/70">
                      Drop here
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {archivedList.length > 0 && (
        <section>
          <button className="text-[13px] font-semibold text-muted hover:text-text" onClick={() => setArchived((v) => !v)} aria-expanded={archived}>
            {archived ? 'Hide' : 'Show'} skipped and withdrawn ({archivedList.length})
          </button>
          {archived && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {archivedList.map((a) => (
                <ApplicationCard key={a.id} app={a} onMove={(s) => move(a.id, s)} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
