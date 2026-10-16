import type { Team } from '../types'

/**
 * Ограничения команд по ТЗ: в команде может быть от 2 до 6 человек.
 */

export const TEAM_MIN = 2
export const TEAM_MAX = 6

/** Команда готова к прохождению квеста, если в ней 2–6 человек */
export const canTeamPlay = (team: Team) => team.members >= TEAM_MIN && team.members <= TEAM_MAX
