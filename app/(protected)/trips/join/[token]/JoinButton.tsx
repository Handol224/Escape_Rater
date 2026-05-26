'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  tripId: string
  userId: string
}

export default function JoinButton({ tripId, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('trip_members').insert({
      trip_id: tripId,
      user_id: userId,
    })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push(`/trips/${tripId}`)
      router.refresh()
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleJoin}
        disabled={loading}
        className="bg-orange-600 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
      >
        {loading ? 'Joining...' : 'Join Trip'}
      </button>
    </div>
  )
}
