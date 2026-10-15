export interface QuestPoint {
  lat: number
  lng: number
  title: string
  task: string
  answer: string
  hint: string
}

export type QuestStatus = 'published' | 'pending' | 'rejected'

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
  points: QuestPoint[]
}

export interface Team {
  id: number
  name: string
  avatar: string
  members: number
  quests: number
  points: number
  is_mine: boolean
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
  achievements: Achievement[]
}

export interface Complaint {
  id: number
  quest_title: string
  author: string
  reason: string
  date: string
}

export interface Stats {
  quests: number
  teams: number
  users: number
}

export interface User {
  id: number
  email: string
  name: string
  avatar: string
}
