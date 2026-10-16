import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useUser } from '../context/UserContext'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container auth-wrap">
      <div className="auth-card">
        <div className="auth-photo" style={{ backgroundImage: 'url(/img/hero.jpg)' }}>
          <div className="auth-slogan">
            Твой город — <u>твои правила</u>
          </div>
          <svg className="auth-pin" width="44" height="44" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 3C15.7 3 9 9.7 9 18c0 4.9 2.3 8.6 5 11.9L24 45l10-15.1c2.7-3.3 5-7 5-11.9C39 9.7 32.3 3 24 3z"
              fill="#FFC107"
              stroke="#0F0F0F"
              strokeWidth="2.5"
            />
            <circle cx="24" cy="18" r="6" fill="#0F0F0F" />
          </svg>
        </div>
        <div className="auth-form">{children}</div>
      </div>
    </div>
  )
}

export function Login() {
  const nav = useNavigate()
  const { login } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || password.length < 4) {
      setError('Введите логин и пароль (минимум 4 символа)')
      return
    }
    try {
      const user = await api.login(email.trim(), password)
      login(user)
      nav('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    }
  }

  return (
    <AuthLayout>
      <h1>Вход в аккаунт</h1>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="auth-label">Email</label>
          <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="auth-label">Пароль</label>
          <input
            className="field"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <label className="auth-check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Запомнить меня
        </label>
        <button className="btn btn-primary btn-lg btn-block" type="submit">
          Войти
        </button>
      </form>
      <div className="auth-forgot">
        <a className="auth-link" href="#" onClick={(e) => e.preventDefault()}>
          Забыли пароль?
        </a>
      </div>
      <p className="muted small" style={{ marginTop: 10 }}>
        Демо-доступ: игрок — <b>artem@morizo.ru</b>, модератор — <b>moderator@morizo.ru</b>. Пароль:{' '}
        <b>demo123</b>
      </p>
      <p className="auth-alt">
        Нет аккаунта?{' '}
        <Link className="auth-link" to="/register">
          Зарегистрируйтесь
        </Link>
      </p>
    </AuthLayout>
  )
}
