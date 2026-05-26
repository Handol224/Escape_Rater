'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { EscapeRoom } from '@/lib/types'

type RoomRow = { name: string; company: string; city: string; time_limit: string }
const emptyRow = (): RoomRow => ({ name: '', company: '', city: '', time_limit: '' })

export default function RoomsPanel({ rooms }: { rooms: EscapeRoom[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<RoomRow[]>([emptyRow()])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function deleteRoom(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its sessions and ratings?`)) return
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('escape_rooms').delete().eq('id', id)
    router.refresh()
    setDeleting(null)
  }

  function updateRow(i: number, field: keyof RoomRow, value: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  function addRow() {
    setRows(prev => [...prev, emptyRow()])
  }

  function removeRow(i: number) {
    setRows(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from('escape_rooms').insert(
      rows.map(r => ({ ...r, time_limit: parseInt(r.time_limit) }))
    )

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setRows([emptyRow()])
    router.refresh()
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">Escape Rooms</h2>
        <button
          onClick={() => setOpen(v => !v)}
          className="text-sm bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          + Add Rooms
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-4">
          <h3 className="font-medium text-white mb-4">Add Escape Rooms</h3>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3 mb-3">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <div>
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">Room Name</label>}
                  <input
                    type="text"
                    value={row.name}
                    onChange={e => updateRow(i, 'name', e.target.value)}
                    required
                    placeholder="The Lost Temple"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">Company</label>}
                  <input
                    type="text"
                    value={row.company}
                    onChange={e => updateRow(i, 'company', e.target.value)}
                    required
                    placeholder="EscapeWorld"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">City</label>}
                  <input
                    type="text"
                    value={row.city}
                    onChange={e => updateRow(i, 'city', e.target.value)}
                    required
                    placeholder="Tel Aviv"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    {i === 0 && <label className="block text-xs text-gray-500 mb-1">Minutes</label>}
                    <input
                      type="number"
                      value={row.time_limit}
                      onChange={e => updateRow(i, 'time_limit', e.target.value)}
                      required
                      min={1}
                      placeholder="60"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-gray-600 hover:text-red-400 text-lg px-1 pb-2 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="text-sm text-orange-400 hover:text-orange-300 transition-colors mb-4"
          >
            + Add another room
          </button>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {loading ? 'Saving…' : `Save ${rows.length} room${rows.length > 1 ? 's' : ''}`}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setRows([emptyRow()]) }}
              className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {rooms.length === 0 ? (
        <p className="text-gray-500 text-sm">No rooms added yet.</p>
      ) : (
        <div className="space-y-2">
          {rooms.map(r => (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{r.name}</span>
                  <span className="text-gray-500 text-sm ml-2">· {r.company} · {r.city}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm">{r.time_limit} min</span>
                  <button
                    onClick={() => deleteRoom(r.id, r.name)}
                    disabled={deleting === r.id}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                  >
                    {deleting === r.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
