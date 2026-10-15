import { useEffect, useState } from 'react'
import { Check, Copy, Plus, UserPlus } from 'lucide-react'
import { api } from '../api/client'
import { TEAM_MAX, TEAM_MIN } from '../api/teams'
import type { Team } from '../types'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'

export function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [tab, setTab] = useState<'mine' | 'all'>('mine')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [joining, setJoining] = useState(false)
  const [code, setCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    api.getTeams().then(setTeams)
  }, [])

  const list = tab === 'mine' ? teams.filter((t) => t.is_mine) : teams

  const join = async (t: Team) => {
    const res = await api.joinTeam(t.id)
    setTeams(res.teams)
    if (res.error) toast(res.error)
    else toast(`Вы вступили в команду «${t.name}»`)
  }

  const create = async () => {
    if (!name.trim()) return
    const team = await api.createTeam(name.trim(), description.trim())
    setTeams(await api.getTeams())
    setName('')
    setDescription('')
    setCreating(false)
    toast(`Команда создана! Код для приглашения: ${team.code}`)
  }

  const joinByCode = async () => {
    const res = await api.joinTeamByCode(code)
    setTeams(res.teams)
    if (res.error) {
      setJoinError(res.error)
      return
    }
    setJoining(false)
    setCode('')
    setJoinError('')
    toast(`Вы вступили в команду «${res.joined?.name}»`)
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
          Моя команда
        </button>
        <button className={`tab-u ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          Все команды
        </button>
      </div>

      <div className="card" style={{ padding: '10px 6px' }}>
        {list.map((t) => (
          <div className="team-row" key={t.id}>
            <img src={t.avatar} alt="" />
            <div className="team-info">
              <div className="team-name">{t.name}</div>
              {t.description && <div className="team-desc muted small">{t.description}</div>}
              <div className="team-stats">
                <span>{t.members} участников</span>
                <span>{t.quests} квестов</span>
              </div>
            </div>
            <div className="team-right">
              {t.code && (
                <button className="team-code" onClick={() => copyCode(t)} title="Скопировать код команды">
                  <span className="team-code-label">код</span>
                  <b>{t.code}</b>
                  {copied === t.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
              {t.is_mine ? (
                <span className="joined-label">Вы в команде</span>
              ) : (
                <button className="btn btn-outline" onClick={() => join(t)} disabled={t.members >= TEAM_MAX}>
                  {t.members >= TEAM_MAX ? 'Команда заполнена' : 'Вступить'}
                </button>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="muted" style={{ padding: 20 }}>Пока нет команд — создайте первую!</p>}
      </div>

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
            <button className="btn btn-primary" onClick={create} disabled={!name.trim()}>
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
            setJoinError('')
          }}
        >
          <label className="form-label">Код команды</label>
          <input
            className="field"
            placeholder="Например, DRUZYA"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setJoinError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && joinByCode()}
          />
          {joinError && <div className="auth-error" style={{ marginTop: 12 }}>{joinError}</div>}
          <div className="modal-actions">
            <button
              className="btn btn-outline"
              onClick={() => {
                setJoining(false)
                setJoinError('')
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
