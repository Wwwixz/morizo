import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../api/client'
import type { Quest, Stats } from '../types'
import { QuestCard } from '../components/QuestCard'

const STEPS = [
  {
    num: '01',
    title: 'Выбери квест',
    text: 'Маршруты по разным уголкам города — от старинных улочек до современных кварталов',
  },
  {
    num: '02',
    title: 'Исследуй город',
    text: 'Двигайся по точкам, решай головоломки и находи места, о которых не знал',
  },
  {
    num: '03',
    title: 'Побеждай',
    text: 'Получай бонусы за каждое задание и соревнуйся с другими командами',
  },
]

export function Home() {
  const [stats, setStats] = useState<Stats>({ quests: 0, teams: 0, users: 0 })
  const [quests, setQuests] = useState<Quest[]>([])
  const nav = useNavigate()

  useEffect(() => {
    api.getStats().then(setStats)
    api.getQuests('published').then((qs) => setQuests((qs as Quest[]).slice(0, 3)))
  }, [])

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="lhero">
        <div className="lhero-bg" style={{ backgroundImage: 'url(/img/hero.jpg)' }} />
        <div className="lhero-shade" />
        <div className="lhero-pins">
          <svg width="30" height="30" viewBox="0 0 48 48" style={{ top: '18%', left: '12%' }}>
            <path d="M24 3C15.7 3 9 9.7 9 18c0 4.9 2.3 8.6 5 11.9L24 45l10-15.1c2.7-3.3 5-7 5-11.9C39 9.7 32.3 3 24 3z" fill="#FFC107" stroke="#0F0F0F" strokeWidth="2.5" />
            <circle cx="24" cy="18" r="6" fill="#0F0F0F" />
          </svg>
          <svg width="22" height="22" viewBox="0 0 48 48" style={{ top: '58%', left: '82%' }}>
            <path d="M24 3C15.7 3 9 9.7 9 18c0 4.9 2.3 8.6 5 11.9L24 45l10-15.1c2.7-3.3 5-7 5-11.9C39 9.7 32.3 3 24 3z" fill="#fff" stroke="#0F0F0F" strokeWidth="2.5" />
            <circle cx="24" cy="18" r="6" fill="#0F0F0F" />
          </svg>
          <svg width="26" height="26" viewBox="0 0 48 48" style={{ top: '30%', left: '88%' }}>
            <path d="M24 3C15.7 3 9 9.7 9 18c0 4.9 2.3 8.6 5 11.9L24 45l10-15.1c2.7-3.3 5-7 5-11.9C39 9.7 32.3 3 24 3z" fill="#FFC107" stroke="#0F0F0F" strokeWidth="2.5" />
            <circle cx="24" cy="18" r="6" fill="#0F0F0F" />
          </svg>
        </div>
        <div className="container lhero-in">
          <h1>
            Городские квесты
            <br />
            <span className="accent">Приключение ждёт</span>
          </h1>
          <p className="lhero-sub">
            Пройди маршрут, решай задания и узнавай свой город как никогда раньше
          </p>
          <div className="lhero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => nav('/quests')}>
              Начать приключение
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => nav('/quests')}>
              Смотреть квесты
            </button>
          </div>
        </div>
        <div className="lhero-stats">
          <div className="container lhero-stats-in">
            <div>
              <b>{stats.quests}</b>
              <span>квестов</span>
            </div>
            <div>
              <b>{stats.teams}</b>
              <span>команд</span>
            </div>
            <div>
              <b>{stats.users}</b>
              <span>участников</span>
            </div>
            <div>
              <b>4.9</b>
              <span>средний рейтинг</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ КАРТОЧКИ КВЕСТОВ ============ */}
      <section className="container lsection">
        <div className="lsection-head">
          <h2>С чего начнётся твоя история?</h2>
          <Link to="/quests" className="see-all">
            Все квесты <ArrowRight size={16} />
          </Link>
        </div>
        <div className="lcards">
          {quests.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </div>
      </section>

      {/* ============ КАК ЭТО РАБОТАЕТ ============ */}
      <section className="lsteps-wrap">
        <div className="container">
          <h2 className="lsteps-title">Город становится игрой</h2>
          <p className="lsteps-sub">
            Пройди маршрут по городу и выполни задания на каждой точке
          </p>
          <div className="lsteps">
            {STEPS.map((s) => (
              <div className="lstep" key={s.num}>
                <span className="lstep-num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="container">
        <div className="lcta">
          <div className="lcta-bg" style={{ backgroundImage: 'url(/img/quest-volga.jpg)' }} />
          <div className="lcta-shade" />
          <div className="lcta-in">
            <h2>Вместе — ещё интереснее</h2>
            <p>
              Объединяйтесь с друзьями, создавайте команды, собирайте бонусы
              <br />
              и побеждайте в городских приключениях
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => nav('/teams')}>
              Создать команду
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
