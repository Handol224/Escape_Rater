export interface Profile {
  id: string
  username: string
  is_approved: boolean
  is_admin: boolean
  created_at: string
}

export interface EscapeRoom {
  id: string
  name: string
  city: string
  company: string
  time_limit: number
  created_at: string
}

export interface GameSlot {
  id: string
  escape_room_id: string
  played_at: string
  escaped: boolean | null
  created_at: string
  escape_rooms?: EscapeRoom
}

export interface Rating {
  id: string
  game_slot_id: string
  user_id: string
  puzzles: number
  story_theme: number
  atmosphere: number
  difficulty: number
  game_master: number
  comment: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface RoomRanking {
  room: EscapeRoom
  overall: number // sum of 4 categories, max 40
  puzzles: number
  story_theme: number
  atmosphere: number
  difficulty: number
  total_ratings: number
  slots_played: number
  escaped_count: number
}

export type SortKey =
  | 'overall'
  | 'puzzles'
  | 'story_theme'
  | 'atmosphere'
  | 'difficulty'
  | 'time_limit'

export const SORT_LABELS: Record<SortKey, string> = {
  overall: 'Overall Score',
  puzzles: 'Puzzles',
  story_theme: 'Story & Theme',
  atmosphere: 'Atmosphere',
  difficulty: 'Difficulty',
  time_limit: 'Time Played',
}

export const RATING_CATEGORIES: { key: 'puzzles' | 'story_theme' | 'atmosphere' | 'difficulty'; label: string }[] = [
  { key: 'puzzles', label: 'Puzzles' },
  { key: 'story_theme', label: 'Story & Theme' },
  { key: 'atmosphere', label: 'Atmosphere' },
  { key: 'difficulty', label: 'Difficulty' },
]

export interface Trip {
  id: string
  name: string | null
  city: string | null
  start_date: string
  end_date: string
  creator_id: string
  is_locked: boolean
  share_token: string
  invite_token: string
  created_at: string
}

export interface TripMember {
  trip_id: string
  user_id: string
  joined_at: string
  profiles?: Profile
}

export interface TripRoom {
  id: string
  trip_id: string
  escape_room_id: string
  game_slot_id: string | null
  added_by: string | null
  added_at: string
  escape_rooms?: EscapeRoom
  game_slots?: GameSlot
}
