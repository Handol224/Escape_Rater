'use client'
import { useState } from 'react'
import Link from 'next/link'
import { format, isPast } from 'date-fns'
import SlotActions from './SlotActions'

interface SlotForCalendar {
  id: string
  played_at: string
  escaped: boolean | null
  escape_rooms: {
    id: string
    name: string
    city: string
    company: string
    time_limit: number
  }
  ratings: {
    id: string
    user_id: string
    comment: string | null
    profiles: { username: string } | null
  }[]
}

interface Props {
  slots: SlotForCalendar[]
  currentUserId: string
  isAdmin: boolean
  playerCount: number
}

type CalView = 'month' | 'week' | 'day' | 'list'

function isBacklogSlot(slot: SlotForCalendar) {
  return new Date(slot.played_at).getFullYear() === 2000
}

function getCalendarGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1)
  const start = new Date(firstOfMonth)
  start.setDate(start.getDate() - start.getDay())
  const days: Date[] = []
  const cur = new Date(start)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function EscapedBadge({ escaped }: { escaped: boolean | null }) {
  if (escaped === true)
    return (
      <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
        ✅ Escaped
      </span>
    )
  if (escaped === false)
    return (
      <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">
        ❌ Did not escape
      </span>
    )
  return null
}

function SlotCard({
  slot,
  currentUserId,
  canRate,
  playerCount,
  isAdmin,
}: {
  slot: SlotForCalendar
  currentUserId: string
  canRate: boolean
  playerCount: number
  isAdmin: boolean
}) {
  const ratings = slot.ratings ?? []
  const myRating = ratings.find(r => r.user_id === currentUserId)
  const unrated = playerCount - ratings.length
  const backlog = isBacklogSlot(slot)

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white">{slot.escape_rooms?.name}</h3>
            <EscapedBadge escaped={slot.escaped} />
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            {slot.escape_rooms?.company} · {slot.escape_rooms?.city}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {backlog ? 'Backlog' : format(new Date(slot.played_at), 'PPP · p')} · {slot.escape_rooms?.time_limit} min
          </p>
        </div>
        {canRate && (
          <div className="shrink-0">
            {myRating ? (
              <Link
                href={`/rate/${slot.id}`}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                Edit rating
              </Link>
            ) : (
              <Link
                href={`/rate/${slot.id}`}
                className="text-xs bg-orange-600 hover:bg-orange-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Rate this
              </Link>
            )}
          </div>
        )}
      </div>
      {canRate && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {ratings.map(r => (
              <span key={r.id} className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
                ✓ {r.profiles?.username}
              </span>
            ))}
            {unrated > 0 && (
              <span className="text-xs text-gray-600">{unrated} haven&apos;t rated yet</span>
            )}
          </div>
          {ratings.filter(r => r.comment).map(r => (
            <div key={r.id} className="text-xs text-gray-500 italic mt-1">
              <span className="text-gray-400 not-italic font-medium">{r.profiles?.username}:</span>{' '}
              &ldquo;{r.comment}&rdquo;
            </div>
          ))}
        </div>
      )}
      {isAdmin && <SlotActions slotId={slot.id} escaped={slot.escaped} />}
    </div>
  )
}

function SlotChip({ slot, onClick }: { slot: SlotForCalendar; onClick: () => void }) {
  const time = format(new Date(slot.played_at), 'HH:mm')
  return (
    <div className="relative group">
      <div
        onClick={onClick}
        className="bg-orange-900/40 text-orange-300 text-xs rounded px-1 py-0.5 truncate leading-tight cursor-pointer hover:bg-orange-900/60"
      >
        {slot.escape_rooms?.name}
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
        {time}
      </div>
    </div>
  )
}

export default function CalendarView({ slots, currentUserId, isAdmin, playerCount }: Props) {
  const [view, setView] = useState<CalView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const realSlots = slots.filter(s => !isBacklogSlot(s))
  const slotsByDate = new Map<string, SlotForCalendar[]>()
  realSlots.forEach(s => {
    const key = new Date(s.played_at).toISOString().slice(0, 10)
    if (!slotsByDate.has(key)) slotsByDate.set(key, [])
    slotsByDate.get(key)!.push(s)
  })

  return (
    <div>
      {/* Header: view toggle + navigation */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        {/* View selector */}
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {(['month', 'week', 'day', 'list'] as CalView[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                view === v
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Navigation — hidden for list view */}
        {view !== 'list' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (view === 'month')
                  setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                else if (view === 'week')
                  setCurrentDate(d => {
                    const n = new Date(d)
                    n.setDate(n.getDate() - 7)
                    return n
                  })
                else
                  setCurrentDate(d => {
                    const n = new Date(d)
                    n.setDate(n.getDate() - 1)
                    return n
                  })
              }}
              className="text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              ‹
            </button>
            <span className="text-white text-sm font-medium w-40 text-center">
              {view === 'month' && format(currentDate, 'MMMM yyyy')}
              {view === 'week' &&
                (() => {
                  const start = getWeekStart(currentDate)
                  const end = new Date(start)
                  end.setDate(start.getDate() + 6)
                  return `${format(start, 'dd MMM')} – ${format(end, 'dd MMM yyyy')}`
                })()}
              {view === 'day' && format(currentDate, 'EEEE, dd MMM yyyy')}
            </span>
            <button
              onClick={() => {
                if (view === 'month')
                  setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                else if (view === 'week')
                  setCurrentDate(d => {
                    const n = new Date(d)
                    n.setDate(n.getDate() + 7)
                    return n
                  })
                else
                  setCurrentDate(d => {
                    const n = new Date(d)
                    n.setDate(n.getDate() + 1)
                    return n
                  })
              }}
              className="text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div>
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-7 mb-1 min-w-[560px]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs text-gray-500 py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-800 rounded-lg overflow-hidden min-w-[560px]">
            {getCalendarGrid(currentDate.getFullYear(), currentDate.getMonth()).map((day, idx) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const dateKey = day.toISOString().slice(0, 10)
              const daySlots = slotsByDate.get(dateKey) ?? []
              const isToday = isSameDay(day, new Date())
              return (
                <div
                  key={idx}
                  className={`bg-gray-900 min-h-[80px] p-1.5 ${!isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  <p
                    className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full cursor-pointer ${
                      isToday
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => {
                      setView('day')
                      setCurrentDate(new Date(day))
                    }}
                  >
                    {day.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {daySlots.map(slot => (
                      <SlotChip
                        key={slot.id}
                        slot={slot}
                        onClick={() => {
                          setView('day')
                          setCurrentDate(new Date(day))
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div>
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-7 mb-1 min-w-[560px]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs text-gray-500 py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-800 rounded-lg overflow-hidden min-w-[560px]">
            {getWeekDays(currentDate).map((day, idx) => {
              const dateKey = day.toISOString().slice(0, 10)
              const daySlots = slotsByDate.get(dateKey) ?? []
              const isToday = isSameDay(day, new Date())
              return (
                <div key={idx} className="bg-gray-900 min-h-[100px] p-1.5">
                  <p
                    className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full cursor-pointer ${
                      isToday
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => {
                      setView('day')
                      setCurrentDate(new Date(day))
                    }}
                  >
                    {day.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {daySlots.map(slot => (
                      <SlotChip
                        key={slot.id}
                        slot={slot}
                        onClick={() => {
                          setView('day')
                          setCurrentDate(new Date(day))
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </div>
      )}

      {/* Day view */}
      {view === 'day' && (
        <div>
          {(() => {
            const dateKey = currentDate.toISOString().slice(0, 10)
            const daySlots = slotsByDate.get(dateKey) ?? []
            if (daySlots.length === 0) {
              return (
                <p className="text-gray-500 text-sm text-center py-12">
                  No sessions on this day.
                </p>
              )
            }
            return (
              <div className="space-y-3">
                {daySlots.map(slot => {
                  const canRate = isPast(new Date(slot.played_at))
                  return (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      currentUserId={currentUserId}
                      canRate={canRate}
                      playerCount={playerCount}
                      isAdmin={isAdmin}
                    />
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div>
          {(() => {
            const upcoming = slots.filter(
              s => !isBacklogSlot(s) && !isPast(new Date(s.played_at))
            )
            const past = slots.filter(
              s => isBacklogSlot(s) || isPast(new Date(s.played_at))
            )
            return (
              <>
                {upcoming.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Upcoming
                    </h2>
                    <div className="space-y-3">
                      {[...upcoming].reverse().map(slot => (
                        <SlotCard
                          key={slot.id}
                          slot={slot}
                          currentUserId={currentUserId}
                          canRate={false}
                          playerCount={playerCount}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  </section>
                )}
                {past.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Past Sessions
                    </h2>
                    <div className="space-y-3">
                      {past.map(slot => (
                        <SlotCard
                          key={slot.id}
                          slot={slot}
                          currentUserId={currentUserId}
                          canRate={true}
                          playerCount={playerCount}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  </section>
                )}
                {slots.length === 0 && (
                  <div className="text-center py-20 text-gray-500">
                    No sessions scheduled yet.
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
