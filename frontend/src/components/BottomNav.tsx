import { NavLink } from 'react-router-dom'
import { Compass, MapPin, Trophy, UserRound, UsersRound } from 'lucide-react'

const ITEMS = [
  { to: '/quests', label: 'Квесты', icon: MapPin },
  { to: '/quests/map', label: 'Карта', icon: Compass },
  { to: '/teams', label: 'Команды', icon: UsersRound },
  { to: '/leaderboard', label: 'Рейтинг', icon: Trophy },
  { to: '/profile', label: 'Профиль', icon: UserRound },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
