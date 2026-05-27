'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  slotId: string
}

export default function SlotActions({ slotId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function deleteSlot() {
    if (!confirm('Delete this session and all its ratings?')) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('game_slots').delete().eq('id', slotId)
    router.refresh()
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-800 flex justify-end">
      <button
        onClick={deleteSlot}
        disabled={deleting}
        className="text-xs text-gray-600 hover:text-red-400 transition-colors"
      >
        {deleting ? 'Deleting…' : 'Delete session'}
      </button>
    </div>
  )
}
