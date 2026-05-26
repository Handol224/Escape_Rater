import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreateTripForm from './CreateTripForm'

export default async function NewTripPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin ?? false

  if (!isAdmin) {
    // Count unlocked trips created by this user
    const { count } = await supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', user.id)
      .eq('is_locked', false)

    if ((count ?? 0) >= 2) {
      redirect('/trips?error=limit')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New Trip</h1>
        <p className="text-gray-400 text-sm mt-1">Plan a group escape room outing</p>
      </div>
      <CreateTripForm userId={user.id} />
    </div>
  )
}
