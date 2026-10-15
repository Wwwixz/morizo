/**
 * Избранные квесты (frontend-only, хранится в localStorage).
 */

const KEY = 'morizo_favorites'

/** Событие об изменении избранного — чтобы списки обновлялись сразу */
export const FAVORITES_EVENT = 'morizo:favorites'

/** id квестов, добавленных в избранное */
export function listFavorites(): number[] {
  try {
    const raw = localStorage.getItem(KEY)
    const data: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data.filter((v): v is number => typeof v === 'number') : []
  } catch {
    return []
  }
}

export const isFavorite = (id: number) => listFavorites().includes(id)

/** Переключает избранное и возвращает новое состояние (true — добавлен) */
export function toggleFavorite(id: number): boolean {
  const ids = listFavorites()
  const has = ids.includes(id)
  const next = has ? ids.filter((v) => v !== id) : [...ids, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(FAVORITES_EVENT))
  return !has
}
