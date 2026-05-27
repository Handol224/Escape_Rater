import { createClient } from '@/lib/supabase/server'
import type { EscapeRoom, RoomRanking } from '@/lib/types'
import ShareEditor from './ShareEditor'

async function getRankings(): Promise<RoomRanking[]> {
  const supabase = await createClient()

  const { data: rooms } = await supabase.from('escape_rooms').select('*').order('created_at')
  if (!rooms?.length) return []

  const { data: slots } = await supabase.from('game_slots').select('id, escape_room_id, escaped')
  const { data: ratings } = await supabase
    .from('ratings')
    .select('game_slot_id, puzzles, story_theme, atmosphere, difficulty, game_master')

  return rooms.map((room: EscapeRoom) => {
    const roomSlotIds = (slots ?? []).filter(s => s.escape_room_id === room.id).map(s => s.id)
    const roomRatings = (ratings ?? []).filter(r => roomSlotIds.includes(r.game_slot_id))
    const n = roomRatings.length

    const escapedCount = (slots ?? []).filter(s => s.escape_room_id === room.id && s.escaped === true).length

    if (n === 0) return { room, overall: 0, puzzles: 0, story_theme: 0, atmosphere: 0, difficulty: 0, game_master: 0, total_ratings: 0, slots_played: roomSlotIds.length, escaped_count: escapedCount }

    const avg = (key: keyof typeof roomRatings[0]) =>
      Math.round((roomRatings.reduce((s, r) => s + (r[key] as number), 0) / n) * 10) / 10

    const puzzles = avg('puzzles')
    const story_theme = avg('story_theme')
    const atmosphere = avg('atmosphere')
    const difficulty = avg('difficulty')
    const game_master = avg('game_master')
    const overall = Math.round(((puzzles + story_theme + atmosphere + difficulty + game_master) / 5) * 10) / 10

    return { room, overall, puzzles, story_theme, atmosphere, difficulty, game_master, total_ratings: n, slots_played: roomSlotIds.length, escaped_count: escapedCount }
  }).filter(r => r.total_ratings > 0)
}

export default async function SharePage() {
  const rankings = await getRankings()
  const sorted = [...rankings].sort((a, b) => a.overall - b.overall) // worst → best

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">פוסט לפייסבוק</h1>
        <p className="text-gray-400 text-sm mt-1">החדרים מסודרים מהגרוע לטוב. הוסיפו הערות ואז העתיקו.</p>
      </div>
      <ShareEditor rankings={sorted} />
    </div>
  )
}
