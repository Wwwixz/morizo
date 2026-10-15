import type { Quest } from '../types'

/**
 * Состояние прохождения квеста (frontend-only, хранится в localStorage).
 * Строгий порядок: точки проходятся по очереди, индекс следующей = done.length.
 */

export type RunStatus = 'started' | 'progress' | 'done' | 'abandoned'

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  started: 'Начато',
  progress: 'В процессе',
  done: 'Завершено',
  abandoned: 'Брошено',
}

/** Команда, которой проходят квест */
export interface RunTeam {
  id: number
  name: string
  members: number
}

export interface QuestRun {
  quest_id: number
  total: number
  /** индексы пройденных точек в порядке прохождения */
  done: number[]
  started_at: string
  finished_at?: string
  abandoned?: boolean
  /** командное прохождение; при соло-прохождении поля нет */
  team?: RunTeam
}

const KEY = 'morizo_runs'

type Store = Record<string, QuestRun>

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function save(run: QuestRun): QuestRun {
  const store = read()
  store[run.quest_id] = run
  localStorage.setItem(KEY, JSON.stringify(store))
  return run
}

export function runStatus(run: QuestRun): RunStatus {
  if (run.abandoned) return 'abandoned'
  if (run.done.length >= run.total) return 'done'
  if (run.done.length > 0) return 'progress'
  return 'started'
}

export const getRun = (questId: number): QuestRun | null => read()[questId] ?? null

/** Начинает прохождение: продолжает незавершённое, иначе стартует заново с текущего момента. */
export function startRun(quest: Quest, team?: RunTeam): QuestRun {
  const existing = getRun(quest.id)
  const sameTeam = (existing?.team?.id ?? null) === (team?.id ?? null)
  if (existing && sameTeam && runStatus(existing) !== 'abandoned' && existing.done.length < existing.total) {
    return existing
  }
  return restartRun(quest, team)
}

/** Сбрасывает прогресс и фиксирует новое время старта. */
export function restartRun(quest: Quest, team?: RunTeam): QuestRun {
  return save({
    quest_id: quest.id,
    total: quest.points.length,
    done: [],
    started_at: new Date().toISOString(),
    team,
  })
}

/** Отмечает чекпоинт пройденным; при последней точке фиксирует время финиша. */
export function completePoint(run: QuestRun, index: number): QuestRun {
  const done = run.done.includes(index) ? run.done : [...run.done, index]
  const finished = done.length >= run.total
  return save({
    ...run,
    done,
    abandoned: false,
    finished_at: finished ? new Date().toISOString() : undefined,
  })
}

/** Бросает незавершённое прохождение (при выходе из квеста). */
export function abandonRun(run: QuestRun): QuestRun {
  if (runStatus(run) === 'done') return run
  return save({ ...run, abandoned: true })
}

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export const runDurationMin = (run: QuestRun) =>
  run.finished_at
    ? Math.max(1, Math.round((Date.parse(run.finished_at) - Date.parse(run.started_at)) / 60000))
    : 0
