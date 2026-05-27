'use client'

import { useState } from 'react'
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

export default function SortableDashboard({ rankings, sortLabels, stats, currentUserId, backlogSlotsByRoom, userRatedSlotByRoom }: Props) {
  const router = useRouter()
  const [sort, setSort] = useState<SortKey>('overall')
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [creatingSlotFor, setCreatingSlotFor] = useState<string | null>(null)

  async function handleRateRoom(roomId: string) {
    setCreatingSlotFor(roomId)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('game_slots')
      .insert({ escape_room_id: roomId, played_at: '2000-01-01T00:00:00Z', escaped: null })
      .select('id')
      .single()
    if (error || !data) {
      setCreatingSlotFor(null)
      alert('Failed to create slot: ' + (error?.message ?? 'unknown error'))
      return
    }
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
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
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

            return (
              <div
                key={r.room.id}
                className={`bg-gray-900 rounded-xl border p-5 ${isTopOverall ? 'border-orange-600/60' : 'border-gray-800'}`}
              >
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
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <div>
                      <div className="text-3xl font-bold">
                        <OverallBadge value={r.overall} highlight={isTopOverall} />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">overall</div>
                    </div>
                    {(() => {
                      const existingSlotId = userRatedSlotByRoom[r.room.id]
                      const backlogSlotId = backlogSlotsByRoom[r.room.id]
                      if (existingSlotId) {
                        return (
                          <Link
                            href={`/rate/${existingSlotId}`}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Edit Rating
                          </Link>
                        )
                      }
                      if (backlogSlotId) {
                        return (
                          <Link
                            href={`/rate/${backlogSlotId}`}
                            className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Rate
                          </Link>
                        )
                      }
                      return (
                        <button
                          onClick={() => handleRateRoom(r.room.id)}
                          disabled={creatingSlotFor === r.room.id}
                          className="text-xs bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {creatingSlotFor === r.room.id ? '…' : 'Rate'}
                        </button>
                      )
                    })()}
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
            )
          })}
        </div>
      )}
    </>
  )
}
