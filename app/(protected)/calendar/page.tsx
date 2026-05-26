import { createClient } from '@/lib/supabase/server'
import { format, isPast } from 'date-fns'
import Link from 'next/link'
import type { GameSlot, EscapeRoom, Rating, Profile } from '@/lib/types'
import AddSlotForm from './AddSlotForm'
import SlotActions from './SlotActions'

interface SlotWithDetails extends GameSlot {
  escape_rooms: EscapeRoom
  ratings: (Rating & { profiles: Profile })[]
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
    .select('id, name')
    .order('name')

  const typedSlots = (slots ?? []) as SlotWithDetails[]
  const isBacklog = (s: SlotWithDetails) => new Date(s.played_at).getFullYear() === 2000
  const upcoming = typedSlots.filter(s => !isBacklog(s) && !isPast(new Date(s.played_at)))
  const past = typedSlots.filter(s => isBacklog(s) || isPast(new Date(s.played_at)))

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

      {isAdmin && rooms && <AddSlotForm rooms={rooms} />}

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="space-y-3">
            {[...upcoming].reverse().map(slot => (
              <SlotCard key={slot.id} slot={slot} currentUserId={user!.id} canRate={false} playerCount={ALL_PLAYERS} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Past Sessions</h2>
          <div className="space-y-3">
            {past.map(slot => (
              <SlotCard key={slot.id} slot={slot} currentUserId={user!.id} canRate={true} playerCount={ALL_PLAYERS} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      )}

      {slots?.length === 0 && (
        <div className="text-center py-20 text-gray-500">No sessions scheduled yet.</div>
      )}
    </div>
  )
}

function EscapedBadge({ escaped }: { escaped: boolean | null }) {
  if (escaped === true)  return <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">✅ Escaped</span>
  if (escaped === false) return <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">❌ Did not escape</span>
  return null
}

function SlotCard({
  slot, currentUserId, canRate, playerCount, isAdmin,
}: {
  slot: SlotWithDetails
  currentUserId: string
  canRate: boolean
  playerCount: number
  isAdmin: boolean
}) {
  const ratings = slot.ratings ?? []
  const myRating = ratings.find(r => r.user_id === currentUserId)
  const unrated = playerCount - ratings.length
  const backlog = new Date(slot.played_at).getFullYear() === 2000

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white">{slot.escape_rooms?.name}</h3>
            <EscapedBadge escaped={slot.escaped} />
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            {slot.escape_rooms?.company} · {slot.escape_rooms?.city}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {backlog ? 'Backlog' : format(new Date(slot.played_at), 'PPP · p')} · {slot.escape_rooms?.time_limit} min
          </p>
        </div>

        {canRate && (
          <div className="shrink-0">
            {myRating ? (
              <Link href={`/rate/${slot.id}`} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
                Edit rating
              </Link>
            ) : (
              <Link href={`/rate/${slot.id}`} className="text-xs bg-orange-600 hover:bg-orange-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors">
                Rate this
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Ratings summary */}
      {canRate && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {ratings.map(r => (
              <span key={r.id} className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
                ✓ {r.profiles?.username}
              </span>
            ))}
            {unrated > 0 && (
              <span className="text-xs text-gray-600">{unrated} haven&apos;t rated yet</span>
            )}
          </div>

          {/* Comments */}
          {ratings.filter(r => r.comment).map(r => (
            <div key={r.id} className="text-xs text-gray-500 italic mt-1">
              <span className="text-gray-400 not-italic font-medium">{r.profiles?.username}:</span>{' '}
              &ldquo;{r.comment}&rdquo;
            </div>
          ))}
        </div>
      )}

      {/* Admin controls */}
      {isAdmin && canRate && (
        <SlotActions slotId={slot.id} escaped={slot.escaped} />
      )}
    </div>
  )
}
