import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import TripDetail from './TripDetail'
import type { Trip, TripMember, TripRoom } from '@/lib/types'

interface TripWithRelations extends Trip {
  trip_members: (TripMember & { profiles?: { username: string } })[]
  trip_rooms: (TripRoom & {
    escape_rooms?: { id: string; name: string; city: string; company: string }
    game_slots?: { id: string; played_at: string }
  })[]
}

export default async function TripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin ?? false

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      *,
      trip_members(*, profiles(username)),
      trip_rooms(*, escape_rooms(id, name, city, company), game_slots(id, played_at))
    `)
    .eq('id', tripId)
    .single()

  if (!trip) notFound()

  const typedTrip = trip as TripWithRelations

  const isCreator = typedTrip.creator_id === user.id
  const isMember = typedTrip.trip_members.some(m => m.user_id === user.id)

  if (!isMember && !isAdmin) {
    redirect('/trips')
  }

  const { data: slots } = await supabase
    .from('game_slots')
    .select('id, escape_room_id, played_at, escape_rooms(name)')
    .order('played_at', { ascending: false })

  const { data: rooms } = await supabase
    .from('escape_rooms')
    .select('id, name, city, company')
    .order('name')

  return (
    <TripDetail
      trip={typedTrip}
      currentUserId={user.id}
      isAdmin={isAdmin}
      isCreator={isCreator}
      existingSlots={(slots ?? []) as unknown as { id: string; escape_room_id: string; played_at: string; escape_rooms?: { name: string } }[]}
      rooms={(rooms ?? []) as { id: string; name: string; city: string; company: string }[]}
    />
  )
}
