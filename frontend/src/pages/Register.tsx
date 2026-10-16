import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { api } from '../api/client'
import { useUser } from '../context/UserContext'
import { AuthLayout } from './Login'

const AGE_GROUPS: { value: 'AGE_14_15' | 'AGE_16_17'; label: string }[] = [
  { value: 'AGE_14_15', label: '14–15 лет' },
  { value: 'AGE_16_17', label: '16–17 лет' },
]

export function Register() {
  const nav = useNavigate()
  const { login } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [ageGroup, setAgeGroup] = useState<'AGE_14_15' | 'AGE_16_17'>('AGE_16_17')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) return setError('Введите корректный email')
    if (nickname.trim().length < 2) return setError('Никнейм — минимум 2 символа')
    if (password.length < 6) return setError('Пароль — минимум 6 символов')
    if (password !== confirm) return setError('Пароли не совпадают')
    setBusy(true)
    try {
      const user = await api.register(email.trim(), password, nickname.trim(), ageGroup)
      login(user)
      nav('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <h1>Создайте аккаунт</h1>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="auth-label">Email</label>
          <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="auth-label">Никнейм</label>
          <input
            className="field"
            placeholder="Как вас называть"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="auth-label">Возрастная группа</label>
          <div className="select-wrap">
            <select
              className="field"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as 'AGE_14_15' | 'AGE_16_17')}
            >
              {AGE_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
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
        <div className="form-group">
          <label className="auth-label">Подтвердите пароль</label>
          <input
            className="field"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
          {busy ? 'Создаём…' : 'Зарегистрироваться'}
        </button>
      </form>
      <p className="auth-alt">
        Уже есть аккаунт?{' '}
        <Link className="auth-link" to="/login">
          Войти
        </Link>
      </p>
    </AuthLayout>
  )
}
