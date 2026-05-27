'use client'

import { useState, useEffect } from 'react'
import type { RoomRanking } from '@/lib/types'

export interface TripOption {
  id: string
  label: string
  roomIds: string[]
}

function formatPost(rankings: RoomRanking[], notes: string[], intro: string): string {
  const total = rankings.length
  const lines: string[] = [intro, '']

  rankings.forEach((r, i) => {
    const rank = total - i
    lines.push(`מקום ${rank} — ${r.room.name}`)
    lines.push(`${r.room.company}, ${r.room.city} | ${r.room.time_limit} דקות`)
    lines.push(`ציון כולל: ${r.overall.toFixed(1)} | פאזלים: ${r.puzzles} | סיפור: ${r.story_theme} | אווירה: ${r.atmosphere} | קושי: ${r.difficulty}`)
    if (notes[i]?.trim()) lines.push(notes[i].trim())
    lines.push('')
  })

  return lines.join('\n').trimEnd()
}

function defaultIntro(count: number, tripLabel?: string): string {
  if (tripLabel) {
    return `הדירוג שלנו לחדרי בריחה - ${tripLabel}\n${count} חדרים, מהגרוע לטוב:`
  }
  return `הדירוג שלנו לחדרי בריחה\n${count} חדרים, מהגרוע לטוב:`
}

export default function ShareEditor({ rankings, trips }: { rankings: RoomRanking[]; trips: TripOption[] }) {
  const [selectedTripId, setSelectedTripId] = useState('')
  const [notes, setNotes] = useState<string[]>(rankings.map(() => ''))
  const [intro, setIntro] = useState(defaultIntro(rankings.length))
  const [copied, setCopied] = useState(false)

  const displayRankings = selectedTripId
    ? rankings.filter(r => {
        const trip = trips.find(t => t.id === selectedTripId)
        return trip ? trip.roomIds.includes(r.room.id) : true
      })
    : rankings

  // Reset notes and intro when trip selection changes
  useEffect(() => {
    const filtered = selectedTripId
      ? rankings.filter(r => {
          const trip = trips.find(t => t.id === selectedTripId)
          return trip ? trip.roomIds.includes(r.room.id) : true
        })
      : rankings

    setNotes(filtered.map(() => ''))

    const trip = trips.find(t => t.id === selectedTripId)
    setIntro(defaultIntro(filtered.length, trip?.label))
  }, [selectedTripId]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateNote(i: number, v: string) {
    setNotes(prev => prev.map((n, idx) => idx === i ? v : n))
  }

  async function copy() {
    await navigator.clipboard.writeText(formatPost(displayRankings, notes, intro))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const total = displayRankings.length

  if (rankings.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        אין חדרים מדורגים עדיין. דרגו כמה סשנים קודם!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Trip selector */}
      {trips.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <label className="block text-xs text-gray-500 mb-2">פוסט על טיול ספציפי (רשות)</label>
          <select
            dir="rtl"
            value={selectedTripId}
            onChange={e => setSelectedTripId(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:border-orange-500"
          >
            <option value="">כל החדרים</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>{trip.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Empty state when trip has no rated rooms */}
      {total === 0 && selectedTripId ? (
        <div className="text-center py-12 text-gray-500">
          אין חדרים מדורגים בטיול זה.
        </div>
      ) : (
        <>
          {/* Intro block */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <label className="block text-xs text-gray-500 mb-2">פתיחת הפוסט (ניתן לעריכה)</label>
            <textarea
              dir="rtl"
              value={intro}
              onChange={e => setIntro(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Rooms worst to best */}
          {displayRankings.map((r, i) => {
            const rank = total - i
            return (
              <div key={r.room.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-bold">מקום {rank}</span>
                      <span className="font-semibold text-white">{r.room.name}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {r.room.company} · {r.room.city} · {r.room.time_limit} דקות
                    </p>
                  </div>
                  <span className="text-3xl font-bold text-orange-400 shrink-0">{r.overall.toFixed(1)}</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[
                    { label: 'פאזלים', val: r.puzzles },
                    { label: 'סיפור', val: r.story_theme },
                    { label: 'אווירה', val: r.atmosphere },
                    { label: 'קושי', val: r.difficulty },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-gray-800 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="font-bold text-white text-sm">{val}</div>
                    </div>
                  ))}
                </div>

                <textarea
                  dir="rtl"
                  value={notes[i] ?? ''}
                  onChange={e => updateNote(i, e.target.value)}
                  rows={2}
                  placeholder="הוסף הערה על החדר הזה... (רשות)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            )
          })}

          {/* Preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-2">תצוגה מקדימה</p>
            <pre dir="rtl" className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
              {formatPost(displayRankings, notes, intro)}
            </pre>
          </div>

          <button
            onClick={copy}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {copied ? 'הועתק!' : 'העתק פוסט'}
          </button>
        </>
      )}
    </div>
  )
}
