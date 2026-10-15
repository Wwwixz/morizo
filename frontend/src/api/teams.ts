import type { JoinRequest, Team, User } from '../types'
import { mockTeams, mockUser } from './mock'

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
  /** id команд, в которые пользователь отправил запрос */
  pending: number[]
  /** id команд (из каталога), которые пользователь покинул */
  left: number[]
  /** правки команд из каталога (аватар, название, описание) по id */
  overrides: Record<string, Partial<Team>>
}

const EMPTY: Store = { created: [], joined: [], pending: [], left: [], overrides: {} }

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    const data = raw ? (JSON.parse(raw) as Partial<Store>) : {}
    return {
      created: data.created ?? [],
      joined: data.joined ?? [],
      pending: data.pending ?? [],
      left: data.left ?? [],
      overrides: data.overrides ?? {},
    }
  } catch {
    return { ...EMPTY }
  }
}

/** Текущий пользователь из localStorage (пишется UserContext) */
function currentUser(): User {
  try {
    const raw = localStorage.getItem('morizo_user')
    return raw ? (JSON.parse(raw) as User) : mockUser
  } catch {
    return mockUser
  }
}

/** Правки из каталога, сохранённые пользователем */
const withOverride = (t: Team, overrides: Store['overrides']): Team =>
  overrides[String(t.id)] ? { ...t, ...overrides[String(t.id)] } : { ...t }

/**
 * В команде, помеченной как «моя», всегда должен отображаться текущий
 * пользователь — даже если в исходных данных его нет (например, в каталоге).
 * Количество участников всегда равно длине списка.
 */
function withMe(t: Team, me: User): Team {
  if (!t.is_mine) return t
  const list = t.membersList ?? []
  const next = list.some((m) => m.id === me.id) ? list : [...list, { ...me, role: 'member' as const }]
  return { ...t, membersList: next, members: next.length }
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

/** Созданные команды + каталог, где учтены вступления и запросы */
export function listTeams(): Team[] {
  const store = read()
  const me = currentUser()
  const joined = new Set(store.joined)
  const pending = new Set(store.pending)
  const left = new Set(store.left)
  const catalog = mockTeams.map((t) => {
    const base = withOverride(t, store.overrides)
    if (joined.has(t.id)) return withMe({ ...base, is_mine: true }, me)
    if (pending.has(t.id)) {
      const list = (base.membersList ?? []).filter((m) => m.id !== me.id)
      return { ...base, is_mine: false, is_pending: true, membersList: list, members: list.length }
    }
    if (left.has(t.id)) {
      const list = (base.membersList ?? []).filter((m) => m.id !== me.id)
      return { ...base, is_mine: false, membersList: list, members: list.length }
    }
    return withMe(base, me)
  })
  const created = store.created.map((t) => withMe(withOverride(t, store.overrides), me))
  return [...created, ...catalog]
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

export function createTeam(name: string, description = '', user: User = mockUser, avatar?: string): Team {
  const store = read()
  const taken = new Set(listTeams().map((t) => (t.code ?? '').toUpperCase()))
  const team: Team = {
    id: Date.now(),
    name,
    description,
    avatar: avatar || '/img/avatars/u3.jpg',
    code: makeCode(taken),
    members: 1,
    quests: 0,
    points: 0,
    is_mine: true,
    requests: [],
    membersList: [{ ...user, role: 'president' }],
    achievements: [],
  }
  store.created.unshift(team)
  write(store)
  return team
}

/** Отправить запрос на вступление */
export function requestToJoin(id: number): JoinResult {
  const teams = listTeams()
  const team = teams.find((t) => t.id === id)
  if (!team) return { teams, error: 'Команда не найдена' }
  if (team.is_mine || team.is_pending) return { teams, error: 'Запрос уже отправлен или вы в команде' }
  if (team.members >= TEAM_MAX) return { teams, error: `В команде уже ${TEAM_MAX} участников` }

  const store = read()
  store.pending.push(id)
  // Если раньше выходили из этой команды, убираем из списка покинутых
  store.left = store.left.filter((x) => x !== id)
  write(store)
  return { teams: listTeams() }
}

/** Отменить отправленный запрос на вступление */
export function cancelRequest(id: number): JoinResult {
  const store = read()
  store.pending = store.pending.filter((x) => x !== id)
  write(store)
  return { teams: listTeams() }
}

/**
 * Выйти из команды.
 * Свою созданную команду при выходе расформировываем, из остальных просто убираем
 * пользователя (команду помечаем как «покинутую», чтобы она снова стала доступна).
 */
export function leaveTeam(id: number): Team[] {
  const store = read()
  const idx = store.created.findIndex((t) => t.id === id)
  if (idx !== -1) {
    store.created.splice(idx, 1)
  } else if (!store.left.includes(id)) {
    store.left.push(id)
  }
  store.joined = store.joined.filter((x) => x !== id)
  store.pending = store.pending.filter((x) => x !== id)
  write(store)
  return listTeams()
}

/** Мгновенное вступление (по коду) */
export function joinTeam(id: number, user: User): JoinResult {
  const teams = listTeams()
  const team = teams.find((t) => t.id === id)
  if (!team) return { teams, error: 'Команда не найдена' }
  if (team.is_mine) return { teams, error: 'Вы уже в этой команде' }
  if (team.members >= TEAM_MAX) return { teams, error: `В команде уже ${TEAM_MAX} участников` }

  const store = read()
  // Убираем из пендинга и списка покинутых, если были
  store.pending = store.pending.filter((x) => x !== id)
  store.left = store.left.filter((x) => x !== id)
  store.joined.push(id)
  
  // Обновляем список участников в хранилище, если это созданная команда
  const created = store.created.find(t => t.id === id)
  if (created) {
    created.members += 1
    created.membersList = [...(created.membersList || []), { ...user, role: 'member' }]
  }
  
  write(store)
  const updatedTeam: Team = {
    ...team,
    is_mine: true,
    members: team.members + 1,
    membersList: [...(team.membersList || []), { ...user, role: 'member' }],
  }
  return { teams: listTeams(), joined: updatedTeam }
}

export function joinByCode(code: string, user: User): JoinResult {
  const norm = code.trim().toUpperCase()
  const team = listTeams().find((t) => (t.code ?? '').toUpperCase() === norm)
  if (!team) return { teams: listTeams(), error: 'Команда с таким кодом не найдена' }
  return joinTeam(team.id, user)
}

/** Обновить информацию о команде (для владельца) */
export function updateTeam(id: number, data: Partial<Team>): Team[] {
  const store = read()
  const team = store.created.find((t) => t.id === id)
  // Созданную команду правим на месте, команду из каталога — через overrides,
  // чтобы изменения сохранялись и после перезагрузки.
  const target: Partial<Team> = team ?? (store.overrides[String(id)] ??= {})
  if (data.name) target.name = data.name
  if (data.description !== undefined) target.description = data.description
  if (data.avatar) target.avatar = data.avatar
  write(store)
  return listTeams()
}

/** Исключить участника из команды (для президента и вице-президента) */
export function removeMember(teamId: number, userId: number): Team[] {
  const store = read()
  const team = listTeams().find((t) => t.id === teamId)
  if (!team) return listTeams()

  const membersList = (team.membersList ?? []).filter((m) => m.id !== userId)
  const created = store.created.find((t) => t.id === teamId)
  if (created) {
    created.membersList = membersList
    created.members = membersList.length
  } else {
    // Команду из каталога правим через overrides, чтобы исключение сохранилось.
    store.overrides[String(teamId)] = {
      ...store.overrides[String(teamId)],
      membersList,
    }
  }
  write(store)
  return listTeams()
}

/** Одобрить запрос (для владельца) */
export function acceptRequest(teamId: number, user: JoinRequest): Team[] {
  const store = read()
  const team = store.created.find((t) => t.id === teamId)
  if (team) {
    team.members += 1
    team.requests = (team.requests || []).filter((r) => r.userId !== user.userId)
    team.membersList = [
      ...(team.membersList || []),
      { id: user.userId, name: user.userName, avatar: user.userAvatar, email: '', role: 'member' },
    ]
    write(store)
  }
  return listTeams()
}

/** Отклонить запрос (для владельца) */
export function rejectRequest(teamId: number, userId: number): Team[] {
  const store = read()
  const team = store.created.find((t) => t.id === teamId)
  if (team) {
    team.requests = (team.requests || []).filter((r) => r.userId !== userId)
    write(store)
  }
  return listTeams()
}
