'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Room { id: string; name: string; city: string; company: string }

export default function AddSlotForm({ rooms }: { rooms: Room[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [isBacklog, setIsBacklog] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!roomId) {
      setError('Please select a room.')
      return
    }

    setLoading(true)

    const playedAt = isBacklog
      ? new Date('2000-01-01').toISOString()
      : new Date(`${date}T${time}`).toISOString()

    const supabase = createClient()
    const { error } = await supabase
      .from('game_slots')
      .insert({ escape_room_id: roomId, played_at: playedAt })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setRoomId('')
    setQuery('')
    setDate('')
    setTime('')
    setIsBacklog(false)
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
        </form>
      )}
    </div>
  )
}
