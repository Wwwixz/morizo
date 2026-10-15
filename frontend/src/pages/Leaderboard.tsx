import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Trophy, Target, Zap, Star } from 'lucide-react'
import { api } from '../api/client'
import type { Team } from '../types'

const PERIODS = ['За всё время', 'За месяц', 'За неделю']

function PlaceMark({ place }: { place: number }) {
  if (place === 1) return <Crown size={24} className="place-crown" fill="#FFC107" />
  if (place === 2) return <div className="place-medal silver">2</div>
  if (place === 3) return <div className="place-medal bronze">3</div>
  return <span className="place-num">{place}</span>
}

export function Leaderboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [tab, setTab] = useState<'teams' | 'players'>('teams')
  const [period, setPeriod] = useState(0)

  useEffect(() => {
    api.getTeams().then((ts) => setTeams([...ts].sort((a, b) => b.points - a.points)))
  }, [])

  const factor = [1, 0.55, 0.3][period]
  
  const getRanked = (data: any[]) => {
    return [...data]
      .sort((a, b) => (b.points || b.s) * factor - (a.points || a.s) * factor)
      .map((item, i) => ({ ...item, place: i + 1, score: Math.round((item.points || item.s) * factor) }))
  }

  const mockPlayers = [
    { id: 1, n: 'Артём К.', a: '/img/avatars/u1.jpg', s: 8420, quests: 24, points: 8420 },
    { id: 2, n: 'Кирилл М.', a: '/img/avatars/u2.jpg', s: 7980, quests: 21, points: 7980 },
    { id: 3, n: 'Настя В.', a: '/img/avatars/u3.jpg', s: 7310, quests: 19, points: 7310 },
    { id: 4, n: 'Лера П.', a: '/img/avatars/u4.jpg', s: 6650, quests: 18, points: 6650 },
    { id: 5, n: 'Дима С.', a: '/img/avatars/u5.jpg', s: 6120, quests: 15, points: 6120 },
    { id: 6, n: 'Анна М.', a: '/img/avatars/u6.jpg', s: 5800, quests: 14, points: 5800 },
    { id: 7, n: 'Иван И.', a: '/img/avatars/u7.jpg', s: 5400, quests: 12, points: 5400 },
  ]

  const ranked = getRanked(tab === 'teams' ? teams : mockPlayers)
  const top3 = ranked.slice(0, 3)
  const others = ranked.slice(3)

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
          {PERIODS.map((p, i) => (
            <button
              key={p}
              className={`lb-period-btn ${period === i ? 'active' : ''}`}
              onClick={() => setPeriod(i)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="podium">
        {top3[1] && (
          <div className="podium-item second">
            <Link to={tab === 'players' ? `/profile/${top3[1].id}` : '#'}>
              <div className="podium-avatar-wrap">
                <img src={top3[1].avatar || top3[1].a} alt="" className="podium-avatar" />
                <div className="podium-rank">2</div>
              </div>
            </Link>
            <div className="podium-info">
              <Link to={tab === 'players' ? `/profile/${top3[1].id}` : '#'}>
                <div className="podium-name">{top3[1].name || top3[1].n}</div>
              </Link>
              <div className="podium-score">{top3[1].score.toLocaleString('ru-RU')}</div>
            </div>
          </div>
        )}
        {top3[0] && (
          <div className="podium-item first">
            <Link to={tab === 'players' ? `/profile/${top3[0].id}` : '#'}>
              <div className="podium-avatar-wrap">
                <Crown className="podium-crown" size={32} fill="#FFC107" />
                <img src={top3[0].avatar || top3[0].a} alt="" className="podium-avatar" />
                <div className="podium-rank">1</div>
              </div>
            </Link>
            <div className="podium-info">
              <Link to={tab === 'players' ? `/profile/${top3[0].id}` : '#'}>
                <div className="podium-name">{top3[0].name || top3[0].n}</div>
              </Link>
              <div className="podium-score">{top3[0].score.toLocaleString('ru-RU')}</div>
            </div>
          </div>
        )}
        {top3[2] && (
          <div className="podium-item third">
            <Link to={tab === 'players' ? `/profile/${top3[2].id}` : '#'}>
              <div className="podium-avatar-wrap">
                <img src={top3[2].avatar || top3[2].a} alt="" className="podium-avatar" />
                <div className="podium-rank">3</div>
              </div>
            </Link>
            <div className="podium-info">
              <Link to={tab === 'players' ? `/profile/${top3[2].id}` : '#'}>
                <div className="podium-name">{top3[2].name || top3[2].n}</div>
              </Link>
              <div className="podium-score">{top3[2].score.toLocaleString('ru-RU')}</div>
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
            <div key={item.id || item.n} className="lb-row">
              <div className="lb-col-place">
                <PlaceMark place={item.place} />
              </div>
              <div className="lb-col-info">
                <Link to={tab === 'players' ? `/profile/${item.id}` : '#'} className="lb-user">
                  <img src={item.avatar || item.a} alt="" className="avatar" />
                  <div>
                    <div className="lb-name">{item.name || item.n}</div>
                    <div className="caption muted hide-desktop">
                      {item.quests || 0} квестов
                    </div>
                  </div>
                </Link>
              </div>
              <div className="lb-col-stats hide-mobile">
                <div className="lb-stats-row">
                  <span title="Пройдено квестов"><Target size={14} /> {item.quests || 0}</span>
                  <span title="Очки"><Zap size={14} /> {item.score.toLocaleString('ru-RU')}</span>
                </div>
              </div>
              <div className="lb-col-points">
                <div className="lb-score-badge">
                  {item.score.toLocaleString('ru-RU')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
