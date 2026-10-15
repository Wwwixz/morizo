/**
 * Построение маршрута по реальным дорогам через публичный OSRM.
 * Если сервис недоступен — возвращаем null, и карта рисует прямую линию.
 */

/** Координата в формате Leaflet: [широта, долгота] */
export type LatLng = [number, number]

const TIMEOUT_MS = 8000
/** Сколько координат отправляем в одном запросе — длинный путь бьём на части */
const CHUNK = 8
/** Выше этого числа точек маршрут не строим, чтобы не заваливать сервис */
const MAX_POINTS = 60

const cache = new Map<string, LatLng[]>()
const pending = new Map<string, Promise<LatLng[] | null>>()

/** OSRM ждёт координаты в порядке «долгота,широта» */
const toOsrmQuery = (points: LatLng[]) => points.map(([lat, lng]) => `${lng},${lat}`).join(';')

const PROVIDERS = [
  // Пешеходный профиль: ведёт по тротуарам и переходам
  (q: string) => `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${q}?overview=full&geometries=geojson`,
  // Резервный публичный сервер OSRM
  (q: string) => `https://router.project-osrm.org/route/v1/driving/${q}?overview=full&geometries=geojson`,
]

interface OsrmResponse {
  code?: string
  routes?: { geometry?: { coordinates?: [number, number][] } }[]
}

async function request(url: string): Promise<LatLng[] | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    const data = (await res.json()) as OsrmResponse
    const coords = data.routes?.[0]?.geometry?.coordinates
    if (data.code !== 'Ok' || !coords?.length) return null
    return coords.map(([lng, lat]) => [lat, lng] as LatLng)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Маршрут между одной парой опорных точек (или небольшим их числом) */
function segment(points: LatLng[]): Promise<LatLng[] | null> {
  const q = toOsrmQuery(points)
  const cached = cache.get(q)
  if (cached) return Promise.resolve(cached)
  const running = pending.get(q)
  if (running) return running

  const task = (async () => {
    for (const provider of PROVIDERS) {
      const line = await request(provider(q))
      if (line) {
        cache.set(q, line)
        return line
      }
    }
    return null
  })()

  pending.set(q, task)
  task.finally(() => pending.delete(q))
  return task
}

/** Геометрия маршрута по дорогам или null, если построить не удалось */
export async function fetchRoute(points: LatLng[]): Promise<LatLng[] | null> {
  if (points.length < 2 || points.length > MAX_POINTS) return null
  // Бьём путь на части с общей точкой на стыке, чтобы куски стыковались без разрывов
  const chunks: LatLng[][] = []
  for (let i = 0; i < points.length - 1; i += CHUNK) {
    chunks.push(points.slice(i, Math.min(i + CHUNK + 1, points.length)))
  }
  const parts = await Promise.all(chunks.map(segment))
  // Если какая-то часть не построилась — на её месте остаётся прямая
  return parts.flatMap((part, i) => part ?? chunks[i])
}
