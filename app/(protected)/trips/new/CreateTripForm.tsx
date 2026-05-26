'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CreateTripForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!startDate) {
      setError('Start date is required.')
      return
    }
    if (!endDate) {
      setError('End date is required.')
      return
    }
    if (endDate < startDate) {
      setError('End date must be on or after start date.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: trip, error: insertErr } = await supabase
      .from('trips')
      .insert({
        name: name.trim() || null,
        city: city.trim() || null,
        start_date: startDate,
        end_date: endDate,
        creator_id: userId,
      })
      .select('id')
      .single()

    if (insertErr || !trip) {
      setError(insertErr?.message ?? 'Failed to create trip.')
      setLoading(false)
      return
    }

    // Add creator as member
    await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: userId,
    })

    router.push(`/trips/${trip.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5 max-w-lg">
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Trip Name <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Summer Escape Weekend"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          City <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. Tel Aviv"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Start Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            End Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={e => setEndDate(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Creating...' : 'Create Trip'}
        </button>
        <a
          href="/trips"
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
