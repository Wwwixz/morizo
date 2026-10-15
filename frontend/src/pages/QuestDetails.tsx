import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bookmark, ChevronRight, Clock, Gauge, MapPin, Route, UsersRound } from 'lucide-react'
import { api } from '../api/client'
import type { Quest } from '../types'
import { QuestMap } from '../components/QuestMap'
import { useToast } from '../components/Toast'
import { useUser } from '../context/UserContext'

export function QuestDetails() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useUser()
  const { toast } = useToast()
  const [quest, setQuest] = useState<Quest | null>(null)
  const [fav, setFav] = useState(false)

  useEffect(() => {
    if (id) api.getQuest(Number(id)).then((q) => setQuest(q ?? null))
  }, [id])

  if (!quest) return <div className="container page"><p className="muted">Загрузка...</p></div>

  const start = () => {
    if (!user) {
      nav('/login')
      return
    }
    nav(`/quests/${quest.id}/play`)
  }

  return (
    <div className="container page">
      <div className="breadcrumbs">
        <Link to="/quests">Квесты</Link>
        <ChevronRight size={14} className="sep" />
        <span>{quest.title}</span>
      </div>

      <div
        className="details-hero"
        style={{ backgroundImage: `url(${quest.image})` }}
      />

      <div className="details-grid">
        <div>
          <div className="details-title-row">
            <h1>{quest.title}</h1>
            <button className="btn btn-primary" onClick={start}>
              Начать квест
            </button>
          </div>

          <div className="details-meta">
            <span>
              <MapPin size={15} /> {quest.district}
            </span>
            <span className="dot">·</span>
            <span>
              <Route size={15} /> {quest.distance_km} км
            </span>
            <span className="dot">·</span>
            <span>
              <Gauge size={15} /> {quest.difficulty}/5
            </span>
            <span className="dot">·</span>
            <span>
              <UsersRound size={15} /> {quest.players_min}–{quest.players_max} чел
            </span>
            <span className="dot">·</span>
            <span>
              <Clock size={15} /> ~{quest.duration_min} мин
            </span>
          </div>

          <p className="details-desc">{quest.description}</p>

          <h2 className="section-title">Маршрут квеста</h2>
          <QuestMap points={quest.points} className="map-medium" />
        </div>

        <div className="details-actions">
          <button
            className={`btn ${fav ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setFav((v) => !v)
              toast(fav ? 'Удалено из избранного' : 'Добавлено в избранное')
            }}
          >
            <Bookmark size={16} fill={fav ? 'currentColor' : 'none'} />
            {fav ? 'В избранном' : 'В избранное'}
          </button>
          {quest.gallery.map((g, i) => (
            <div key={i} className="gallery-img" style={{ backgroundImage: `url(${g})` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
