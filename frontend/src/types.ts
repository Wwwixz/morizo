export type QuestPointType = 'word' | 'choice'

export interface QuestPoint {
  lat: number
  lng: number
  title: string
  task: string
  /** правильный ответ приходит только от бэкенда в сессии прохождения */
  answer?: string
  hint: string
  /** 'word' — ввод кодового слова, 'choice' — выбор варианта */
  type?: QuestPointType
  options?: string[] | null
  point_rules?: string
}

export type QuestStatus = 'published' | 'pending' | 'draft' | 'rejected' | 'archived'

/** Точка сбора, с которой начинается прохождение */
export interface QuestStart {
  lat: number
  lng: number
}

export interface Quest {
  id: number
  title: string
  description: string
  district: string
  difficulty: number // 1..5
  distance_km: number
  duration_min: number
  players_min: number
  players_max: number
  points_count: number
  image: string
  gallery: string[]
  status: QuestStatus
  popular: boolean
  is_new: boolean
  rating: number
  tag: string
  /** опциональные поля бэкенда */
  rules?: string | null
  transport_mode?: string
  transport_label?: string
  author?: string
  author_id?: number
  rejection_reason?: string | null
  start?: QuestStart
  points: QuestPoint[]
}

export interface Team {
  id: number
  name: string
  description?: string
  avatar: string
  /** код приглашения — по нему вступают в команду */
  code?: string
  members: number
  quests: number
  points: number
  is_mine: boolean
  is_creator?: boolean
}

export interface Achievement {
  id: number
  title: string
  description: string
  color: string
}

export interface Profile {
  name: string
  age_label: string
  avatar: string
  level: number
  xp: number
  xp_next: number
  quests_done: number
  teams: number
  score?: number
  achievements: Achievement[]
}

export interface Complaint {
  id: number
  quest_title: string
  author: string
  reason: string
  date: string
  status?: string
}

export interface Stats {
  quests: number
  teams: number
  users: number
}

export type UserRole = 'USER' | 'MODERATOR'

export interface User {
  id: number
  email: string
  name: string
  avatar: string
  role?: UserRole
  age_label?: string
}

export interface LeaderboardEntry {
  place: number
  id: number
  name: string
  avatar: string
  members?: number
  quests: number
  points: number
  is_mine?: boolean
}

export type PlayStatus = 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'

/** Сессия прохождения (ответ бэкенда). */
export interface PlaySession {
  session_id: number
  quest_id: number
  quest_title: string
  status: PlayStatus
  current: number
  total: number
  progress: string
  score: number
  finished: boolean
  current_point: QuestPoint | null
  points: QuestPoint[]
  team_id: number | null
  counted_for_rating: boolean
  started_at: number
  finished_at: number | null
}

/** Результат проверки ответа. */
export interface AnswerResult {
  correct: boolean
  current: number
  total: number
  progress: string
  finished: boolean
  score: number
  score_gained?: number
  attempts_left: number
  retry_after_ms?: number | null
  new_achievements?: string[]
}
