import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, MapPin, Plus, Search, ShieldCheck, UserRound } from 'lucide-react'
import { Logo } from './Logo'
import { useUser } from '../context/UserContext'

const NAV = [
  { to: '/quests', label: 'Квесты' },
  { to: '/teams', label: 'Команды' },
  { to: '/leaderboard', label: 'Рейтинг' },
  { to: '/about', label: 'О нас' },
]

export function Header() {
  const { user, logout } = useUser()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const nav = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    nav(`/quests?q=${encodeURIComponent(query)}`)
  }

  return (
    <header className="header">
      <div className="container header-in">
        <Link to="/"><Logo /></Link>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-right">
          {user ? (
            <>
              <form className="search-mini" onSubmit={submitSearch}>
                <Search size={16} />
                <input
                  placeholder="Поиск квестов..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </form>
              <div style={{ position: 'relative' }} ref={ref}>
                <button className="avatar-btn" onClick={() => setOpen((v) => !v)}>
                  <img className="avatar" src={user.avatar} alt="" />
                  <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} />
                </button>
                {open && (
                  <div className="dropdown">
                    <Link to="/profile" onClick={() => setOpen(false)}>
                      <UserRound size={16} /> Профиль
                    </Link>
                    <Link to="/create" onClick={() => setOpen(false)}>
                      <Plus size={16} /> Создать квест
                    </Link>
                    <Link to="/moderation" onClick={() => setOpen(false)}>
                      <ShieldCheck size={16} /> Модерация
                    </Link>
                    <button
                      className="danger"
                      onClick={() => {
                        logout()
                        setOpen(false)
                        nav('/')
                      }}
                    >
                      <LogOut size={16} /> Выйти
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <form className="search-mini" onSubmit={submitSearch}>
                <Search size={16} />
                <input
                  placeholder="Поиск квестов..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </form>
              <button className="btn btn-secondary" onClick={() => nav('/login')}>
                Войти
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
