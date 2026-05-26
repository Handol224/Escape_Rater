import { createClient } from '@/lib/supabase/server'
import type { EscapeRoom, RoomRanking } from '@/lib/types'
import { SORT_LABELS } from '@/lib/types'
import SortableDashboard from './SortableDashboard'

export interface Stats {
  totalSessions: number
  totalRooms: number
  avgScore: number
  escapeRate: number | null
}

async function getRankingsAndStats(): Promise<{ rankings: RoomRanking[]; stats: Stats }> {
  const supabase = await createClient()

  const { data: rooms } = await supabase.from('escape_rooms').select('*').order('created_at')
  if (!rooms?.length) return { rankings: [], stats: { totalSessions: 0, totalRooms: 0, avgScore: 0, escapeRate: null } }

  const { data: slots } = await supabase.from('game_slots').select('id, escape_room_id, escaped')
  const { data: ratings } = await supabase
    .from('ratings')
    .select('game_slot_id, puzzles, story_theme, atmosphere, difficulty')

  const rankings: RoomRanking[] = rooms.map((room: EscapeRoom) => {
    const roomSlotIds = (slots ?? []).filter(s => s.escape_room_id === room.id).map(s => s.id)
    const roomRatings = (ratings ?? []).filter(r => roomSlotIds.includes(r.game_slot_id))
    const n = roomRatings.length

    if (n === 0) return { room, overall: 0, puzzles: 0, story_theme: 0, atmosphere: 0, difficulty: 0, total_ratings: 0, slots_played: roomSlotIds.length }

    const avg = (key: keyof typeof roomRatings[0]) =>
      Math.round((roomRatings.reduce((s, r) => s + (r[key] as number), 0) / n) * 10) / 10

    const puzzles = avg('puzzles')
    const story_theme = avg('story_theme')
    const atmosphere = avg('atmosphere')
    const difficulty = avg('difficulty')
    const overall = Math.round(((puzzles + story_theme + atmosphere + difficulty) / 4) * 10) / 10

    return { room, overall, puzzles, story_theme, atmosphere, difficulty, total_ratings: n, slots_played: roomSlotIds.length }
  })

  const ratedSlotIds = new Set((ratings ?? []).map(r => r.game_slot_id))
  const totalSessions = (slots ?? []).filter(s => ratedSlotIds.has(s.id)).length
  const totalRooms = rankings.filter(r => r.total_ratings > 0).length
  const scoredRooms = rankings.filter(r => r.overall > 0)
  const avgScore = scoredRooms.length
    ? Math.round((scoredRooms.reduce((s, r) => s + r.overall, 0) / scoredRooms.length) * 10) / 10
    : 0

  const slotsWithEscaped = (slots ?? []).filter(s => s.escaped !== null)
  const escapeRate = slotsWithEscaped.length
    ? Math.round((slotsWithEscaped.filter(s => s.escaped).length / slotsWithEscaped.length) * 100)
    : null

  return { rankings, stats: { totalSessions, totalRooms, avgScore, escapeRate } }
}

export default async function DashboardPage() {
  const { rankings, stats } = await getRankingsAndStats()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Rankings</h1>
        <p className="text-gray-400 text-sm mt-1">All escape rooms ranked by your group&apos;s scores</p>
      </div>
      <SortableDashboard rankings={rankings} sortLabels={SORT_LABELS} stats={stats} />
    </div>
  )
}
