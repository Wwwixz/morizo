import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Target, Zap } from 'lucide-react'
import { api } from '../api/client'
import { useUser } from '../context/UserContext'
import type { LeaderboardEntry } from '../types'

const PERIODS: { label: string; value: 'all' | 'month' | 'week' }[] = [
  { label: 'За всё время', value: 'all' },
  { label: 'За месяц', value: 'month' },
  { label: 'За неделю', value: 'week' },
]

function PlaceMark({ place }: { place: number }) {
  if (place === 1) return <Crown size={24} className="place-crown" fill="#FFC107" />
  if (place === 2) return <div className="place-medal silver">2</div>
  if (place === 3) return <div className="place-medal bronze">3</div>
  return <span className="place-num">{place}</span>
}

export function Leaderboard() {
  const { user } = useUser()
  const [tab, setTab] = useState<'teams' | 'players'>('teams')
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    api.getLeaderboard(tab, period).then(setEntries)
  }, [tab, period])

  const top3 = entries.slice(0, 3)
  const others = entries.slice(3)
  const profileLink = (e: LeaderboardEntry) => (tab === 'players' ? `/profile/${e.id}` : '#')

  return (
    <div className="container page">
      <div className="page-head lb-header">
        <div>
          <h1>Рейтинг</h1>
          <p className="muted small">Соревнуйтесь и становитесь лучшими в городе</p>
        </div>
      </div>

      <div className="lb-controls">
        <div className="tabs-underline">
          <button className={`tab-u ${tab === 'teams' ? 'active' : ''}`} onClick={() => setTab('teams')}>
            Команды
          </button>
          <button className={`tab-u ${tab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')}>
            Участники
          </button>
        </div>

        <div className="lb-period-toggle">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={`lb-period-btn ${period === p.value ? 'active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p className="muted">Пока нет результатов за выбранный период</p>
        </div>
      ) : (
        <>
          <div className="podium">
            {top3[1] && (
              <div className="podium-item second">
                <Link to={profileLink(top3[1])}>
                  <div className="podium-avatar-wrap">
                    <img src={top3[1].avatar} alt="" className="podium-avatar" />
                    <div className="podium-rank">2</div>
                  </div>
                </Link>
                <div className="podium-info">
                  <Link to={profileLink(top3[1])}>
                    <div className="podium-name">{top3[1].name}</div>
                  </Link>
                  <div className="podium-score">{top3[1].points.toLocaleString('ru-RU')}</div>
                </div>
              </div>
            )}
            {top3[0] && (
              <div className="podium-item first">
                <Link to={profileLink(top3[0])}>
                  <div className="podium-avatar-wrap">
                    <Crown className="podium-crown" size={32} fill="#FFC107" />
                    <img src={top3[0].avatar} alt="" className="podium-avatar" />
                    <div className="podium-rank">1</div>
                  </div>
                </Link>
                <div className="podium-info">
                  <Link to={profileLink(top3[0])}>
                    <div className="podium-name">{top3[0].name}</div>
                  </Link>
                  <div className="podium-score">{top3[0].points.toLocaleString('ru-RU')}</div>
                </div>
              </div>
            )}
            {top3[2] && (
              <div className="podium-item third">
                <Link to={profileLink(top3[2])}>
                  <div className="podium-avatar-wrap">
                    <img src={top3[2].avatar} alt="" className="podium-avatar" />
                    <div className="podium-rank">3</div>
                  </div>
                </Link>
                <div className="podium-info">
                  <Link to={profileLink(top3[2])}>
                    <div className="podium-name">{top3[2].name}</div>
                  </Link>
                  <div className="podium-score">{top3[2].points.toLocaleString('ru-RU')}</div>
                </div>
              </div>
            )}
          </div>

          <div className="card lb-card">
            <div className="lb-table-header">
              <div className="lb-col-place">#</div>
              <div className="lb-col-info">{tab === 'teams' ? 'Команда' : 'Участник'}</div>
              <div className="lb-col-stats hide-mobile">Статистика</div>
              <div className="lb-col-points">Очки</div>
            </div>
            <div className="lb-list">
              {others.map((item) => (
                <div key={item.id} className={`lb-row ${item.is_mine ? 'mine' : ''}`}>
                  <div className="lb-col-place">
                    <PlaceMark place={item.place} />
                  </div>
                  <div className="lb-col-info">
                    <Link to={profileLink(item)} className="lb-user">
                      <img src={item.avatar} alt="" className="avatar" />
                      <div>
                        <div className="lb-name">
                          {item.name}
                          {item.is_mine && <span className="muted"> (вы)</span>}
                        </div>
                        <div className="caption muted hide-desktop">{item.quests} квестов</div>
                      </div>
                    </Link>
                  </div>
                  <div className="lb-col-stats hide-mobile">
                    <div className="lb-stats-row">
                      <span title="Пройдено квестов">
                        <Target size={14} /> {item.quests}
                      </span>
                      <span title="Очки">
                        <Zap size={14} /> {item.points.toLocaleString('ru-RU')}
                      </span>
                      {tab === 'teams' && item.members != null && <span>{item.members} чел</span>}
                    </div>
                  </div>
                  <div className="lb-col-points">
                    <div className="lb-score-badge">{item.points.toLocaleString('ru-RU')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!user && (
        <p className="muted small" style={{ marginTop: 16 }}>
          <Link to="/login">Войдите</Link>, чтобы ваш результат попал в рейтинг.
        </p>
      )}
    </div>
  )
}
