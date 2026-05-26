'use client'

import { useState } from 'react'
import type { RoomRanking } from '@/lib/types'

const MEDALS = ['🥇', '🥈', '🥉']

function medal(i: number, total: number) {
  const fromTop = total - 1 - i
  return MEDALS[fromTop] ?? `${total - i}.`
}

function formatPost(rankings: RoomRanking[], notes: string[], intro: string): string {
  const total = rankings.length
  const lines: string[] = [intro, '']

  rankings.forEach((r, i) => {
    const rank = total - i
    const pos = MEDALS[total - 1 - i] ? `${MEDALS[total - 1 - i]} #${rank}` : `#${rank}`
    lines.push(`${pos} — ${r.room.name}`)
    lines.push(`📍 ${r.room.company}, ${r.room.city} · ⏱ ${r.room.time_limit} min`)
    lines.push(`⭐ Overall: ${r.overall.toFixed(1)}  |  🧩 Puzzles: ${r.puzzles}  |  📖 Story: ${r.story_theme}  |  🎭 Atmosphere: ${r.atmosphere}  |  💪 Difficulty: ${r.difficulty}  |  🎙️ GM: ${r.game_master}`)
    if (notes[i]?.trim()) lines.push(notes[i].trim())
    lines.push('')
  })

  return lines.join('\n').trimEnd()
}

export default function ShareEditor({ rankings }: { rankings: RoomRanking[] }) {
  const [notes, setNotes] = useState<string[]>(rankings.map(() => ''))
  const [intro, setIntro] = useState(`🔒 Our Escape Room Rankings 🔒\nRated by the crew — ${rankings.length} rooms, ranked worst to best:`)
  const [copied, setCopied] = useState(false)

  function updateNote(i: number, v: string) {
    setNotes(prev => prev.map((n, idx) => idx === i ? v : n))
  }

  async function copy() {
    await navigator.clipboard.writeText(formatPost(rankings, notes, intro))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const total = rankings.length

  if (total === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No rated rooms yet. Rate some sessions first!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Intro block */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <label className="block text-xs text-gray-500 mb-2">Post intro (editable)</label>
        <textarea
          value={intro}
          onChange={e => setIntro(e.target.value)}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Rooms worst → best */}
      {rankings.map((r, i) => {
        const fromTop = total - 1 - i
        const rankLabel = MEDALS[fromTop] ? `${MEDALS[fromTop]} #${total - i}` : `#${total - i}`

        return (
          <div key={r.room.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{rankLabel}</span>
                  <span className="font-semibold text-white">{r.room.name}</span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  {r.room.company} · {r.room.city} · {r.room.time_limit} min
                </p>
              </div>
              <span className="text-2xl font-bold text-orange-400 shrink-0">{r.overall.toFixed(1)}</span>
            </div>

            {/* Score row */}
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {[
                { label: 'Puzzles', val: r.puzzles },
                { label: 'Story', val: r.story_theme },
                { label: 'Atmosphere', val: r.atmosphere },
                { label: 'Difficulty', val: r.difficulty },
                { label: 'GM', val: r.game_master },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-800 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="font-bold text-white text-sm">{val}</div>
                </div>
              ))}
            </div>

            {/* Note textarea */}
            <textarea
              value={notes[i]}
              onChange={e => updateNote(i, e.target.value)}
              rows={2}
              placeholder="Add a note about this room… (optional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        )
      })}

      {/* Preview */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-2">Preview</p>
        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
          {formatPost(rankings, notes, intro)}
        </pre>
      </div>

      {/* Copy button */}
      <button
        onClick={copy}
        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {copied ? '✅ Copied to clipboard!' : '📋 Copy post'}
      </button>
    </div>
  )
}
