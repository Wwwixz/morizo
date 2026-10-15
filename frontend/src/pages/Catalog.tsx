import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Clock, MapPin, Route, Search, Star, X } from 'lucide-react'
import { api } from '../api/client'
import type { Quest } from '../types'
import { QuestCard } from '../components/QuestCard'
import { QuestMap } from '../components/QuestMap'

type Filter = 'all' | 'near' | 'popular' | 'new' | 'historical'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'near', label: 'Рядом' },
  { id: 'popular', label: 'Популярные' },
  { id: 'new', label: 'Новинки' },
  { id: 'historical', label: 'Исторические' },
]

export function Catalog({ onlyMap = false }: { onlyMap?: boolean }) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  useEffect(() => {
    api.getQuests('published').then((qs) => setQuests((qs as Quest[]).filter((q) => q.points.length > 0)))
  }, [])

  const list = useMemo(() => {
    let res = quests
    if (filter === 'popular') res = res.filter((q) => q.popular || q.tag === 'Популярное')
    if (filter === 'new') res = res.filter((q) => q.is_new)
    if (filter === 'historical') res = res.filter((q) => q.tag === 'История города')
    if (filter === 'near') res = [...res].sort((a, b) => a.distance_km - b.distance_km)
    if (query.trim()) res = res.filter((q) => q.title.toLowerCase().includes(query.trim().toLowerCase()))
    return res
  }, [quests, filter, query])

  const mapPoints = useMemo(() => list.flatMap((q) => q.points.map((p) => p)), [list])
  const pointQuestIds = useMemo(() => list.flatMap((q) => q.points.map(() => q.id)), [list])

  const selectedPoint = selectedIdx === null ? null : mapPoints[selectedIdx] ?? null
  const selectedQuestId = selectedIdx === null ? null : pointQuestIds[selectedIdx] ?? null
  const selectedQuest = selectedQuestId === null ? null : list.find((q) => q.id === selectedQuestId) ?? null

  if (onlyMap) {
    return (
      <div className="container page">
        <div className="page-head">
          <h1>Карта квестов</h1>
        </div>
        <QuestMap points={quests.flatMap((q) => q.points.slice(0, 1))} className="map-full" />
      </div>
    )
  }

  return (
    <div className="container page">
      <div className="cat-head">
        <h1>Каталог квестов</h1>
        <p className="cat-sub">Выбери квест и отправляйся в приключение</p>
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <div className="filter-search">
          <Search size={16} />
          <input
            placeholder="Поиск квестов..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="cat-layout">
        <div className="cat-map">
          <QuestMap points={mapPoints} className="cat-map-card" expandable onSelect={setSelectedIdx}>
            {selectedQuest && selectedPoint && selectedIdx !== null && (
              <aside className="map-task-panel" key={`${selectedQuest.id}-${selectedIdx}`}>
                <button className="mtp-close" onClick={() => setSelectedIdx(null)} aria-label="Закрыть панель">
                  <X size={18} />
                </button>

                <div className="mtp-quest">
                  <img src={selectedQuest.image} alt={selectedQuest.title} className="mtp-img" />
                  <div>
                    <div className="mtp-quest-title">{selectedQuest.title}</div>
                    <div className="mtp-quest-loc">
                      <MapPin size={14} />
                      {selectedQuest.district}
                    </div>
                  </div>
                </div>

                <div className="mtp-point">
                  <span className="mtp-point-label">
                    Точка {selectedIdx + 1} · {selectedPoint.title}
                  </span>
                  <p className="mtp-task">{selectedPoint.task}</p>
                  {selectedPoint.hint && <p className="mtp-hint">Подсказка: {selectedPoint.hint}</p>}
                </div>

                <div className="mtp-meta">
                  <span>
                    <Star size={15} fill="#FFC107" color="#FFC107" /> {selectedQuest.rating.toFixed(1)}
                  </span>
                  <span>
                    <Route size={15} /> {selectedQuest.distance_km} км
                  </span>
                  <span>
                    <Clock size={15} /> {Math.round(selectedQuest.duration_min / 60)} ч
                  </span>
                </div>

                <Link to={`/quests/${selectedQuest.id}`} className="btn btn-primary btn-block">
                  Открыть квест
                </Link>
              </aside>
            )}
          </QuestMap>
          <p className="caption muted cat-map-hint">
            Точки на карте — задания квестов. Нажми на пин, чтобы открыть панель задания.
          </p>
        </div>

        <div>
          <div className="results-count" style={{ textAlign: 'left' }}>{list.length} квестов</div>
          <div className="cat-cards">
            {list.map((q) => (
              <div key={q.id} className={selectedQuestId === q.id ? 'cat-card selected' : 'cat-card'}>
                <QuestCard quest={q} />
              </div>
            ))}
          </div>
          {list.length === 0 && <p className="muted">Ничего не найдено — попробуйте другой фильтр.</p>}
        </div>
      </div>
    </div>
  )
}
