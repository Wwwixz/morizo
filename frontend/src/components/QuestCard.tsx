import { Link } from 'react-router-dom'
import { Clock, Gauge, MapPin, Route, Star } from 'lucide-react'
import type { Quest } from '../types'
import { Badge } from './Badge'

export function tagVariant(tag: string): 'yellow' | 'blue' | 'red' | 'green' {
  if (tag === 'Популярное') return 'yellow'
  if (tag === 'Новинка') return 'red'
  if (tag === 'Для первого раза') return 'green'
  return 'blue'
}

export function QuestCard({ quest }: { quest: Quest }) {
  const hours = Math.max(1, Math.round(quest.duration_min / 60))
  return (
    <article className="quest-card" style={{ position: 'relative' }}>
      <div className="quest-card-img" style={{ backgroundImage: `url(${quest.image})` }} />
      <div className="card-badges">
        <Badge variant={tagVariant(quest.tag)}>{quest.tag}</Badge>
      </div>
      <div className="quest-card-body">
        <div className="quest-card-title">{quest.title}</div>
        <div className="quest-card-loc">
          <MapPin size={14} />
          {quest.district}
        </div>
        <p className="quest-card-desc">{quest.description}</p>
        <div className="quest-meta">
          <span>
            <Route size={15} /> {quest.distance_km} км
          </span>
          <span>
            <Gauge size={15} /> {quest.difficulty}/5
          </span>
          <span>
            <Clock size={15} /> {hours} ч
          </span>
          <span className="rating">
            <Star size={15} fill="#FFC107" color="#FFC107" /> {quest.rating.toFixed(1)}
          </span>
        </div>
        <Link to={`/quests/${quest.id}`} className="btn btn-primary btn-block">
          Подробнее
        </Link>
      </div>
    </article>
  )
}
