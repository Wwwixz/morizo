import type {
  AnswerResult,
  Complaint,
  LeaderboardEntry,
  PlaySession,
  Profile,
  Quest,
  QuestPoint,
  QuestPointType,
  Stats,
  Team,
  User,
} from '../types'

/**
 * MORIZO — API-клиент реального бэкенда (Spring Boot).
 * В dev-режиме Vite проксирует /api и /uploads на бэкенд (см. vite.config.ts),
 * поэтому базовый путь пустой.
 */

const BASE = ''

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const TOKEN_KEY = 'morizo_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (init?.body && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(BASE + path, { ...init, headers })
  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : null
  if (!res.ok) {
    const err = data as { message?: string } | null
    throw new ApiError(res.status, err?.message || `Ошибка ${res.status}`)
  }
  return data as T
}

const json = (body: unknown) => JSON.stringify(body)

/** Ответ бэкенда может не совпадать с типом фронта — приводим к договорённому виду. */
/* eslint-disable @typescript-eslint/no-explicit-any */
const toPoint = (p: any): QuestPoint => ({
  lat: p.lat,
  lng: p.lng,
  title: p.title,
  task: p.task,
  hint: p.hint ?? '',
  type: p.type ? (String(p.type).toLowerCase() as QuestPointType) : undefined,
  options: p.options ?? undefined,
  point_rules: p.point_rules ?? undefined,
})

const toQuest = (q: any): Quest => ({
  ...q,
  gallery: q.gallery ?? [],
  points: (q.points ?? []).map(toPoint),
})

const toTeam = (t: any): Team => ({
  id: t.id,
  name: t.name,
  description: t.description,
  avatar: t.avatar,
  code: t.invite_code ?? undefined,
  members: t.members,
  quests: t.quests,
  points: t.points,
  is_mine: t.is_mine,
  is_creator: t.is_creator,
})

const toUser = (r: any): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  avatar: r.avatar,
  role: r.role,
  age_label: r.age_label,
})

const toSession = (s: any): PlaySession => ({
  ...s,
  current_point: s.current_point ? toPoint(s.current_point) : null,
  points: (s.points ?? []).map(toPoint),
})

export interface CreateQuestPayload {
  title: string
  description: string
  district: string
  difficulty: number
  duration_min: number
  players_min: number
  players_max: number
  rules?: string
  transport_mode?: string
  points: QuestPoint[]
}

export const api = {
  // ===== Статистика =====
  getStats: () => http<Stats>('/api/stats'),

  // ===== Квесты =====
  getQuests: async (status?: string): Promise<Quest[]> => {
    const qs = new URLSearchParams()
    if (status) qs.set('status', status)
    qs.set('size', '100')
    const list = await http<any[]>(`/api/quests?${qs}`)
    return list.map(toQuest)
  },

  getQuest: async (id: number): Promise<Quest | null> => {
    try {
      return toQuest(await http<any>(`/api/quests/${id}`))
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },

  createQuest: async (payload: CreateQuestPayload, cover?: File | null): Promise<Quest> => {
    const fd = new FormData()
    fd.append('quest', json(payload))
    if (cover) fd.append('cover', cover)
    return toQuest(await http<any>('/api/quests', { method: 'POST', body: fd }))
  },

  complain: (questId: number, reason: string) =>
    http<Complaint>('/api/quests/complaints', { method: 'POST', body: json({ quest_id: questId, reason }) }),

  // ===== Прохождение =====
  startPlay: async (questId: number, teamId?: number | null): Promise<PlaySession> =>
    toSession(await http<any>('/api/play/start', { method: 'POST', body: json({ quest_id: questId, team_id: teamId ?? null }) })),

  activeSession: async (questId: number): Promise<PlaySession | null> => {
    const s = await http<any>(`/api/quests/${questId}/active-session`)
    return s ? toSession(s) : null
  },

  getPlay: async (sessionId: number): Promise<PlaySession> =>
    toSession(await http<any>(`/api/play/${sessionId}`)),

  answer: (sessionId: number, answer: string) =>
    http<AnswerResult>(`/api/play/${sessionId}/answer`, { method: 'POST', body: json({ answer }) }),

  hint: (sessionId: number) =>
    http<QuestPoint>(`/api/play/${sessionId}/hint`, { method: 'POST' }),

  abandonPlay: async (sessionId: number): Promise<PlaySession> =>
    toSession(await http<any>(`/api/play/${sessionId}/abandon`, { method: 'POST' })),

  // ===== Команды =====
  getTeams: async (): Promise<Team[]> => (await http<any[]>('/api/teams')).map(toTeam),

  createTeam: async (name: string, description?: string): Promise<Team> =>
    toTeam(await http<any>('/api/teams', { method: 'POST', body: json({ name, description }) })),

  joinTeam: async (id: number): Promise<Team> =>
    toTeam(await http<any>(`/api/teams/${id}/join`, { method: 'POST' })),

  joinTeamByCode: async (code: string): Promise<Team> =>
    toTeam(await http<any>('/api/teams/join', { method: 'POST', body: json({ code }) })),

  leaveTeam: (id: number) => http<void>(`/api/teams/${id}/leave`, { method: 'DELETE' }),

  // ===== Рейтинг =====
  getLeaderboard: (tab: 'teams' | 'players', period: 'all' | 'month' | 'week') =>
    http<LeaderboardEntry[]>(`/api/leaderboard?tab=${tab}&period=${period}`),

  // ===== Профиль =====
  getProfile: () => http<Profile>('/api/profile'),
  getUserProfile: (id: number) => http<Profile>(`/api/profile/${id}`),

  // ===== Модерация =====
  moderationQueue: async (status = 'pending'): Promise<Quest[]> =>
    (await http<any[]>(`/api/moderation/quests?status=${status}`)).map(toQuest),

  approveQuest: async (id: number): Promise<Quest> =>
    toQuest(await http<any>(`/api/moderation/quests/${id}/approve`, { method: 'POST' })),

  rejectQuest: async (id: number, reason: string): Promise<Quest> =>
    toQuest(await http<any>(`/api/moderation/quests/${id}/reject`, { method: 'POST', body: json({ reason }) })),

  hideQuest: async (id: number): Promise<Quest> =>
    toQuest(await http<any>(`/api/moderation/quests/${id}/hide`, { method: 'POST' })),

  getComplaints: () => http<Complaint[]>('/api/moderation/complaints'),

  resolveComplaint: (id: number) =>
    http<void>(`/api/moderation/complaints/${id}/resolve`, { method: 'POST' }),

  // ===== Auth =====
  login: async (email: string, password: string): Promise<User> => {
    const res = await http<any>('/api/auth/login', { method: 'POST', body: json({ email, password }) })
    setToken(res.token)
    return toUser(res)
  },

  register: async (
    email: string,
    password: string,
    nickname: string,
    ageGroup: 'AGE_14_15' | 'AGE_16_17',
  ): Promise<User> => {
    const res = await http<any>('/api/auth/register', {
      method: 'POST',
      body: json({ email, password, nickname, age_group: ageGroup }),
    })
    setToken(res.token)
    return toUser(res)
  },

  logout: () => setToken(null),
}
