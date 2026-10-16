import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bookmark, ChevronRight, Clock, Gauge, MapPin, Route, UsersRound } from 'lucide-react'
import { api } from '../api/client'
import { isFavorite, toggleFavorite } from '../api/favorites'
import { TEAM_MAX, TEAM_MIN, canTeamPlay } from '../api/teams'
import type { PlaySession, PlayStatus, Quest, Team } from '../types'
import { Modal } from '../components/Modal'
import { QuestMap } from '../components/QuestMap'
import { useToast } from '../components/Toast'
import { useUser } from '../context/UserContext'
import { STATUS_CHIP } from './PlayQuest'

const STATUS_LABEL: Record<PlayStatus, string> = {
  STARTED: 'Начато',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершено',
  ABANDONED: 'Брошено',
}

export function QuestDetails() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useUser()
  const { toast } = useToast()
  const [quest, setQuest] = useState<Quest | null>(null)
  const [session, setSession] = useState<PlaySession | null>(null)
  const [fav, setFav] = useState(false)
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [pickingTeam, setPickingTeam] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const questId = Number(id)
    api.getQuest(questId).then((q) => setQuest(q ?? null))
    setFav(isFavorite(questId))
    if (user) {
      api.activeSession(questId).then(setSession).catch(() => setSession(null))
      api.getTeams().then((ts) => setMyTeams(ts.filter((t) => t.is_mine)))
    }
  }, [id, user])

  if (!quest) return <div className="container page"><p className="muted">Загрузка...</p></div>

  const activeStatus: PlayStatus | null =
    session && session.status !== 'COMPLETED' && session.status !== 'ABANDONED' ? session.status : null
  const completed = session?.status === 'COMPLETED'
  const startLabel = completed ? 'Пройти заново' : activeStatus ? 'Продолжить квест' : 'Начать квест'

  const start = async (teamId?: number | null) => {
    setError('')
    if (!user) {
      nav('/login')
      return
    }
    try {
      await api.startPlay(quest.id, teamId ?? null)
      nav(`/quests/${quest.id}/play`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось начать квест')
      toast(e instanceof Error ? e.message : 'Не удалось начать квест', 'err')
    }
  }

  const startWithTeam = (t: Team) => {
    setPickingTeam(false)
    start(t.id)
  }

  return (
    <div className="container page">
      <div className="breadcrumbs">
        <Link to="/quests">Квесты</Link>
        <ChevronRight size={14} className="sep" />
        <span>{quest.title}</span>
      </div>

      <div className="details-hero" style={{ backgroundImage: `url(${quest.image})` }} />

      <div className="details-grid">
        <div>
          <div className="details-title-row">
            <h1>{quest.title}</h1>
            <div className="details-play">
              {session?.team_id != null && (
                <span className="run-chip team">
                  <UsersRound size={13} /> Командой
                </span>
              )}
              {session && (
                <span className={`run-chip ${STATUS_CHIP[session.status]}`}>
                  {STATUS_LABEL[session.status]}
                  {activeStatus && ` · ${session.current}/${session.total} точек`}
                </span>
              )}
              <button className="btn btn-outline" onClick={() => (user ? setPickingTeam(true) : nav('/login'))}>
                <UsersRound size={16} />
                Командой
              </button>
              <button className="btn btn-primary" onClick={() => start(session?.team_id ?? null)}>
                {startLabel}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

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

          {quest.rules && <div className="hint-box" style={{ marginBottom: 20 }}>{quest.rules}</div>}

          <h2 className="section-title">Маршрут квеста</h2>
          <QuestMap points={quest.points} className="map-medium" />
        </div>

        <div className="details-actions">
          <button
            className={`btn ${fav ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              const next = toggleFavorite(quest.id)
              setFav(next)
              toast(next ? 'Добавлено в избранное' : 'Удалено из избранного')
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

      {pickingTeam && (
        <Modal title="Пройти командой" onClose={() => setPickingTeam(false)}>
          <p className="muted small" style={{ marginTop: 0 }}>
            Квест проходится командой от {TEAM_MIN} до {TEAM_MAX} человек. Код команды можно передать друзьям.
          </p>

          <div className="team-pick">
            {myTeams.map((t) => (
              <button
                key={t.id}
                className="team-pick-row"
                disabled={!canTeamPlay(t)}
                onClick={() => startWithTeam(t)}
              >
                <img src={t.avatar} alt="" />
                <span className="team-pick-info">
                  <b>{t.name}</b>
                  <span className="caption muted">{t.members} участников</span>
                </span>
                {canTeamPlay(t) ? (
                  <ChevronRight size={16} />
                ) : (
                  <span className="caption muted">
                    нужно {TEAM_MIN}–{TEAM_MAX} чел
                  </span>
                )}
              </button>
            ))}
            {myTeams.length === 0 && (
              <p className="muted">
                Вы пока не в команде. Создайте команду или вступите по коду в разделе «Команды».
              </p>
            )}
          </div>

          <div className="modal-actions">
            <Link to="/teams" className="btn btn-outline">
              Мои команды
            </Link>
            <button className="btn btn-outline" onClick={() => setPickingTeam(false)}>
              Отмена
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
