import { createClient } from '@/lib/supabase/server'
import type { GameSlot, EscapeRoom, Rating, Profile } from '@/lib/types'
import AddSlotForm from './AddSlotForm'
import CalendarView from './CalendarView'

interface SlotWithDetails extends GameSlot {
  escape_rooms: EscapeRoom
  ratings: (Rating & { profiles: Profile })[]
}

type SlotForCalendar = {
  id: string
  played_at: string
  escaped: boolean | null
  escape_rooms: { id: string; name: string; city: string; company: string; time_limit: number }
  ratings: { id: string; user_id: string; comment: string | null; profiles: { username: string } | null }[]
}

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  const { data: slots } = await supabase
    .from('game_slots')
    .select(`*, escape_rooms(*), ratings(*, profiles(username))`)
    .order('played_at', { ascending: false })

  const { data: rooms } = await supabase
    .from('escape_rooms')
    .select('id, name, city, company')
    .order('name')

  // Trips where user is creator
  const { data: createdTrips } = await supabase
    .from('trips')
    .select('id, name, city, start_date, end_date')
    .eq('creator_id', user!.id)
    .eq('is_locked', false)

  // Trips where user is a member (but not creator)
  const { data: memberRows } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user!.id)

  const createdIds = new Set((createdTrips ?? []).map((t: { id: string }) => t.id))
  const joinedTripIds = (memberRows ?? [])
    .map((r: { trip_id: string }) => r.trip_id)
    .filter((id: string) => !createdIds.has(id))

  let joinedTrips: { id: string; name: string | null; city: string | null; start_date: string; end_date: string }[] = []
  if (joinedTripIds.length > 0) {
    const { data } = await supabase
      .from('trips')
      .select('id, name, city, start_date, end_date')
      .in('id', joinedTripIds)
      .eq('is_locked', false)
    joinedTrips = (data ?? []) as typeof joinedTrips
  }

  const activeTrips = [
    ...(createdTrips ?? []),
    ...joinedTrips,
  ] as { id: string; name: string | null; city: string | null; start_date: string; end_date: string }[]

  const typedSlots = (slots ?? []) as SlotWithDetails[]
  const isAdmin = profile?.is_admin ?? false
  const ALL_PLAYERS = 4

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-gray-400 text-sm mt-1">Scheduled escape room sessions</p>
        </div>
      </div>

      {isAdmin && rooms && (
        <AddSlotForm rooms={rooms} activeTrips={activeTrips} userId={user!.id} />
      )}

      <CalendarView
        slots={typedSlots as SlotForCalendar[]}
        currentUserId={user!.id}
        isAdmin={isAdmin}
        playerCount={ALL_PLAYERS}
      />
    </div>
  )
}
