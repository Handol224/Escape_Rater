'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RATING_CATEGORIES } from '@/lib/types'
import type { Rating } from '@/lib/types'

interface Props {
  slotId: string
  userId: string
  existing: Rating | null
}

function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const color =
    value >= 8 ? 'text-green-400' :
    value >= 6 ? 'text-yellow-400' :
    value >= 1 ? 'text-red-400' :
    'text-gray-500'

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className={`text-2xl font-bold tabular-nums ${color}`}>
          {value === 0 ? '—' : value}
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-8 rounded text-xs font-semibold transition-colors ${
              n <= value
                ? n >= 8 ? 'bg-green-600 text-white'
                  : n >= 6 ? 'bg-yellow-600 text-white'
                  : 'bg-red-700 text-white'
                : 'bg-gray-700 text-gray-500 hover:bg-gray-600 hover:text-gray-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function RatingForm({ slotId, userId, existing }: Props) {
  const router = useRouter()
  const [scores, setScores] = useState({
    puzzles: existing?.puzzles ?? 0,
    story_theme: existing?.story_theme ?? 0,
    atmosphere: existing?.atmosphere ?? 0,
    difficulty: existing?.difficulty ?? 0,
  })
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const allScored = Object.values(scores).every(v => v > 0)
  const total = allScored
    ? (Object.values(scores).reduce((s, v) => s + v, 0) / 4).toFixed(1)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allScored) { setError('יש לדרג את כל 4 הקטגוריות.'); return }
    setError('')
    setLoading(true)

    const supabase = createClient()
    const payload = {
      game_slot_id: slotId,
      user_id: userId,
      ...scores,
      game_master: existing?.game_master ?? 5,
      comment: comment.trim() || null,
    }

    const { error } = existing
      ? await supabase.from('ratings').update(payload).eq('id', existing.id)
      : await supabase.from('ratings').insert(payload)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/calendar'), 1500)
  }

  if (done) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-white">הדירוג נשמר!</h2>
        <p className="text-gray-400 mt-1">מעביר...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3 mb-5">
        {RATING_CATEGORIES.map(({ key, label }) => (
          <ScoreSlider
            key={key}
            label={label}
            value={scores[key]}
            onChange={v => setScores(prev => ({ ...prev, [key]: v }))}
          />
        ))}
      </div>

      {total !== null && (
        <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl p-4 mb-5 flex items-center justify-between">
          <span className="text-gray-300 font-medium">הציון הכולל שלך</span>
          <span className="text-3xl font-bold text-orange-400">{total}</span>
        </div>
      )}

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          תגובה <span className="text-gray-600">(רשות)</span>
        </label>
        <textarea
          dir="rtl"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          placeholder="מה בלט? מה היה טוב או פחות טוב?"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !allScored}
        className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'שומר...' : existing ? 'עדכן דירוג' : 'שלח דירוג'}
      </button>
    </form>
  )
}
