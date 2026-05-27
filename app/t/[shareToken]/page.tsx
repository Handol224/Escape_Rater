import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

function formatDate(dateStr: string) {
  return format(new Date(dateStr + 'T00:00:00'), 'MMM d, yyyy')
}

export default async function PublicTripPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id,
      name,
      city,
      start_date,
      end_date,
      is_locked,
      trip_rooms(
        id,
        game_slot_id,
        escape_rooms(id, name, city, company)
      )
    `)
    .eq('share_token', shareToken)
    .eq('is_locked', true)
    .single()

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl font-semibold text-white mb-2">Trip not available</p>
          <p className="text-gray-400 text-sm">This trip isn&apos;t available yet.</p>
        </div>
      </div>
    )
  }

  const tripName = trip.name || [
    trip.city,
    `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`,
  ].filter(Boolean).join(' | ')

  const rooms = (trip.trip_rooms ?? []) as unknown as {
    id: string
    game_slot_id: string | null
    escape_rooms: { id: string; name: string; city: string; company: string } | null
  }[]

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{tripName}</h1>
          <div className="flex items-center gap-3 flex-wrap text-gray-400 text-sm">
            {trip.city && <span>{trip.city}</span>}
            {trip.city && <span className="text-gray-600">·</span>}
            <span>
              {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            </span>
          </div>
        </div>

        {/* Rooms */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Planned Rooms
          </h2>

          {rooms.length === 0 && (
            <p className="text-gray-500 text-sm">No rooms planned.</p>
          )}

          <div className="space-y-3">
            {rooms.map(tr => {
              const room = tr.escape_rooms
              if (!room) return null
              const played = tr.game_slot_id !== null

              return (
                <div key={tr.id} className="flex items-center justify-between gap-4 p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium text-sm">{room.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {room.city}{room.city && room.company ? ' · ' : ''}{room.company}
                    </p>
                  </div>
                  {played && (
                    <span className="shrink-0 text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
                      Played
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-8">Created with Escape Rater</p>
      </div>
    </div>
  )
}
