'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function UsersPanel({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleApproval(id: string, current: boolean) {
    setLoading(id)
    const supabase = createClient()
    await supabase.from('profiles').update({ is_approved: !current }).eq('id', id)
    router.refresh()
    setLoading(null)
  }

  const pending = profiles.filter(p => !p.is_approved)
  const approved = profiles.filter(p => p.is_approved)

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-3">Users</h2>

      {pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-2">
            Pending approval ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map(p => (
              <div key={p.id} className="bg-orange-900/20 border border-orange-700/40 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-white font-medium">{p.username}</span>
                <button
                  onClick={() => toggleApproval(p.id, false)}
                  disabled={loading === p.id}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  {loading === p.id ? '…' : 'Approve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {approved.map(p => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white">{p.username}</span>
              {p.is_admin && (
                <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full">admin</span>
              )}
            </div>
            {p.id !== currentUserId && (
              <button
                onClick={() => toggleApproval(p.id, true)}
                disabled={loading === p.id}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
