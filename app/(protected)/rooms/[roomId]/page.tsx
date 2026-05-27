import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'

interface RatingRow {
  id: string
  puzzles: number
  story_theme: number
  atmosphere: number
  difficulty: number
  comment: string | null
  profiles?: { username: string } | null
}

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function RoomDetailPage({ params }: Props) {
  const { roomId } = await params
  const supabase = await createClient()

  const { data: room } = await supabase
    .from('escape_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (!room) notFound()

  const { data: slots } = await supabase
    .from('game_slots')
    .select('*, ratings(*, profiles(username))')
    .eq('escape_room_id', roomId)
    .order('played_at', { ascending: false })

  const allSlots = slots ?? []

  // Compute stats
  const totalPlays = allSlots.length
  const slotsWithEscaped = allSlots.filter(s => s.escaped !== null)
  const escapeRate = slotsWithEscaped.length
    ? Math.round((slotsWithEscaped.filter(s => s.escaped).length / slotsWithEscaped.length) * 100)
    : null

  const allRatings = allSlots.flatMap(s => s.ratings ?? [])
  const avgOverall =
    allRatings.length > 0
      ? Math.round(
          (allRatings.reduce(
            (sum, r) => sum + (r.puzzles + r.story_theme + r.atmosphere + r.difficulty) / 4,
            0
          ) /
            allRatings.length) *
            10
        ) / 10
      : null

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
        ← Back to Rankings
      </Link>

      {/* Room header card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-white">{room.name}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {room.company} · {room.city} · {room.time_limit} min
        </p>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{totalPlays}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total plays</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">
              {escapeRate !== null ? `${escapeRate}%` : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Escape rate</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">
              {avgOverall !== null ? avgOverall.toFixed(1) : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Avg overall</div>
          </div>
        </div>
      </div>

      {/* Slots */}
      {allSlots.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No sessions recorded yet.</div>
      ) : (
        <div className="space-y-4">
          {allSlots.map(slot => {
            const playedDate = new Date(slot.played_at)
            const isBacklog = playedDate.getFullYear() === 2000
            const dateLabel = isBacklog ? 'Backlog' : format(playedDate, 'PPP')

            const escapedBadge =
              slot.escaped === true ? (
                <span className="text-green-400 text-sm font-medium">Escaped</span>
              ) : slot.escaped === false ? (
                <span className="text-red-400 text-sm font-medium">Did not escape</span>
              ) : (
                <span className="text-gray-500 text-sm">— Unknown</span>
              )

            const ratings = (slot.ratings ?? []) as RatingRow[]

            return (
              <div
                key={slot.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4"
              >
                {/* Slot header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-white font-medium">{dateLabel}</span>
                  {escapedBadge}
                </div>

                {/* Ratings */}
                {ratings.length > 0 && (
                  <div className="space-y-3">
                    {ratings.map(r => {
                      const avg =
                        Math.round(
                          ((r.puzzles + r.story_theme + r.atmosphere + r.difficulty) / 4) * 10
                        ) / 10
                      const username = r.profiles?.username ?? 'Unknown'

                      return (
                        <div key={r.id} className="bg-gray-800 rounded-lg p-4 space-y-3">
                          {/* Username + avg */}
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium text-sm">{username}</span>
                            <span className="text-orange-400 font-bold tabular-nums">
                              {avg.toFixed(1)}
                            </span>
                          </div>

                          {/* Comment */}
                          {r.comment && (
                            <p className="text-gray-400 text-sm italic">&ldquo;{r.comment}&rdquo;</p>
                          )}

                          {/* Category scores */}
                          <div className="grid grid-cols-4 gap-2">
                            {(
                              [
                                { key: 'puzzles', label: 'Puzzles' },
                                { key: 'story_theme', label: 'Story & Theme' },
                                { key: 'atmosphere', label: 'Atmosphere' },
                                { key: 'difficulty', label: 'Difficulty' },
                              ] as const
                            ).map(({ key, label }) => (
                              <div key={key} className="bg-gray-700 rounded-lg p-2 text-center">
                                <div className="text-xs text-gray-400 mb-1 truncate">{label}</div>
                                <div className="font-bold text-white tabular-nums text-sm">
                                  {r[key]}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
