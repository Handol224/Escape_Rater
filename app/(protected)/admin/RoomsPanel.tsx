'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { EscapeRoom } from '@/lib/types'

export default function RoomsPanel({ rooms }: { rooms: EscapeRoom[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', company: '', time_limit: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from('escape_rooms').insert({
      ...form,
      time_limit: parseInt(form.time_limit),
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setForm({ name: '', city: '', company: '', time_limit: '' })
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
          + Add Room
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-4">
          <h3 className="font-medium text-white mb-4">New Escape Room</h3>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { field: 'name', label: 'Room Name', placeholder: 'The Lost Temple', type: 'text' },
              { field: 'company', label: 'Company / Brand', placeholder: 'EscapeWorld', type: 'text' },
              { field: 'city', label: 'City', placeholder: 'Tel Aviv', type: 'text' },
              { field: 'time_limit', label: 'Time Limit (minutes)', placeholder: '60', type: 'number' },
            ].map(({ field, label, placeholder, type }) => (
              <div key={field}>
                <label className="block text-sm text-gray-400 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[field as keyof typeof form]}
                  onChange={e => update(field, e.target.value)}
                  required
                  min={type === 'number' ? 1 : undefined}
                  placeholder={placeholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {loading ? 'Adding…' : 'Add Room'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg">
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
                <span className="text-gray-500 text-sm">{r.time_limit} min</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
