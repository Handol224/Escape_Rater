import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { EscapeRoom, RoomRanking } from '@/lib/types'
import { SORT_LABELS } from '@/lib/types'
import SortableDashboard from './SortableDashboard'

export interface Stats {
  totalSessions: number
  totalRooms: number
  avgScore: number
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: rooms },
    { data: slots },
    { data: ratings },
    { data: userRatingsRaw },
    { data: backlogSlotsRaw },
    { data: userPlayedRaw },
  ] = await Promise.all([
    supabase.from('escape_rooms').select('*').order('created_at'),
    supabase.from('game_slots').select('id, escape_room_id, escaped'),
    supabase.from('ratings').select('game_slot_id, puzzles, story_theme, atmosphere, difficulty'),
    supabase.from('ratings').select('game_slot_id, game_slots(escape_room_id)').eq('user_id', user.id),
    supabase.from('game_slots').select('id, escape_room_id').lt('played_at', '2001-01-01'),
    supabase.from('user_played_rooms').select('id, room_id').eq('user_id', user.id),
  ])

  if (!rooms?.length) {
    const emptyStats: Stats = { totalSessions: 0, totalRooms: 0, avgScore: 0 }
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Rankings</h1>
          <p className="text-gray-400 text-sm mt-1">All escape rooms ranked by your group&apos;s scores</p>
        </div>
        <SortableDashboard
          rankings={[]}
          sortLabels={SORT_LABELS}
          stats={emptyStats}
          currentUserId={user.id}
          backlogSlotsByRoom={{}}
          userRatedSlotByRoom={{}}
          playedByRoom={{}}
        />
      </div>
    )
  }

  const rankings: RoomRanking[] = rooms.map((room: EscapeRoom) => {
    const roomSlotIds = (slots ?? []).filter(s => s.escape_room_id === room.id).map(s => s.id)
    const roomRatings = (ratings ?? []).filter(r => roomSlotIds.includes(r.game_slot_id))
    const n = roomRatings.length

    const escapedCount = (slots ?? []).filter(s => s.escape_room_id === room.id && s.escaped === true).length

    if (n === 0) return { room, overall: 0, puzzles: 0, story_theme: 0, atmosphere: 0, difficulty: 0, total_ratings: 0, slots_played: roomSlotIds.length, escaped_count: escapedCount }

    const avg = (key: keyof typeof roomRatings[0]) =>
      Math.round((roomRatings.reduce((s, r) => s + (r[key] as number), 0) / n) * 10) / 10

    const puzzles = avg('puzzles')
    const story_theme = avg('story_theme')
    const atmosphere = avg('atmosphere')
    const difficulty = avg('difficulty')
    const overall = Math.round(((puzzles + story_theme + atmosphere + difficulty) / 4) * 10) / 10

    return { room, overall, puzzles, story_theme, atmosphere, difficulty, total_ratings: n, slots_played: roomSlotIds.length, escaped_count: escapedCount }
  })

  const ratedSlotIds = new Set((ratings ?? []).map(r => r.game_slot_id))
  const totalSessions = (slots ?? []).filter(s => ratedSlotIds.has(s.id)).length
  const totalRooms = rankings.filter(r => r.total_ratings > 0).length
  const scoredRooms = rankings.filter(r => r.overall > 0)
  const avgScore = scoredRooms.length
    ? Math.round((scoredRooms.reduce((s, r) => s + r.overall, 0) / scoredRooms.length) * 10) / 10
    : 0

  // backlogSlotsByRoom: roomId → backlog slot id (year-2000 slots for rating without a trip)
  const backlogSlotsByRoom: Record<string, string> = {}
  for (const slot of (backlogSlotsRaw ?? [])) {
    backlogSlotsByRoom[slot.escape_room_id] = slot.id
  }

  // userRatedSlotByRoom: roomId → slot id the user has already rated
  const userRatedSlotByRoom: Record<string, string> = {}
  for (const r of (userRatingsRaw ?? []) as unknown as { game_slot_id: string; game_slots: { escape_room_id: string } | null }[]) {
    const roomId = r.game_slots?.escape_room_id
    if (roomId) userRatedSlotByRoom[roomId] = r.game_slot_id
  }

  // playedByRoom: roomId → user_played_rooms.id (for deletion)
  const playedByRoom: Record<string, string> = {}
  for (const p of (userPlayedRaw ?? [])) {
    playedByRoom[p.room_id] = p.id
  }

  const stats: Stats = { totalSessions, totalRooms, avgScore }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Rankings</h1>
        <p className="text-gray-400 text-sm mt-1">All escape rooms ranked by your group&apos;s scores</p>
      </div>
      <SortableDashboard
        rankings={rankings}
        sortLabels={SORT_LABELS}
        stats={stats}
        currentUserId={user.id}
        backlogSlotsByRoom={backlogSlotsByRoom}
        userRatedSlotByRoom={userRatedSlotByRoom}
        playedByRoom={playedByRoom}
      />
    </div>
  )
}
