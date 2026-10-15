import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useUser } from '../context/UserContext'
import { AuthLayout } from './Login'

export function Register() {
  const nav = useNavigate()
  const { login } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) return setError('Введите корректный email')
    if (password.length < 4) return setError('Пароль — минимум 4 символа')
    if (password !== confirm) return setError('Пароли не совпадают')
    const user = await api.register(email)
    login(user)
    nav('/')
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
        <button className="btn btn-primary btn-lg btn-block" type="submit">
          Зарегистрироваться
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
