import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { api } from '../api/client'
import type { Quest } from '../types'
import { QuestCard } from '../components/QuestCard'
import { QuestMap } from '../components/QuestMap'

type Filter = 'all' | 'near' | 'short' | 'medium' | 'hard'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'near', label: 'Рядом со мной' },
  { id: 'short', label: 'Короткие' },
  { id: 'medium', label: 'Средние' },
  { id: 'hard', label: 'Сложные' },
]

export function Catalog({ onlyMap = false }: { onlyMap?: boolean }) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.getQuests('published').then((qs) => setQuests(qs.filter((q) => q.points.length > 0) as Quest[]))
  }, [])

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) setQuery(q)
  }, [])

  const list = useMemo(() => {
    let res = quests
    if (filter === 'short') res = res.filter((q) => q.duration_min <= 90)
    if (filter === 'medium') res = res.filter((q) => q.duration_min > 90 && q.duration_min <= 140)
    if (filter === 'hard') res = res.filter((q) => q.difficulty >= 3)
    if (query.trim())
      res = res.filter((q) => q.title.toLowerCase().includes(query.trim().toLowerCase()))
    return res
  }, [quests, filter, query])

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Квесты</h1>
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

      <div className="catalog-grid">
        <div>
          <div className="results-count">{list.length} результатов</div>
          <QuestMap
            points={list.flatMap((q) => q.points.slice(0, 1))}
            className={onlyMap ? 'map-full' : 'map-tall'}
          />
        </div>
        {!onlyMap && (
          <div>
            {list.map((q) => (
              <QuestCard key={q.id} quest={q} />
            ))}
            {list.length === 0 && <p className="muted">Ничего не найдено — попробуйте другой фильтр.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
