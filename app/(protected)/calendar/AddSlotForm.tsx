'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ActiveTrip {
  id: string
  name: string | null
  city: string | null
  start_date: string
  end_date: string
}

interface Room { id: string; name: string; city: string; company: string }

export default function AddSlotForm({
  rooms,
  activeTrips,
  userId,
}: {
  rooms: Room[]
  activeTrips: ActiveTrip[]
  userId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [isBacklog, setIsBacklog] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tripId, setTripId] = useState('')
  const [conflict, setConflict] = useState<{ tripRoomId: string; slotId: string } | null>(null)

  // Combobox state
  const [query, setQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)

  const filtered = query.trim() === ''
    ? rooms.slice(0, 8)
    : rooms
        .filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function selectRoom(room: Room) {
    setRoomId(room.id)
    setQuery(room.name)
    setDropdownOpen(false)
  }

  function clearRoom() {
    setRoomId('')
    setQuery('')
    setDropdownOpen(false)
  }

  function tripLabel(t: ActiveTrip) {
    if (t.name) return t.name
    const start = t.start_date.slice(0, 10) // yyyy-mm-dd
    const end = t.end_date.slice(0, 10)
    return [t.city, `${start} – ${end}`].filter(Boolean).join(' | ')
  }

  function resetForm() {
    setOpen(false)
    setRoomId('')
    setQuery('')
    setDate('')
    setTime('')
    setIsBacklog(false)
    setTripId('')
    setConflict(null)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!roomId) { setError('Please select a room.'); return }
    setError('')
    setLoading(true)

    const playedAt = isBacklog
      ? new Date('2000-01-01').toISOString()
      : new Date(`${date}T${time}`).toISOString()

    const supabase = createClient()

    // Insert slot and get back the ID
    const { data: insertedSlot, error: slotErr } = await supabase
      .from('game_slots')
      .insert({ escape_room_id: roomId, played_at: playedAt })
      .select('id')
      .single()

    if (slotErr || !insertedSlot) {
      setError(slotErr?.message ?? 'Failed to add slot')
      setLoading(false)
      return
    }

    const newSlotId = insertedSlot.id

    if (!tripId) {
      // No trip selected — done
      resetForm()
      router.refresh()
      return
    }

    // Check if room already in this trip
    const { data: existingTripRoom } = await supabase
      .from('trip_rooms')
      .select('id')
      .eq('trip_id', tripId)
      .eq('escape_room_id', roomId)
      .maybeSingle()

    if (!existingTripRoom) {
      // Add room to trip with slot linked
      await supabase.from('trip_rooms').insert({
        trip_id: tripId,
        escape_room_id: roomId,
        game_slot_id: newSlotId,
        added_by: userId,
      })
      resetForm()
      router.refresh()
    } else {
      // Conflict — ask user
      setConflict({ tripRoomId: existingTripRoom.id, slotId: newSlotId })
      setLoading(false)
    }
  }

  async function handleLinkConflict() {
    if (!conflict) return
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('trip_rooms')
      .update({ game_slot_id: conflict.slotId })
      .eq('id', conflict.tripRoomId)
    resetForm()
    router.refresh()
  }

  async function handleSkipConflict() {
    resetForm()
    router.refresh()
  }

  return (
    <div className="mb-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Game Slot
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="font-semibold text-white mb-4">New Game Slot</h3>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* Combobox */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Escape Room</label>
              <div ref={comboboxRef} className="relative">
                <input
                  type="text"
                  value={query}
                  placeholder="Search rooms…"
                  autoComplete="off"
                  onChange={e => {
                    setQuery(e.target.value)
                    setRoomId('')
                    setDropdownOpen(true)
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-8 text-white text-sm focus:outline-none focus:border-orange-500"
                />
                {roomId && (
                  <button
                    type="button"
                    onClick={clearRoom}
                    aria-label="Clear selection"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-base leading-none"
                  >
                    ×
                  </button>
                )}
                {dropdownOpen && filtered.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    {filtered.map(r => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onMouseDown={e => {
                            // Use mousedown so it fires before the input's blur
                            e.preventDefault()
                            selectRoom(r)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors"
                        >
                          <span className="block text-white text-sm">{r.name}</span>
                          <span className="block text-gray-400 text-xs">{r.city} · {r.company}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {dropdownOpen && query.trim() !== '' && filtered.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-500">
                    No rooms found.
                  </div>
                )}
              </div>
            </div>

            {!isBacklog && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={isBacklog}
              onChange={e => setIsBacklog(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-sm text-gray-400">Backlog — no specific date</span>
          </label>

          {activeTrips.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Trip <span className="text-gray-600">(optional)</span></label>
              <select
                value={tripId}
                onChange={e => setTripId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="">No trip</option>
                {activeTrips.map(t => (
                  <option key={t.id} value={t.id}>{tripLabel(t)}</option>
                ))}
              </select>
            </div>
          )}

          {conflict ? (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-3 mt-2">
              <p className="text-yellow-300 text-sm font-medium mb-3">
                This room is already planned in the trip. Link this session to it?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleLinkConflict}
                  className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Link it
                </button>
                <button
                  type="button"
                  onClick={handleSkipConflict}
                  className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Adding…' : 'Add Slot'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
