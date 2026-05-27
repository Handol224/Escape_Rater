import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import type { EscapeRoom, GameSlot } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface SlotInfo {
  id: string
  played_at: string
  escaped: boolean | null
  escape_rooms: EscapeRoom
}

interface RatingWithSlot {
  id: string
  game_slot_id: string
  user_id: string
  puzzles: number
  story_theme: number
  atmosphere: number
  difficulty: number
  comment: string | null
  created_at: string
  game_slots: SlotInfo
}

interface UnratedSlot {
  id: string
  escape_room_id: string
  played_at: string
  escaped: boolean | null
  escape_rooms: Pick<EscapeRoom, 'id' | 'name' | 'city' | 'company'>
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isBacklog(playedAt: string): boolean {
  return new Date(playedAt).getFullYear() === 2000
}

function avgScore(r: Pick<RatingWithSlot, 'puzzles' | 'story_theme' | 'atmosphere' | 'difficulty'>): number {
  return (r.puzzles + r.story_theme + r.atmosphere + r.difficulty) / 4
}

function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-400'
  if (score >= 6) return 'text-yellow-400'
  return 'text-red-400'
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myRatingsRaw } = await supabase
    .from('ratings')
    .select('*, game_slots(id, played_at, escaped, escape_rooms(id, name, city, company, time_limit))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: allSlotsRaw } = await supabase
    .from('game_slots')
    .select('id, escape_room_id, played_at, escaped, escape_rooms(id, name, city, company)')
    .order('played_at', { ascending: false })

  const myRatings = (myRatingsRaw ?? []) as unknown as RatingWithSlot[]
  const allSlots = (allSlotsRaw ?? []) as unknown as UnratedSlot[]

  // ── Computed stats ──────────────────────────────────────────────────────────

  const totalRated = myRatings.length

  const myAvgScore: number = totalRated > 0
    ? Math.round(
        (myRatings.reduce((sum, r) => sum + avgScore(r), 0) / totalRated) * 10
      ) / 10
    : 0

  const escapedCount = myRatings.filter(
    r => r.game_slots?.escaped === true
  ).length

  // Denominator: non-backlog slots with non-null escaped
  const ratedNonBacklogWithEscapeData = myRatings.filter(
    r => r.game_slots && !isBacklog(r.game_slots.played_at) && r.game_slots.escaped !== null
  )
  const myEscapeRate = ratedNonBacklogWithEscapeData.length > 0
    ? Math.round(
        ratedNonBacklogWithEscapeData.filter(r => r.game_slots.escaped === true).length /
        ratedNonBacklogWithEscapeData.length * 100
      )
    : null

  const ratedSlotIds = new Set(myRatings.map(r => r.game_slot_id))
  const unratedSlots = allSlots.filter(
    slot => !ratedSlotIds.has(slot.id) && !isBacklog(slot.played_at)
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Stats</h1>
        <p className="text-gray-400 text-sm mt-1">Your personal escape room history</p>
      </div>

      {/* Overview grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Rooms Rated', value: totalRated.toString() },
          { label: 'Avg Score', value: myAvgScore > 0 ? myAvgScore.toFixed(1) : '—' },
          { label: 'Rooms Escaped', value: escapedCount.toString() },
          { label: 'Escape Rate', value: myEscapeRate !== null ? `${myEscapeRate}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* My Ratings */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          My Ratings ({totalRated})
        </h2>

        {myRatings.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven&apos;t rated any sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {myRatings.map(r => {
              const slot = r.game_slots
              const score = avgScore(r)
              const backlog = slot ? isBacklog(slot.played_at) : false

              return (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-4 py-3 border-b border-gray-800 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {slot?.escape_rooms?.name ?? '—'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {slot?.escape_rooms?.city} · {slot?.escape_rooms?.company}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {backlog
                        ? 'Backlog'
                        : slot
                          ? format(new Date(slot.played_at), 'PPP')
                          : '—'}
                    </p>
                    {r.comment && (
                      <p className="text-gray-400 text-sm italic mt-1 line-clamp-2">{r.comment}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-lg font-bold tabular-nums ${scoreColor(score)}`}>
                      {score.toFixed(1)}
                    </span>
                    {slot?.escaped === true && (
                      <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
                        Escaped
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Unrated Sessions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Unrated Sessions ({unratedSlots.length})
        </h2>

        {unratedSlots.length === 0 ? (
          <p className="text-gray-500 text-sm">You&apos;ve rated all sessions! 🎉</p>
        ) : (
          <div className="space-y-3">
            {unratedSlots.map(slot => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-4 py-3 border-b border-gray-800 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {slot.escape_rooms?.name ?? '—'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {slot.escape_rooms?.city} · {slot.escape_rooms?.company}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {format(new Date(slot.played_at), 'PPP')}
                  </p>
                </div>
                <Link
                  href={`/rate/${slot.id}`}
                  className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  Rate
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
