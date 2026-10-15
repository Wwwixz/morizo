import type { Complaint, Profile, Quest, QuestStatus, Stats, Team, User } from '../types'
import { mockComplaints, mockProfile, mockQuests, mockStats, mockTeams, mockUser } from './mock'

/**
 * MORIZO — frontend-only: все данные берутся из локальных mock-данных.
 * При появлении реального бэкенда достаточно заменить методы на HTTP-запросы —
 * типы и контракты уже готовы.
 */

const delay = <T>(data: T, ms = 120): Promise<T> => new Promise((r) => setTimeout(() => r(data), ms))

export const api = {
  getStats: () => delay(mockStats),

  getQuests: (status?: QuestStatus) =>
    delay(status ? mockQuests.filter((q) => q.status === status) : mockQuests),

  getQuest: (id: number) => delay(mockQuests.find((q) => q.id === id)),

  createQuest: (payload: Partial<Quest>) =>
    delay<Quest>({
      id: Date.now(),
      title: payload.title || 'Новый квест',
      description: payload.description || '',
      district: payload.district || 'Нижегородский район',
      difficulty: payload.difficulty || 1,
      distance_km: 3,
      duration_min: 100,
      players_min: 2,
      players_max: 5,
      points_count: payload.points?.length || 0,
      image: '/img/quest-street.jpg',
      gallery: [],
      status: 'pending',
      popular: false,
      is_new: true,
      rating: 0,
      tag: 'Новинка',
      points: payload.points || [],
    }),

  moderateQuest: (id: number, approve: boolean) => {
    const q = mockQuests.find((x) => x.id === id)
    if (q) q.status = approve ? 'published' : 'rejected'
    return delay(q)
  },

  getTeams: () => delay(mockTeams),

  joinTeam: (id: number) => {
    const t = mockTeams.find((x) => x.id === id)
    if (t && !t.is_mine) {
      t.is_mine = true
      t.members += 1
    }
    return delay(mockTeams)
  },

  createTeam: (name: string) => {
    mockTeams.unshift({
      id: Date.now(),
      name,
      avatar: '/img/avatars/u1.jpg',
      members: 1,
      quests: 0,
      points: 0,
      is_mine: true,
    })
    return delay(mockTeams)
  },

  getProfile: () => delay(mockProfile),

  getComplaints: () => delay(mockComplaints),

  login: (email: string) => delay<User>({ ...mockUser, email }),

  register: (email: string) => delay<User>({ ...mockUser, email }),
}
