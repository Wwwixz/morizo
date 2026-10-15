import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { useUser } from '../context/UserContext'

const COLS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Квесты',
    links: [
      { label: 'Все квесты', to: '/quests' },
      { label: 'Карта квестов', to: '/quests/map' },
      { label: 'Новые', to: '/quests' },
      { label: 'Популярные', to: '/quests' },
    ],
  },
  {
    title: 'Команды',
    links: [
      { label: 'Создать команду', to: '/teams' },
      { label: 'Мои команды', to: '/teams' },
      { label: 'Рейтинг', to: '/leaderboard' },
    ],
  },
  {
    title: 'Помощь',
    links: [
      { label: 'FAQ', to: '/about' },
      { label: 'Поддержка', to: '/about' },
      { label: 'Правила', to: '/about' },
    ],
  },
  {
    title: 'О нас',
    links: [
      { label: 'О проекте', to: '/about' },
      { label: 'Контакты', to: '/about' },
      { label: 'Вакансии', to: '/about' },
    ],
  },
]

export function Footer() {
  const { user } = useUser()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo light />
            <p className="footer-tag">Городские квесты для подростков</p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h4>{c.title}</h4>
              {c.links.map((l) => (
                <Link key={l.label} to={l.to}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>MORIZO © 2026. Городские квесты для подростков</span>
          {user && <span>Пользователь: {user.name}</span>}
        </div>
      </div>
    </footer>
  )
}
