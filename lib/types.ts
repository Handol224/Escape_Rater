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
  time_limit: number // minutes
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
  overall: number
  puzzles: number
  story_theme: number
  atmosphere: number
  difficulty: number
  game_master: number
  total_ratings: number
  slots_played: number
}

export type SortKey =
  | 'overall'
  | 'puzzles'
  | 'story_theme'
  | 'atmosphere'
  | 'difficulty'
  | 'game_master'
  | 'time_limit'

export const SORT_LABELS: Record<SortKey, string> = {
  overall: 'Overall Score',
  puzzles: 'Puzzles',
  story_theme: 'Story & Theme',
  atmosphere: 'Atmosphere',
  difficulty: 'Difficulty',
  game_master: 'Game Master',
  time_limit: 'Time Played',
}

export const RATING_CATEGORIES: { key: keyof Omit<Rating, 'id' | 'game_slot_id' | 'user_id' | 'comment' | 'created_at' | 'updated_at' | 'profiles'>; label: string }[] = [
  { key: 'puzzles', label: 'Puzzles' },
  { key: 'story_theme', label: 'Story & Theme' },
  { key: 'atmosphere', label: 'Atmosphere' },
  { key: 'difficulty', label: 'Difficulty' },
  { key: 'game_master', label: 'Game Master' },
]
