'use client'

import { format } from 'date-fns'
import { useState } from 'react'
import { RATING_CATEGORIES } from '@/lib/types'

interface RatingWithProfile {
  id: string
  user_id: string
  puzzles: number
  story_theme: number
  atmosphere: number
  difficulty: number
  comment: string | null
  profiles: { username: string }
}

interface SlotWithRatings {
  id: string
  played_at: string
  escape_rooms: { name: string }
  ratings: RatingWithProfile[]
}

export default function RatingsPanel({ slots }: { slots: SlotWithRatings[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const slotsWithRatings = slots.filter(s => s.ratings?.length > 0)

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-3">Individual Ratings</h2>
      <p className="text-xs text-gray-500 mb-4">Only visible to admins. Showing last 20 sessions.</p>

      {slotsWithRatings.length === 0 ? (
        <p className="text-gray-500 text-sm">No ratings yet.</p>
      ) : (
        <div className="space-y-3">
          {slotsWithRatings.map(slot => (
            <div key={slot.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === slot.id ? null : slot.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium text-white">{slot.escape_rooms?.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(slot.played_at), 'PPP')} · {slot.ratings.length} rating{slot.ratings.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className="text-gray-500 text-sm">{expanded === slot.id ? '▲' : '▼'}</span>
              </button>

              {expanded === slot.id && (
                <div className="px-5 pb-4 border-t border-gray-800">
                  <div className="space-y-4 mt-4">
                    {slot.ratings.map(r => (
                      <div key={r.id} className="bg-gray-800 rounded-xl p-4">
                        <div className="font-medium text-orange-400 mb-3">{r.profiles?.username}</div>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {RATING_CATEGORIES.map(({ key, label }) => (
                            <div key={key} className="text-center bg-gray-700 rounded-lg p-2">
                              <div className="text-xs text-gray-400 mb-1">{label.split(' ')[0]}</div>
                              <div className="font-bold text-white">{r[key]}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-gray-300 font-medium">
                          Total:{' '}
                          <span className="text-orange-400">
                            {r.puzzles + r.story_theme + r.atmosphere + r.difficulty}/40
                          </span>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-gray-400 mt-2 italic">&ldquo;{r.comment}&rdquo;</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
