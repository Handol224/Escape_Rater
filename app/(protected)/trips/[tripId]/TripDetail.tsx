'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Trip, TripMember, TripRoom } from '@/lib/types'

interface Props {
  trip: Trip & { trip_members: TripMember[]; trip_rooms: TripRoom[] }
  currentUserId: string
  isAdmin: boolean
  isCreator: boolean
  allRooms: { id: string; name: string; city: string; company: string }[]
  existingSlots: { id: string; escape_room_id: string; played_at: string; escape_rooms?: { name: string } }[]
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr + 'T00:00:00'), 'dd/MM/yy')
}

function formatTripName(trip: Trip) {
  if (trip.name) return trip.name
  const dateStr = `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`
  return [trip.city, dateStr].filter(Boolean).join(' | ')
}

export default function TripDetail({ trip, currentUserId, isAdmin, isCreator, allRooms, existingSlots }: Props) {
  const router = useRouter()
  const [tripData, setTripData] = useState(trip)
  const [shareUrl, setShareUrl] = useState('')
  const [roomSearch, setRoomSearch] = useState('')
  const [showRoomDropdown, setShowRoomDropdown] = useState(false)
  const [addingRoom, setAddingRoom] = useState(false)
  const [locking, setLocking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tripData.is_locked) {
      setShareUrl(`${window.location.origin}/t/${tripData.share_token}`)
    }
  }, [tripData.is_locked, tripData.share_token])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowRoomDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isPastEndDate = new Date() >= new Date(tripData.end_date + 'T00:00:00')

  const filteredRooms = roomSearch.trim().length > 0
    ? allRooms.filter(r =>
        r.name.toLowerCase().includes(roomSearch.toLowerCase()) &&
        !tripData.trip_rooms.some(tr => tr.escape_room_id === r.id)
      ).slice(0, 8)
    : []

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }

  async function handleAddRoom(roomId: string) {
    setAddingRoom(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('trip_rooms').insert({
      trip_id: tripData.id,
      escape_room_id: roomId,
      added_by: currentUserId,
    })
    if (err) {
      if (err.code === '23505') {
        setError('That room is already in this trip.')
      } else {
        setError(err.message)
      }
    } else {
      setRoomSearch('')
      setShowRoomDropdown(false)
      router.refresh()
    }
    setAddingRoom(false)
  }

  async function handleRemoveRoom(tripRoomId: string) {
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('trip_rooms').delete().eq('id', tripRoomId)
    if (err) {
      setError(err.message)
    } else {
      router.refresh()
    }
  }

  async function handleLinkSlot(tripRoomId: string, slotId: string | null) {
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('trip_rooms')
      .update({ game_slot_id: slotId })
      .eq('id', tripRoomId)
    if (err) {
      setError(err.message)
    } else {
      router.refresh()
    }
  }

  async function handleLock() {
    if (!confirm('Lock this trip? This cannot be undone. The public share link will be activated.')) return
    setLocking(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('trips')
      .update({ is_locked: true })
      .eq('id', tripData.id)
    if (err) {
      setError(err.message)
    } else {
      setTripData(prev => ({ ...prev, is_locked: true }))
      setShareUrl(`${window.location.origin}/t/${tripData.share_token}`)
      router.refresh()
    }
    setLocking(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this trip? This action cannot be undone.')) return
    setDeleting(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('trips').delete().eq('id', tripData.id)
    if (err) {
      setError(err.message)
      setDeleting(false)
    } else {
      router.push('/trips')
      router.refresh()
    }
  }

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/trips/join/${tripData.invite_token}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{formatTripName(tripData)}</h1>
              {tripData.is_locked && (
                <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full">Locked</span>
              )}
            </div>
            {tripData.city && <p className="text-gray-400 text-sm mt-1">{tripData.city}</p>}
            <p className="text-gray-500 text-sm mt-1">
              {formatDate(tripData.start_date)} – {formatDate(tripData.end_date)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isCreator && !tripData.is_locked && isPastEndDate && (
              <button
                onClick={handleLock}
                disabled={locking}
                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {locking ? 'Locking...' : 'Lock Trip'}
              </button>
            )}
            {isCreator && !tripData.is_locked && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-900/40 hover:bg-red-900/70 disabled:opacity-60 text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {tripData.is_locked && shareUrl && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-400 mb-2 font-medium">Public Share Link</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-orange-400 font-mono break-all">{shareUrl}</span>
              <button
                onClick={() => copyToClipboard(shareUrl)}
                className="shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Members */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Members ({tripData.trip_members.length})
          </h2>
          {isCreator && !tripData.is_locked && (
            <button
              onClick={() => {
                const link = `${window.location.origin}/trips/join/${tripData.invite_token}`
                copyToClipboard(link)
              }}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Copy Invite Link
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {tripData.trip_members.map(member => (
            <span
              key={member.user_id}
              className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-full"
            >
              {member.profiles?.username ?? member.user_id.slice(0, 8)}
              {member.user_id === tripData.creator_id && (
                <span className="ml-1 text-orange-400">★</span>
              )}
            </span>
          ))}
          {tripData.trip_members.length === 0 && (
            <p className="text-gray-500 text-sm">No members yet.</p>
          )}
        </div>
      </div>

      {/* Rooms */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Rooms ({tripData.trip_rooms.length})
        </h2>

        {tripData.trip_rooms.length > 0 && (
          <div className="space-y-3 mb-5">
            {tripData.trip_rooms.map(tr => {
              const room = tr.escape_rooms
              const slotsForRoom = existingSlots.filter(s => s.escape_room_id === tr.escape_room_id)

              return (
                <div key={tr.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{room?.name ?? 'Unknown room'}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {room?.city}{room?.city && room?.company ? ' · ' : ''}{room?.company}
                    </p>
                  </div>

                  {/* Slot linking */}
                  <div className="shrink-0">
                    <select
                      value={tr.game_slot_id ?? ''}
                      onChange={e => handleLinkSlot(tr.id, e.target.value || null)}
                      className="bg-gray-700 border border-gray-600 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Not linked</option>
                      {slotsForRoom.map(slot => (
                        <option key={slot.id} value={slot.id}>
                          {format(new Date(slot.played_at), 'dd/MM/yy')}
                        </option>
                      ))}
                    </select>
                    {tr.game_slot_id && (
                      <p className="text-xs text-green-400 mt-1 text-center">Played</p>
                    )}
                  </div>

                  {isCreator && (
                    <button
                      onClick={() => handleRemoveRoom(tr.id)}
                      className="shrink-0 text-gray-500 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded"
                      title="Remove room"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add room search */}
        {!tripData.is_locked && (
          <div ref={searchRef} className="relative">
            <input
              type="text"
              value={roomSearch}
              onChange={e => {
                setRoomSearch(e.target.value)
                setShowRoomDropdown(true)
              }}
              onFocus={() => setShowRoomDropdown(true)}
              placeholder="Search rooms to add..."
              disabled={addingRoom}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500 disabled:opacity-60"
            />
            {showRoomDropdown && filteredRooms.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => handleAddRoom(room.id)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-700 transition-colors"
                  >
                    <p className="text-white text-sm">{room.name}</p>
                    <p className="text-gray-400 text-xs">{room.city} · {room.company}</p>
                  </button>
                ))}
              </div>
            )}
            {showRoomDropdown && roomSearch.trim().length > 0 && filteredRooms.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-gray-500 text-sm z-10">
                No rooms found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
