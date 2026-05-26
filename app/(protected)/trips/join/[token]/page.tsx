import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import JoinButton from './JoinButton'

export default async function JoinTripPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase
    .from('trips')
    .select('id, name, city, start_date, end_date, is_locked, trip_members(user_id)')
    .eq('invite_token', token)
    .single()

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center max-w-md">
          <p className="text-xl font-semibold text-white mb-2">Invalid invite link</p>
          <p className="text-gray-400 text-sm">This invite link is invalid or has expired.</p>
          <a href="/trips" className="mt-4 inline-block text-orange-400 hover:text-orange-300 text-sm transition-colors">
            Back to Trips
          </a>
        </div>
      </div>
    )
  }

  if (trip.is_locked) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center max-w-md">
          <p className="text-xl font-semibold text-white mb-2">Trip is locked</p>
          <p className="text-gray-400 text-sm">This trip is locked and no longer accepting new members.</p>
          <a href="/trips" className="mt-4 inline-block text-orange-400 hover:text-orange-300 text-sm transition-colors">
            Back to Trips
          </a>
        </div>
      </div>
    )
  }

  const members = (trip.trip_members ?? []) as { user_id: string }[]
  const alreadyMember = members.some(m => m.user_id === user.id)

  if (alreadyMember) {
    redirect(`/trips/${trip.id}`)
  }

  const memberCount = members.length
  const tripName = trip.name || [
    trip.city,
    `${format(new Date(trip.start_date + 'T00:00:00'), 'dd/MM/yy')} – ${format(new Date(trip.end_date + 'T00:00:00'), 'dd/MM/yy')}`,
  ].filter(Boolean).join(' | ')

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-white mb-1">You&apos;re invited to join a trip</h1>
        <p className="text-gray-400 text-sm mb-6">Join to see the planned rooms and collaborate with the group.</p>

        <div className="bg-gray-800 rounded-lg p-4 mb-6 space-y-1.5">
          <p className="text-white font-medium">{tripName}</p>
          {trip.city && <p className="text-gray-400 text-sm">{trip.city}</p>}
          <p className="text-gray-400 text-sm">
            {format(new Date(trip.start_date + 'T00:00:00'), 'dd/MM/yy')} – {format(new Date(trip.end_date + 'T00:00:00'), 'dd/MM/yy')}
          </p>
          <p className="text-gray-500 text-xs">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
        </div>

        <JoinButton tripId={trip.id} userId={user.id} />
      </div>
    </div>
  )
}
