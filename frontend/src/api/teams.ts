import type { Team } from '../types'
import { mockTeams } from './mock'

/**
 * Команды для прохождения квестов (frontend-only, хранится в localStorage):
 * создание команды и вступление по коду.
 */

/** В команде может быть от 2 до 6 человек */
export const TEAM_MIN = 2
export const TEAM_MAX = 6

/** Команда готова к прохождению квеста, если в ней 2–6 человек */
export const canTeamPlay = (team: Team) => team.members >= TEAM_MIN && team.members <= TEAM_MAX

export interface JoinResult {
  teams: Team[]
  /** команда, в которую вступили */
  joined?: Team
  error?: string
}

const KEY = 'morizo_teams'

interface Store {
  /** команды, созданные пользователем */
  created: Team[]
  /** id команд из каталога, в которые пользователь вступил */
  joined: number[]
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    const data = raw ? (JSON.parse(raw) as Partial<Store>) : {}
    return { created: data.created ?? [], joined: data.joined ?? [] }
  } catch {
    return { created: [], joined: [] }
  }
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

/** Созданные команды + каталог, где учтены вступления */
export function listTeams(): Team[] {
  const store = read()
  const joined = new Set(store.joined)
  const catalog = mockTeams.map((t) =>
    joined.has(t.id) ? { ...t, is_mine: true, members: t.members + 1 } : { ...t },
  )
  return [...store.created, ...catalog]
}

const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function makeCode(taken: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = ''
    for (let i = 0; i < 6; i++) code += CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)]
    if (!taken.has(code)) return code
  }
  return String(Date.now()).slice(-6)
}

export function createTeam(name: string, description = ''): Team {
  const store = read()
  const taken = new Set(listTeams().map((t) => (t.code ?? '').toUpperCase()))
  const team: Team = {
    id: Date.now(),
    name,
    description,
    avatar: '/img/avatars/u3.jpg',
    code: makeCode(taken),
    members: 1,
    quests: 0,
    points: 0,
    is_mine: true,
  }
  store.created.unshift(team)
  write(store)
  return team
}

export function joinTeam(id: number): JoinResult {
  const teams = listTeams()
  const team = teams.find((t) => t.id === id)
  if (!team) return { teams, error: 'Команда не найдена' }
  if (team.is_mine) return { teams, error: 'Вы уже в этой команде' }
  if (team.members >= TEAM_MAX) return { teams, error: `В команде уже ${TEAM_MAX} участников` }

  const store = read()
  store.joined.push(id)
  write(store)
  return { teams: listTeams(), joined: { ...team, is_mine: true, members: team.members + 1 } }
}

export function joinByCode(code: string): JoinResult {
  const norm = code.trim().toUpperCase()
  const team = listTeams().find((t) => (t.code ?? '').toUpperCase() === norm)
  if (!team) return { teams: listTeams(), error: 'Команда с таким кодом не найдена' }
  return joinTeam(team.id)
}
