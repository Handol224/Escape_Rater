import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsersPanel from './UsersPanel'
import RoomsPanel from './RoomsPanel'
import RatingsPanel from './RatingsPanel'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  if (!me?.is_admin) redirect('/dashboard')

  const [{ data: profiles }, { data: rooms }, { data: slots }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at'),
    supabase.from('escape_rooms').select('*').order('created_at'),
    supabase
      .from('game_slots')
      .select('*, escape_rooms(name), ratings(*, profiles(username))')
      .order('played_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Panel</h1>

      <div className="space-y-8">
        <UsersPanel profiles={profiles ?? []} currentUserId={user!.id} />
        <RoomsPanel rooms={rooms ?? []} />
        <RatingsPanel slots={slots ?? []} />
      </div>
    </div>
  )
}
