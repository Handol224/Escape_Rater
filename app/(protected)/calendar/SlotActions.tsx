'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  slotId: string
  escaped: boolean | null
}

export default function SlotActions({ slotId, escaped }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(escaped)
  const [deleting, setDeleting] = useState(false)

  async function setEscaped(v: boolean | null) {
    setValue(v)
    const supabase = createClient()
    await supabase.from('game_slots').update({ escaped: v }).eq('id', slotId)
    router.refresh()
  }

  async function deleteSlot() {
    if (!confirm('Delete this session and all its ratings?')) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('game_slots').delete().eq('id', slotId)
    router.refresh()
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1">Escaped?</span>
        {([true, false, null] as const).map((v) => (
          <button
            key={String(v)}
            onClick={() => setEscaped(v)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
              value === v
                ? v === true  ? 'bg-green-700 text-white'
                  : v === false ? 'bg-red-800 text-white'
                  : 'bg-gray-700 text-gray-300'
                : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            {v === true ? '✅ Yes' : v === false ? '❌ No' : '— Unknown'}
          </button>
        ))}
      </div>
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
