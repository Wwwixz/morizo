import { useEffect, useState } from 'react'
import { Crown, ChevronDown } from 'lucide-react'
import { api } from '../api/client'
import type { Team } from '../types'

const PERIODS = ['За всё время', 'За месяц', 'За неделю']

function PlaceMark({ place }: { place: number }) {
  if (place === 1) return <Crown size={26} className="place-crown" fill="#FFC107" />
  if (place === 2)
    return (
      <span className="place-medal silver" style={{ background: '#9ca3af' }}>
        2
      </span>
    )
  if (place === 3)
    return (
      <span className="place-medal bronze" style={{ background: '#f59e0b' }}>
        3
      </span>
    )
  return <b>{place}</b>
}

export function Leaderboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [tab, setTab] = useState<'teams' | 'players'>('teams')
  const [period, setPeriod] = useState(0)

  useEffect(() => {
    api.getTeams().then((ts) => setTeams([...ts].sort((a, b) => b.points - a.points)))
  }, [])

  const factor = [1, 0.55, 0.3][period]
  const ranked = [...teams]
    .sort((a, b) => b.points * factor - a.points * factor)
    .map((t, i) => ({ ...t, place: i + 1, score: Math.round(t.points * factor) }))

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Рейтинг</h1>
      </div>

      <div className="tabs-underline">
        <button className={`tab-u ${tab === 'teams' ? 'active' : ''}`} onClick={() => setTab('teams')}>
          Команды
        </button>
        <button className={`tab-u ${tab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')}>
          Участники
        </button>
      </div>

      {tab === 'teams' ? (
        <>
          <div className="page-head" style={{ marginBottom: 12 }}>
            <h3>Топ команд</h3>
            <div className="select-wrap lb-select">
              <select className="field" style={{ width: 190 }} value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
                {PERIODS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="place-cell">Место</th>
                  <th>Команда</th>
                  <th style={{ textAlign: 'right' }}>Очки</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((t) => (
                  <tr key={t.id}>
                    <td className="place-cell">
                      <PlaceMark place={t.place} />
                    </td>
                    <td>
                      <div className="lb-team">
                        <img className="avatar" src={t.avatar} alt="" style={{ width: 40, height: 40 }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{t.name}</div>
                          <div className="caption muted">{t.members} участников</div>
                        </div>
                      </div>
                    </td>
                    <td className="lb-points">{t.score.toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th className="place-cell">Место</th>
                <th>Участник</th>
                <th style={{ textAlign: 'right' }}>Очки</th>
              </tr>
            </thead>
            <tbody>
              {[
                { n: 'Артём К.', a: '/img/avatars/u1.jpg', s: 8420 },
                { n: 'Кирилл М.', a: '/img/avatars/u2.jpg', s: 7980 },
                { n: 'Настя В.', a: '/img/avatars/u3.jpg', s: 7310 },
                { n: 'Лера П.', a: '/img/avatars/u4.jpg', s: 6650 },
                { n: 'Дима С.', a: '/img/avatars/u5.jpg', s: 6120 },
              ].map((p, i) => (
                <tr key={p.n}>
                  <td className="place-cell">
                    <PlaceMark place={i + 1} />
                  </td>
                  <td>
                    <div className="lb-team">
                      <img className="avatar" src={p.a} alt="" style={{ width: 40, height: 40 }} />
                      <div style={{ fontWeight: 600 }}>{p.n}</div>
                    </div>
                  </td>
                  <td className="lb-points">{Math.round(p.s * factor).toLocaleString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
