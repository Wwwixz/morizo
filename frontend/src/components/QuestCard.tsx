import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Clock, MapPin, Route, Star } from 'lucide-react'
import type { Quest } from '../types'
import { isFavorite, toggleFavorite } from '../api/favorites'
import { Badge } from './Badge'

export function tagVariant(tag: string): 'yellow' | 'blue' | 'red' | 'green' {
  if (tag === 'Популярное') return 'yellow'
  if (tag === 'Новинка') return 'red'
  if (tag === 'Для первого раза') return 'green'
  return 'blue'
}

function fmtRange(durationMin: number): string {
  const lo = Math.floor((durationMin / 60) * 2) / 2
  const hi = lo + 0.5
  const f = (v: number) => (Number.isInteger(v) ? `${v}` : `${v}`)
  return `${f(lo)}-${f(hi)} часа`
}

export function QuestCard({ quest }: { quest: Quest }) {
  const [fav, setFav] = useState(() => isFavorite(quest.id))

  const onFav = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFav(toggleFavorite(quest.id))
  }

  return (
    <article className="quest-card">
      <div className="quest-card-img" style={{ backgroundImage: `url(${quest.image})` }}>
        <div className="card-badges">
          <Badge variant={tagVariant(quest.tag)}>{quest.tag}</Badge>
        </div>
        <span className="qcard-rating">
          <Star size={14} fill="#FFC107" color="#FFC107" />
          {quest.rating.toFixed(1)}
        </span>
        <button
          className={`qcard-fav ${fav ? 'active' : ''}`}
          onClick={onFav}
          title={fav ? 'Убрать из избранного' : 'В избранное'}
          aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
          aria-pressed={fav}
        >
          <Bookmark size={16} fill={fav ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="quest-card-body">
        <div className="quest-card-title">{quest.title}</div>
        <div className="quest-card-loc">
          <MapPin size={14} />
          {quest.district}
        </div>
        <div className="quest-meta">
          <span>
            <Route size={15} /> {quest.distance_km} км
          </span>
          <span>
            <Clock size={15} /> {fmtRange(quest.duration_min)}
          </span>
        </div>
        <Link to={`/quests/${quest.id}`} className="btn btn-primary btn-block">
          Подробнее
        </Link>
      </div>
    </article>
  )
}
