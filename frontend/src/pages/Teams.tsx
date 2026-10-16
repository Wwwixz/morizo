import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Plus, Search, UserPlus, X } from 'lucide-react'
import { api } from '../api/client'
import { TEAM_MAX, TEAM_MIN } from '../api/teams'
import type { Team } from '../types'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { useUser } from '../context/UserContext'

export function Teams() {
  const { user } = useUser()
  const [teams, setTeams] = useState<Team[]>([])
  const [tab, setTab] = useState<'mine' | 'all'>('mine')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [joining, setJoining] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmLeave, setConfirmLeave] = useState<Team | null>(null)
  const { toast } = useToast()

  const reload = () => api.getTeams().then(setTeams)

  useEffect(() => {
    if (user) reload()
  }, [user])

  const list = (tab === 'mine' ? teams.filter((t) => t.is_mine) : teams).filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const create = async () => {
    if (name.trim().length < 2) return
    try {
      const team = await api.createTeam(name.trim(), description.trim())
      await reload()
      setName('')
      setDescription('')
      setCreating(false)
      toast(`Команда создана! Код для приглашения: ${team.code}`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Не удалось создать команду', 'err')
    }
  }

  const join = async (t: Team) => {
    try {
      await api.joinTeam(t.id)
      await reload()
      toast(`Вы вступили в команду «${t.name}»`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Не удалось вступить в команду', 'err')
    }
  }

  const joinByCode = async () => {
    try {
      const team = await api.joinTeamByCode(code.trim().toUpperCase())
      await reload()
      setJoining(false)
      setCode('')
      setError('')
      toast(`Вы вступили в команду «${team.name}»`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Команда с таким кодом не найдена')
    }
  }

  const leave = async (t: Team) => {
    setConfirmLeave(null)
    try {
      await api.leaveTeam(t.id)
      await reload()
      if (selectedTeam?.id === t.id) setSelectedTeam(null)
      toast(`Вы вышли из команды «${t.name}»`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Не удалось выйти из команды', 'err')
    }
  }

  const copyCode = async (t: Team) => {
    if (!t.code) return
    try {
      await navigator.clipboard.writeText(t.code)
      setCopied(t.id)
      setTimeout(() => setCopied((v) => (v === t.id ? null : v)), 1500)
    } catch {
      toast(`Код команды: ${t.code}`)
    }
  }

  if (!user) {
    return (
      <div className="container page">
        <div className="page-head">
          <h1>Команды</h1>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p className="muted">Войдите, чтобы создавать команды и вступать в них.</p>
          <Link className="btn btn-primary" to="/login" style={{ marginTop: 16 }}>
            Войти
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Команды</h1>
        <div className="page-head-actions">
          <button className="btn btn-outline" onClick={() => setJoining(true)}>
            <UserPlus size={16} />
            Войти по коду
          </button>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            Создать команду
          </button>
        </div>
      </div>

      <p className="muted small" style={{ marginTop: -6, marginBottom: 16 }}>
        Квест можно проходить соло или командой — от {TEAM_MIN} до {TEAM_MAX} человек.
      </p>

      <div className="tabs-underline">
        <button className={`tab-u ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
          Мои команды
        </button>
        <button className={`tab-u ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          Все команды
        </button>

        <div className="search-teams">
          <Search size={16} className="muted" />
          <input
            type="text"
            placeholder="Поиск команды..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn-icon" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '10px 6px' }}>
        {list.map((t) => (
          <div key={t.id} className="team-container">
            <div className="team-row" onClick={() => setSelectedTeam(t)}>
              <img src={t.avatar} alt="" />
              <div className="team-info">
                <div className="team-name">{t.name}</div>
                {t.description && <div className="team-desc muted small">{t.description}</div>}
                <div className="team-stats">
                  <span>{t.members} участников</span>
                  <span>{t.quests} квестов</span>
                </div>
              </div>
              <div className="team-right" onClick={(e) => e.stopPropagation()}>
                {t.code && t.is_mine && (
                  <button className="team-code" onClick={() => copyCode(t)} title="Скопировать код команды">
                    <span className="team-code-label">код</span>
                    <b>{t.code}</b>
                    {copied === t.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
                {t.is_mine ? (
                  <span className="pending-wrap">
                    <span className="joined-label">Вы в команде</span>
                    <button className="btn btn-outline btn-sm" onClick={() => setConfirmLeave(t)}>
                      Выйти
                    </button>
                  </span>
                ) : (
                  <button className="btn btn-outline" onClick={() => join(t)} disabled={t.members >= TEAM_MAX}>
                    {t.members >= TEAM_MAX ? 'Команда заполнена' : 'Вступить'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="muted" style={{ padding: 20 }}>Пока нет команд — создайте первую!</p>}
      </div>

      {selectedTeam && (
        <Modal
          title="Информация о команде"
          onClose={() => setSelectedTeam(null)}
          className="modal-wide"
        >
          <div className="team-detail-modal">
            <div className="td-left">
              <div className="td-header">
                <img src={selectedTeam.avatar} alt="" className="td-avatar" />
                <div style={{ flex: 1 }}>
                  <h2 className="td-name">{selectedTeam.name}</h2>
                  <div className="td-stats small muted">
                    {selectedTeam.members} участников · {selectedTeam.quests} квестов · {selectedTeam.points} очков
                    {selectedTeam.is_mine && selectedTeam.code && (
                      <>
                        {' '}
                        · Код: <b>{selectedTeam.code}</b>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {selectedTeam.description && (
                <div className="td-section">
                  <div className="td-label">Описание</div>
                  <p className="td-desc">{selectedTeam.description}</p>
                </div>
              )}
            </div>
          </div>
          <div className="modal-actions">
            {selectedTeam.is_mine && (
              <button
                className="btn btn-outline btn-danger"
                onClick={() => {
                  setConfirmLeave(selectedTeam)
                  setSelectedTeam(null)
                }}
                style={{ marginRight: 'auto' }}
              >
                Выйти из команды
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setSelectedTeam(null)}>
              Закрыть
            </button>
          </div>
        </Modal>
      )}

      {confirmLeave && (
        <Modal title="Выйти из команды" onClose={() => setConfirmLeave(null)}>
          <p>Точно выйти из команды «{confirmLeave.name}»?</p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setConfirmLeave(null)}>
              Отмена
            </button>
            <button className="btn btn-primary" onClick={() => leave(confirmLeave)}>
              Выйти
            </button>
          </div>
        </Modal>
      )}

      {creating && (
        <Modal title="Создать команду" onClose={() => setCreating(false)}>
          <label className="form-label">Название</label>
          <input
            className="field"
            placeholder="Например, Друзья"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div style={{ height: 14 }} />
          <label className="form-label">Описание</label>
          <textarea
            className="field"
            rows={3}
            placeholder="Кто вы, как играете, какие квесты берёте"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setCreating(false)}>
              Отмена
            </button>
            <button className="btn btn-primary" onClick={create} disabled={name.trim().length < 2}>
              Создать
            </button>
          </div>
        </Modal>
      )}

      {joining && (
        <Modal
          title="Вступить по коду команды"
          onClose={() => {
            setJoining(false)
            setError('')
          }}
        >
          <label className="form-label">Код команды</label>
          <input
            className="field"
            placeholder="Например, FRIEND1"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && joinByCode()}
          />
          {error && (
            <div className="auth-error" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
          <div className="modal-actions">
            <button
              className="btn btn-outline"
              onClick={() => {
                setJoining(false)
                setError('')
              }}
            >
              Отмена
            </button>
            <button className="btn btn-primary" onClick={joinByCode} disabled={!code.trim()}>
              Вступить
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
