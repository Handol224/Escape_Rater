'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { RoomRanking, SortKey } from '@/lib/types'
import type { Stats } from './page'

interface Props {
  rankings: RoomRanking[]
  sortLabels: Record<SortKey, string>
  stats: Stats
  currentUserId: string
  backlogSlotsByRoom: Record<string, string>
  userRatedSlotByRoom: Record<string, string>
  playedByRoom: Record<string, string>   // roomId → user_played_rooms.id
}

type CategoryKey = 'puzzles' | 'story_theme' | 'atmosphere' | 'difficulty'
const CATEGORY_KEYS: CategoryKey[] = ['puzzles', 'story_theme', 'atmosphere', 'difficulty']

function OverallBadge({ value, highlight }: { value: number; highlight?: boolean }) {
  const color = highlight
    ? 'text-orange-400'
    : value >= 8 ? 'text-green-400'
    : value >= 6 ? 'text-yellow-400'
    : value > 0  ? 'text-red-400'
    : 'text-gray-600'
  return (
    <span className={`font-bold tabular-nums ${color}`}>
      {value > 0 ? value.toFixed(1) : '—'}
    </span>
  )
}

function CategoryBadge({ value, highlight }: { value: number; highlight?: boolean }) {
  const color = highlight
    ? 'text-orange-400'
    : value >= 8 ? 'text-green-400'
    : value >= 6 ? 'text-yellow-400'
    : value > 0  ? 'text-red-400'
    : 'text-gray-600'
  return <span className={`font-bold tabular-nums ${color}`}>{value > 0 ? value.toFixed(1) : '—'}</span>
}

// ── Rate Room Modal ────────────────────────────────────────────────────────────

interface RateModalProps {
  rankings: RoomRanking[]
  backlogSlotsByRoom: Record<string, string>
  userRatedSlotByRoom: Record<string, string>
  localPlayedByRoom: Record<string, string>
  onClose: () => void
  onMarkPlayed: (roomId: string) => Promise<void>
  onUnmarkPlayed: (roomId: string) => Promise<void>
  onRate: (roomId: string) => Promise<void>
  markingPlayedFor: string | null
  ratingFor: string | null
}

function RateRoomModal({
  rankings, backlogSlotsByRoom, userRatedSlotByRoom, localPlayedByRoom,
  onClose, onMarkPlayed, onUnmarkPlayed, onRate, markingPlayedFor, ratingFor,
}: RateModalProps) {
  const [modalSearch, setModalSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = modalSearch.toLowerCase()
  const filtered = rankings.filter(r =>
    !modalSearch ||
    r.room.name.toLowerCase().includes(q) ||
    r.room.city.toLowerCase().includes(q) ||
    r.room.company.toLowerCase().includes(q)
  )

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md flex flex-col shadow-2xl max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-white font-semibold text-lg">Rate a Room</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={modalSearch}
            onChange={e => setModalSearch(e.target.value)}
            placeholder="Search rooms…"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Room list */}
        <div className="overflow-y-auto px-5 pb-5 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No rooms found.</p>
          ) : (
            filtered.map(r => {
              const ratedSlotId = userRatedSlotByRoom[r.room.id]
              const backlogSlotId = backlogSlotsByRoom[r.room.id]
              const isPlayed = !!localPlayedByRoom[r.room.id]
              const isMarking = markingPlayedFor === r.room.id
              const isRating = ratingFor === r.room.id

              return (
                <div key={r.room.id} className="bg-gray-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{r.room.name}</p>
                      <p className="text-gray-400 text-xs">{r.room.company} · {r.room.city}</p>
                    </div>
                    {r.overall > 0 && (
                      <span className="text-sm font-bold tabular-nums text-gray-400 shrink-0">{r.overall.toFixed(1)}</span>
                    )}
                  </div>
                  {/* Action bar */}
                  {ratedSlotId ? (
                    <Link
                      href={`/rate/${ratedSlotId}`}
                      className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-gray-400 hover:text-white bg-gray-700/60 hover:bg-gray-700 transition-colors"
                    >
                      ✏️ Edit rating
                    </Link>
                  ) : isPlayed ? (
                    <div className="flex">
                      <button
                        onClick={() => onUnmarkPlayed(r.room.id)}
                        className="flex items-center justify-center px-4 py-2 text-gray-500 hover:text-red-400 text-xs transition-colors border-r border-gray-700 shrink-0"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { onRate(r.room.id); onClose() }}
                        disabled={isRating}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                      >
                        {isRating ? '…' : '★ Rate'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onMarkPlayed(r.room.id)}
                      disabled={isMarking}
                      className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition-colors"
                    >
                      {isMarking ? '…' : '★ Mark as Played'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SortableDashboard({ rankings, sortLabels, stats, currentUserId, backlogSlotsByRoom, userRatedSlotByRoom, playedByRoom }: Props) {
  const router = useRouter()
  const [sort, setSort] = useState<SortKey>('overall')
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [showRateModal, setShowRateModal] = useState(false)

  // Local mutable copies so UI updates instantly without a full page refresh
  const [localPlayedByRoom, setLocalPlayedByRoom] = useState<Record<string, string>>(playedByRoom)
  const [localBacklogSlots, setLocalBacklogSlots] = useState<Record<string, string>>(backlogSlotsByRoom)
  const [markingPlayedFor, setMarkingPlayedFor] = useState<string | null>(null)
  const [ratingFor, setRatingFor] = useState<string | null>(null)

  async function handleMarkPlayed(roomId: string) {
    setMarkingPlayedFor(roomId)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_played_rooms')
      .insert({ user_id: currentUserId, room_id: roomId })
      .select('id')
      .single()
    setMarkingPlayedFor(null)
    if (error || !data) {
      alert('Could not mark as played: ' + (error?.message ?? 'unknown error'))
      return
    }
    setLocalPlayedByRoom(prev => ({ ...prev, [roomId]: data.id }))
  }

  async function handleUnmarkPlayed(roomId: string) {
    const playedId = localPlayedByRoom[roomId]
    if (!playedId) return
    const supabase = createClient()
    await supabase.from('user_played_rooms').delete().eq('id', playedId)
    setLocalPlayedByRoom(prev => {
      const next = { ...prev }
      delete next[roomId]
      return next
    })
  }

  async function handleRate(roomId: string) {
    const existingSlotId = localBacklogSlots[roomId]
    if (existingSlotId) {
      router.push(`/rate/${existingSlotId}`)
      return
    }
    setRatingFor(roomId)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('game_slots')
      .insert({ escape_room_id: roomId, played_at: '2000-01-01T00:00:00Z', escaped: null })
      .select('id')
      .single()
    if (error || !data) {
      setRatingFor(null)
      alert('Failed to create slot: ' + (error?.message ?? 'unknown error'))
      return
    }
    setLocalBacklogSlots(prev => ({ ...prev, [roomId]: data.id }))
    router.push(`/rate/${data.id}`)
  }

  const cities = [...new Set(rankings.map(r => r.room.city))].sort()
  const companies = [...new Set(rankings.map(r => r.room.company))].sort()

  const sorted = [...rankings].sort((a, b) => {
    if (sort === 'time_limit') return a.room.time_limit - b.room.time_limit
    return (b[sort] ?? 0) - (a[sort] ?? 0)
  })

  const filtered = sorted.filter(r => {
    if (!search && !cityFilter && !companyFilter) return true
    const q = search.toLowerCase()
    const matchesSearch = !search || r.room.name.toLowerCase().includes(q) || r.room.city.toLowerCase().includes(q) || r.room.company.toLowerCase().includes(q)
    const matchesCity = !cityFilter || r.room.city === cityFilter
    const matchesCompany = !companyFilter || r.room.company === companyFilter
    return matchesSearch && matchesCity && matchesCompany
  })

  const ratedRankings = rankings.filter(r => r.total_ratings > 0)
  const bestIn: Partial<Record<CategoryKey | 'overall', string>> = {}
  if (ratedRankings.length > 0) {
    bestIn.overall = ratedRankings.reduce((a, b) => b.overall > a.overall ? b : a).room.id
    for (const key of CATEGORY_KEYS) {
      bestIn[key] = ratedRankings.reduce((a, b) => b[key] > a[key] ? b : a).room.id
    }
  }

  return (
    <>
      {/* Rate modal */}
      {showRateModal && (
        <RateRoomModal
          rankings={rankings}
          backlogSlotsByRoom={localBacklogSlots}
          userRatedSlotByRoom={userRatedSlotByRoom}
          localPlayedByRoom={localPlayedByRoom}
          onClose={() => setShowRateModal(false)}
          onMarkPlayed={handleMarkPlayed}
          onUnmarkPlayed={handleUnmarkPlayed}
          onRate={handleRate}
          markingPlayedFor={markingPlayedFor}
          ratingFor={ratingFor}
        />
      )}

      {/* Stats bar + Rate button */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Sessions', value: stats.totalSessions.toString() },
          { label: 'Rooms rated', value: stats.totalRooms.toString() },
          { label: 'Avg score', value: stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Prominent Rate a Room button */}
      <button
        onClick={() => setShowRateModal(true)}
        className="w-full mb-6 py-3 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-orange-900/30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        Rate a Room
      </button>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, city, or company…"
        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500 mb-3"
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 flex-1"
        >
          <option value="">All cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 flex-1"
        >
          <option value="">All companies</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(sortLabels) as SortKey[]).map(key => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              sort === key
                ? 'bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {sortLabels[key]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          {(search || cityFilter || companyFilter) ? 'No rooms match your filters.' : 'No escape rooms yet. Admin will add them!'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => {
            const isTopOverall = bestIn.overall === r.room.id
            const activeCategoryKey = sort as CategoryKey
            const isTopInSort = CATEGORY_KEYS.includes(activeCategoryKey) && bestIn[activeCategoryKey] === r.room.id
            const ratedSlotId = userRatedSlotByRoom[r.room.id]
            const isPlayed = !!localPlayedByRoom[r.room.id]
            const isMarking = markingPlayedFor === r.room.id
            const isRating = ratingFor === r.room.id

            return (
              <div
                key={r.room.id}
                className={`bg-gray-900 rounded-xl border overflow-hidden ${isTopOverall ? 'border-orange-600/60' : 'border-gray-800'}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl font-bold text-gray-600 w-8 shrink-0 pt-0.5">{i + 1}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/rooms/${r.room.id}`} className="hover:text-orange-400 transition-colors">
                            <h3 className="font-semibold text-white text-lg leading-tight">{r.room.name}</h3>
                          </Link>
                          {isTopOverall && <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full">#1 overall</span>}
                          {!isTopOverall && isTopInSort && r.total_ratings > 0 && (
                            <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">
                              Best {sortLabels[sort].toLowerCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-0.5">
                          {r.room.company} · {r.room.city} · {r.room.time_limit} min
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {r.total_ratings} rating{r.total_ratings !== 1 ? 's' : ''} across {r.slots_played} play{r.slots_played !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-bold">
                        <OverallBadge value={r.overall} highlight={isTopOverall} />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">overall</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORY_KEYS.map(key => (
                      <div
                        key={key}
                        className={`text-center p-2 rounded-lg ${sort === key ? 'bg-orange-900/30 ring-1 ring-orange-600' : 'bg-gray-800'}`}
                      >
                        <div className="text-xs text-gray-400 mb-1 truncate">
                          {sortLabels[key].split(' ')[0]}
                        </div>
                        <CategoryBadge value={r[key] ?? 0} highlight={bestIn[key] === r.room.id && r.total_ratings > 0} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Bottom action bar ── */}
                {ratedSlotId ? (
                  // State 3: already rated → edit
                  <Link
                    href={`/rate/${ratedSlotId}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-800 transition-colors border-t border-gray-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit your rating
                  </Link>
                ) : isPlayed ? (
                  // State 2: marked as played → split bar (Cancel | Rate)
                  <div className="flex border-t border-gray-800">
                    <button
                      onClick={() => handleUnmarkPlayed(r.room.id)}
                      className="flex items-center justify-center px-4 py-2.5 text-gray-500 hover:text-red-400 text-sm transition-colors border-r border-gray-700 shrink-0"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRate(r.room.id)}
                      disabled={isRating}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                    >
                      {isRating ? '…' : '★ Rate'}
                    </button>
                  </div>
                ) : (
                  // State 1: not played yet → single orange bar
                  <button
                    onClick={() => handleMarkPlayed(r.room.id)}
                    disabled={isMarking}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-60 transition-colors border-t border-orange-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {isMarking ? 'Saving…' : 'Mark as Played'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
