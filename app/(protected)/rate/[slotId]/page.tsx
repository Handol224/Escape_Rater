import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isPast } from 'date-fns'
import { format } from 'date-fns'
import RatingForm from './RatingForm'
import type { EscapeRoom, GameSlot, Rating } from '@/lib/types'

interface SlotWithRoom extends GameSlot {
  escape_rooms: EscapeRoom
}

export default async function RatePage({ params }: { params: Promise<{ slotId: string }> }) {
  const { slotId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: slot } = await supabase
    .from('game_slots')
    .select('*, escape_rooms(*)')
    .eq('id', slotId)
    .single() as { data: SlotWithRoom | null }

  if (!slot) redirect('/calendar')

  if (!isPast(new Date(slot.played_at))) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">⏰</div>
        <h2 className="text-xl font-bold text-white mb-2">Not yet!</h2>
        <p className="text-gray-400">
          You can rate this session after it happens on{' '}
          <span className="text-white">{format(new Date(slot.played_at), 'PPP')}</span>.
        </p>
      </div>
    )
  }

  const { data: existing } = await supabase
    .from('ratings')
    .select('*')
    .eq('game_slot_id', slotId)
    .eq('user_id', user!.id)
    .single() as { data: Rating | null }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{slot.escape_rooms.name}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {slot.escape_rooms.company} · {slot.escape_rooms.city} · {format(new Date(slot.played_at), 'PPP')}
        </p>
      </div>
      <RatingForm slotId={slotId} userId={user!.id} existing={existing} />
    </div>
  )
}
