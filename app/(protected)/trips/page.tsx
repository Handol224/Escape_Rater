import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Trip, TripMember, TripRoom } from '@/lib/types'

interface TripWithCounts extends Trip {
  trip_members: TripMember[]
  trip_rooms: TripRoom[]
}

function formatTripName(trip: Trip) {
  if (trip.name) return trip.name
  const dateStr = `${format(new Date(trip.start_date + 'T00:00:00'), 'dd/MM/yy')} – ${format(new Date(trip.end_date + 'T00:00:00'), 'dd/MM/yy')}`
  return [trip.city, dateStr].filter(Boolean).join(' | ')
}

export default async function TripsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin ?? false

  // Fetch all trips where user is creator or member
  const { data: createdTrips } = await supabase
    .from('trips')
    .select('*, trip_members(*), trip_rooms(*)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  const { data: memberRows } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user.id)

  const memberTripIds = (memberRows ?? []).map(r => r.trip_id)
  const createdIds = new Set((createdTrips ?? []).map((t: TripWithCounts) => t.id))

  // Joined trips (member but not creator)
  const joinedTripIds = memberTripIds.filter(id => !createdIds.has(id))

  let joinedTrips: TripWithCounts[] = []
  if (joinedTripIds.length > 0) {
    const { data } = await supabase
      .from('trips')
      .select('*, trip_members(*), trip_rooms(*)')
      .in('id', joinedTripIds)
      .order('created_at', { ascending: false })
    joinedTrips = (data ?? []) as TripWithCounts[]
  }

  const myTrips = (createdTrips ?? []) as TripWithCounts[]
  const unlockedCreated = myTrips.filter(t => !t.is_locked).length
  const canCreate = isAdmin || unlockedCreated < 2

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trips</h1>
          <p className="text-gray-400 text-sm mt-1">Plan and share your escape room outings</p>
        </div>
        <div className="relative group">
          <Link
            href={canCreate ? '/trips/new' : '#'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canCreate
                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
            onClick={e => !canCreate && e.preventDefault()}
          >
            + New Trip
          </Link>
          {!canCreate && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Max 2 active trips
            </div>
          )}
        </div>
      </div>

      {error === 'limit' && (
        <div className="mb-6 bg-red-900/30 border border-red-800 text-red-400 rounded-xl px-4 py-3 text-sm">
          You have reached the maximum of 2 active trips. Lock a trip to free up a slot.
        </div>
      )}

      {myTrips.length === 0 && joinedTrips.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">No trips yet</p>
          <p className="text-sm">Create a trip to start planning your next escape room outing.</p>
        </div>
      )}

      {myTrips.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">My Trips</h2>
          <div className="space-y-3">
            {myTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {joinedTrips.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Joined Trips</h2>
          <div className="space-y-3">
            {joinedTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TripCard({ trip }: { trip: TripWithCounts }) {
  const memberCount = trip.trip_members?.length ?? 0
  const roomCount = trip.trip_rooms?.length ?? 0
  const startStr = format(new Date(trip.start_date + 'T00:00:00'), 'dd/MM/yy')
  const endStr = format(new Date(trip.end_date + 'T00:00:00'), 'dd/MM/yy')

  return (
    <Link href={`/trips/${trip.id}`} className="block">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white">{formatTripName(trip)}</h3>
              {trip.is_locked && (
                <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full">Locked</span>
              )}
            </div>
            {trip.city && <p className="text-gray-400 text-sm mt-0.5">{trip.city}</p>}
            <p className="text-gray-500 text-xs mt-1">
              {startStr} – {endStr}
            </p>
          </div>
          <div className="text-right text-xs text-gray-500 shrink-0">
            <p>{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
            <p>{roomCount} room{roomCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
