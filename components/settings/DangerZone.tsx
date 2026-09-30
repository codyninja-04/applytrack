'use client'

import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/http'

export function DangerZone() {
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      await api('/api/profile', { method: 'DELETE' })
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete')
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-match-low/30 p-5">
      <h2 className="text-[15px] font-semibold">Delete account</h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
        Removes your profile, every resume file, all applications, match analyses and cover letters. This cannot be undone.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Type delete to confirm"
          className="input sm:max-w-[220px]"
          placeholder='Type "delete"'
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
        <button className="btn-danger" onClick={remove} disabled={busy || confirmText.trim().toLowerCase() !== 'delete'}>
          {busy && <Spinner />}
          Delete everything
        </button>
      </div>
      {error && <Alert className="mt-3">{error}</Alert>}
    </section>
  )
}
