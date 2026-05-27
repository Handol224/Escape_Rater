import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/app/components/Navbar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_admin, is_approved')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved) redirect('/pending')

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar username={profile.username} userId={user.id} isAdmin={profile.is_admin} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
