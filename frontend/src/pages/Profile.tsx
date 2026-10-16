import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, ChevronDown, MapPin, Pencil, RefreshCw, Route } from 'lucide-react'
import { api, ApiError } from '../api/client'
import { FAVORITES_EVENT, listFavorites } from '../api/favorites'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { useUser } from '../context/UserContext'
import type { Profile, Quest } from '../types'

const ICONS = ['👟', '⚡', '🧭', '🏆', '🗺️', '🎯']
const AVATARS = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `/img/avatars/u${i}.jpg`)

export function Profile() {
  const { id } = useParams()
  const { user, login } = useUser()
  const [p, setP] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [avatarDraft, setAvatarDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [favorites, setFavorites] = useState<Quest[]>([])
  const { toast } = useToast()

  const isMyProfile = !id || Number(id) === user?.id

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    const req = id ? api.getUserProfile(Number(id)) : api.getProfile()
    req
      .then((data) => {
        setP(data)
        setNameDraft(data.name)
        setAvatarDraft(data.avatar)
      })
      .catch((e) => {
        setError(e instanceof ApiError && e.status === 401 ? 'Войдите, чтобы увидеть профиль' : 'Не удалось загрузить профиль')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(load, [load])

  useEffect(() => {
    if (!isMyProfile) return
    const favIds = listFavorites()
    if (favIds.length === 0) {
      setFavorites([])
      return
    }
    let alive = true
    api
      .getQuests()
      .then((qs) => alive && setFavorites(qs.filter((q) => favIds.includes(q.id))))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [isMyProfile])

  useEffect(() => {
    if (!isMyProfile) return
    const onChange = () => setFavorites((fs) => fs.filter((q) => listFavorites().includes(q.id)))
    window.addEventListener(FAVORITES_EVENT, onChange)
    return () => window.removeEventListener(FAVORITES_EVENT, onChange)
  }, [isMyProfile])

  const save = async () => {
    const name = nameDraft.trim()
    if (name.length < 2) {
      toast('Никнейм — минимум 2 символа', 'err')
      return
    }
    setSaving(true)
    try {
      const updated = await api.updateProfile({ name, avatar: avatarDraft })
      setP(updated)
      if (user) login({ ...user, name: updated.name, avatar: updated.avatar })
      setEditing(false)
      toast('Профиль обновлён', 'ok')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Не удалось сохранить', 'err')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container page">
        <p className="muted">Загрузка...</p>
      </div>
    )
  }

  if (error || !p) {
    return (
      <div className="container page">
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <h2>Что-то пошло не так</h2>
          <p className="muted small" style={{ marginTop: 8 }}>
            {error || 'Профиль не найден'}
          </p>
          <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={load}>
            <RefreshCw size={15} />
            Повторить
          </button>
        </div>
      </div>
    )
  }

  const progress = Math.min(100, Math.round((p.xp / Math.max(1, p.xp_next)) * 100))

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Профиль</h1>
      </div>

      <div className="card profile-card" style={{ maxWidth: 720 }}>
        <div className="profile-head">
          <img src={p.avatar} alt="" />
          <div style={{ flex: 1 }}>
            <h2>{p.name}</h2>
            <p className="muted small">{p.age_label}</p>
          </div>
          {isMyProfile && (
            <button
              className="btn btn-outline"
              onClick={() => {
                setNameDraft(p.name)
                setAvatarDraft(p.avatar)
                setEditing(true)
              }}
            >
              <Pencil size={15} />
              Редактировать
            </button>
          )}
        </div>

        <div className="level-row">
          <b>Уровень {p.level}</b>
          <span className="muted">
            {p.xp} / {p.xp_next} XP
          </span>
        </div>
        <div className="progressbar">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="stats-strip">
          <div>
            <b>{p.quests_done}</b>
            <span>пройденных квестов</span>
          </div>
          <div>
            <b>{p.score ?? 0}</b>
            <span>очков</span>
          </div>
          <div>
            <b>{p.teams}</b>
            <span>команд</span>
          </div>
          <div>
            <b>{p.achievements.length}</b>
            <span>достижения</span>
          </div>
        </div>

        <div className="page-head" style={{ marginBottom: 16 }}>
          <h3>Мои достижения</h3>
          <button
            className="icon-btn"
            style={{ width: 30, height: 30, border: 0, background: 'transparent' }}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Скрыть достижения' : 'Показать достижения'}
          >
            <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
        </div>

        {open && (
          <>
            {p.achievements.length === 0 && (
              <p className="muted small" style={{ margin: '0 0 12px' }}>
                Пока нет достижений — проходите квесты, чтобы открыть первые!
              </p>
            )}
            {p.achievements.map((a, i) => (
              <div className="ach-row" key={a.id}>
                <span className="ach-icon" style={{ background: a.color }}>
                  {ICONS[i % ICONS.length]}
                </span>
                <div>
                  <div className="ach-title">{a.title}</div>
                  <div className="ach-desc">{a.description}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {isMyProfile && (
          <>
            <div className="page-head" style={{ margin: '26px 0 16px' }}>
              <h3>Избранные квесты</h3>
              <span className="mod-count">{favorites.length}</span>
            </div>
            {favorites.map((q) => (
              <Link className="fav-row" to={`/quests/${q.id}`} key={q.id}>
                <img src={q.image} alt="" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fav-title">{q.title}</div>
                  <div className="mod-meta">
                    <span>
                      <MapPin size={13} /> {q.district}
                    </span>
                    <span>
                      <Route size={13} /> {q.distance_km} км
                    </span>
                  </div>
                </div>
                <Bookmark size={16} fill="currentColor" color="var(--yellow)" />
              </Link>
            ))}
            {favorites.length === 0 && (
              <p className="muted small" style={{ margin: 0 }}>
                Пока пусто — отмечайте квесты закладкой в каталоге, и они появятся здесь.
              </p>
            )}
          </>
        )}
      </div>

      {editing && (
        <Modal title="Редактировать профиль" onClose={() => setEditing(false)}>
          <div className="form-group">
            <label className="form-label">Никнейм</label>
            <input
              className="field"
              maxLength={60}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Твой никнейм"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Аватар</label>
            <div className="avatar-picker">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`avatar-opt ${avatarDraft === a ? 'active' : ''}`}
                  onClick={() => setAvatarDraft(a)}
                  aria-label="Выбрать аватар"
                  aria-pressed={avatarDraft === a}
                >
                  <img src={a} alt="" />
                </button>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setEditing(false)} disabled={saving}>
              Отмена
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving || nameDraft.trim().length < 2}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
