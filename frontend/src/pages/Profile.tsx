import { useEffect, useState } from 'react'
import { Pencil, X, ChevronDown } from 'lucide-react'
import { api } from '../api/client'
import type { Profile } from '../types'

const ICONS = ['👟', '⚡', '🧭', '🏆', '🗺️', '🎯']

export function Profile() {
  const [p, setP] = useState<Profile | null>(null)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    api.getProfile().then(setP)
  }, [])

  if (!p) return <div className="container page"><p className="muted">Загрузка...</p></div>

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Профиль</h1>
      </div>

      <div className="card profile-card" style={{ maxWidth: 720 }}>
        <div className="profile-head">
          <img src={p.avatar} alt="" />
          <div>
            <h2>{p.name}</h2>
            <p className="muted small">{p.age_label}</p>
          </div>
        </div>

        <div className="level-row">
          <b>Уровень {p.level}</b>
          <span className="muted">
            {p.xp} / {p.xp_next}
          </span>
        </div>
        <div className="progressbar">
          <div style={{ width: `${(p.xp / p.xp_next) * 100}%` }} />
        </div>

        <div className="stats-strip">
          <div>
            <b>{p.quests_done}</b>
            <span>пройденных квестов</span>
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
          <button className="icon-btn" style={{ width: 30, height: 30, border: 0, background: 'transparent' }} onClick={() => setOpen((v) => !v)}>
            {open ? <X size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {open &&
          p.achievements.map((a, i) => (
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn btn-outline">
            <Pencil size={15} />
            Редактировать профиль
          </button>
        </div>
      </div>
    </div>
  )
}
