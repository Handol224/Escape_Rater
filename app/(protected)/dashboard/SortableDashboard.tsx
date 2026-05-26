'use client'

import { useState } from 'react'
import type { RoomRanking, SortKey } from '@/lib/types'

interface Props {
  rankings: RoomRanking[]
  sortLabels: Record<SortKey, string>
}

type CategoryKey = 'puzzles' | 'story_theme' | 'atmosphere' | 'difficulty' | 'game_master'
const SCORE_KEYS: CategoryKey[] = ['puzzles', 'story_theme', 'atmosphere', 'difficulty', 'game_master']

function ScoreBadge({ value }: { value: number }) {
  const color =
    value >= 8 ? 'text-green-400' :
    value >= 6 ? 'text-yellow-400' :
    value > 0  ? 'text-red-400' :
    'text-gray-600'
  return <span className={`font-bold tabular-nums ${color}`}>{value > 0 ? value.toFixed(1) : '—'}</span>
}

export default function SortableDashboard({ rankings, sortLabels }: Props) {
  const [sort, setSort] = useState<SortKey>('overall')

  const sorted = [...rankings].sort((a, b) => {
    if (sort === 'time_limit') return a.room.time_limit - b.room.time_limit
    return (b[sort] ?? 0) - (a[sort] ?? 0)
  })

  return (
    <>
      {/* Sort pills */}
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

      {sorted.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No escape rooms yet. Admin will add them!
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((r, i) => (
            <div key={r.room.id} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-bold text-gray-600 w-8 shrink-0 pt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white text-lg leading-tight">{r.room.name}</h3>
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
                    <ScoreBadge value={r.overall} />
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">overall</div>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="mt-4 grid grid-cols-5 gap-2">
                {SCORE_KEYS.map(key => (
                  <div
                    key={key}
                    className={`text-center p-2 rounded-lg ${sort === key ? 'bg-orange-900/30 ring-1 ring-orange-600' : 'bg-gray-800'}`}
                  >
                    <div className="text-xs text-gray-400 mb-1 truncate">
                      {sortLabels[key].split(' ')[0]}
                    </div>
                    <ScoreBadge value={r[key] ?? 0} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
