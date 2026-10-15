import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Check, Copy, Edit, Plus, Search, UserMinus, UserPlus, X } from 'lucide-react'
import { api } from '../api/client'
import { TEAM_MAX, TEAM_MIN } from '../api/teams'
import type { JoinRequest, Team, TeamMember } from '../types'
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
  const [joinError, setJoinError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [newAvatar, setNewAvatar] = useState('/img/avatars/u3.jpg')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<{ teamId: number; member: TeamMember } | null>(null)
  const [confirmLeave, setConfirmLeave] = useState<Team | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const newAvatarInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    api.getTeams().then(setTeams)
  }, [])

  const list = (tab === 'mine' ? teams.filter((t) => t.is_mine) : teams).filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Роли: менять команду может только президент; исключать участников — президент и вице.
  const myRole = selectedTeam?.membersList?.find((m) => m.id === user?.id)?.role
  const canEdit = myRole === 'president'
  const canRemove = (m: TeamMember) =>
    (myRole === 'president' || myRole === 'vice') &&
    m.id !== user?.id &&
    (myRole === 'president' ? m.role !== 'president' : m.role === 'member')

  const join = async (t: Team) => {
    const res = await api.requestToJoin(t.id)
    setTeams(res.teams)
    if (res.error) toast(res.error)
    else toast(`Запрос на вступление в команду «${t.name}» отправлен`)
  }

  const cancelJoin = async (t: Team) => {
    const res = await api.cancelJoinRequest(t.id)
    setTeams(res.teams)
    toast(`Запрос в команду «${t.name}» отменён`)
  }

  const leave = async (t: Team) => {
    setConfirmLeave(null)
    const ts = await api.leaveTeam(t.id)
    setTeams(ts)
    if (selectedTeam?.id === t.id) setSelectedTeam(ts.find((x) => x.id === t.id) ?? null)
    toast(`Вы вышли из команды «${t.name}»`)
  }

  const accept = async (teamId: number, req: JoinRequest) => {
    const ts = await api.acceptTeamRequest(teamId, req)
    setTeams(ts)
    if (selectedTeam?.id === teamId) {
      const updated = ts.find((t) => t.id === teamId)
      if (updated) setSelectedTeam(updated)
    }
    toast(`Пользователь ${req.userName} принят в команду`)
  }

  const reject = async (teamId: number, userId: number) => {
    const ts = await api.rejectTeamRequest(teamId, userId)
    setTeams(ts)
    if (selectedTeam?.id === teamId) {
      const updated = ts.find((t) => t.id === teamId)
      if (updated) setSelectedTeam(updated)
    }
    toast('Запрос отклонен')
  }

  const create = async () => {
    if (!name.trim()) return
    const team = await api.createTeam(name.trim(), description.trim(), user ?? undefined, newAvatar)
    setTeams(await api.getTeams())
    setName('')
    setDescription('')
    setNewAvatar('/img/avatars/u3.jpg')
    setCreating(false)
    toast(`Команда создана! Код для приглашения: ${team.code}`)
  }

  /** Загрузить выбранный из проводника файл как изображение (data URL) */
  const pickNewAvatar = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Выберите файл изображения')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setNewAvatar(String(reader.result))
    reader.onerror = () => toast('Не удалось загрузить изображение')
    reader.readAsDataURL(file)
  }

  const joinByCode = async () => {
    if (!user) return
    const res = await api.joinTeamByCode(code, user)
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

  const startEdit = () => {
    if (!selectedTeam) return
    setEditName(selectedTeam.name)
    setEditDesc(selectedTeam.description || '')
    setEditAvatar(selectedTeam.avatar)
    setIsEditing(true)
  }

  /** Загрузить выбранный из проводника файл как изображение (data URL) */
  const pickAvatar = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Выберите файл изображения')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setEditAvatar(String(reader.result))
    reader.onerror = () => toast('Не удалось загрузить изображение')
    reader.readAsDataURL(file)
  }

  const saveEdit = async () => {
    if (!selectedTeam || !editName.trim()) return
    const ts = await api.updateTeam(selectedTeam.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      avatar: editAvatar.trim(),
    })
    setTeams(ts)
    const updated = ts.find((t) => t.id === selectedTeam.id)
    if (updated) setSelectedTeam(updated)
    setIsEditing(false)
    toast('Информация о команде обновлена')
  }

  const excludeMember = async (teamId: number, member: TeamMember) => {
    setConfirmRemove(null)
    const ts = await api.removeTeamMember(teamId, member.id)
    setTeams(ts)
    const updated = ts.find((t) => t.id === teamId)
    if (updated) setSelectedTeam(updated)
    toast(`${member.name} исключён из команды`)
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

  const ROLE_LABELS: Record<string, string> = {
    president: 'Президент',
    vice: 'Вице-президент',
    member: 'Участник',
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
                ) : t.is_pending ? (
                  <span className="pending-wrap">
                    <span className="pending-label">Запрос отправлен</span>
                    <button className="btn btn-outline btn-sm" onClick={() => cancelJoin(t)}>
                      Отменить
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
          title={isEditing ? 'Редактировать команду' : 'Информация о команде'}
          onClose={() => {
            setSelectedTeam(null)
            setIsEditing(false)
          }}
          className="modal-wide"
        >
          {isEditing ? (
            <div className="team-edit-form">
              <div className="td-section">
                <label className="form-label">Фотография команды</label>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    pickAvatar(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  className="avatar-picker"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Изменить фото"
                >
                  <img src={editAvatar} alt="" className="td-avatar" />
                  <span className="avatar-picker-overlay">
                    <Camera size={18} />
                    Изменить
                  </span>
                </button>
              </div>
              <div className="td-section">
                <label className="form-label">Название</label>
                <input
                  className="field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Название команды"
                />
              </div>
              <div className="td-section">
                <label className="form-label">Описание</label>
                <textarea
                  className="field"
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Описание команды"
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
                  Отмена
                </button>
                <button className="btn btn-primary" onClick={saveEdit} disabled={!editName.trim()}>
                  Сохранить
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="team-detail-modal">
                <div className="td-left">
                  <div className="td-header">
                    <img src={selectedTeam.avatar} alt="" className="td-avatar" />
                    <div style={{ flex: 1 }}>
                      <div className="td-name-row">
                        <h2 className="td-name">{selectedTeam.name}</h2>
                        {canEdit && (
                          <button className="btn-icon" onClick={startEdit} title="Редактировать">
                            <Edit size={16} />
                          </button>
                        )}
                      </div>
                      <div className="td-stats small muted">
                        {selectedTeam.quests} квестов · {selectedTeam.points} очков
                        {selectedTeam.is_mine && selectedTeam.code && (
                          <> · Код: <b>{selectedTeam.code}</b></>
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
                  {selectedTeam.achievements && selectedTeam.achievements.length > 0 && (
                    <div className="td-section">
                      <div className="td-label">Достижения</div>
                      <div className="td-ach-list">
                        {selectedTeam.achievements.map((a) => (
                          <div key={a.id} className="td-ach-item" style={{ borderColor: a.color }}>
                            <span className="td-ach-dot" style={{ background: a.color }} />
                            <div>
                              <div className="td-ach-title">{a.title}</div>
                              <div className="td-ach-desc small muted">{a.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="td-right">
                  <div className="td-label">Участники команды</div>
                  <div className="td-members-list">
                  {selectedTeam.membersList?.map((m) => (
                    <div key={m.id} className="td-member-row">
                      <Link to={`/profile/${m.id}`} className="lb-user">
                        <img src={m.avatar} alt="" />
                        <div className="td-member-info">
                          <div className="td-member-name">{m.name}</div>
                          <div className="td-member-role">{ROLE_LABELS[m.role]}</div>
                        </div>
                      </Link>
                      {canRemove(m) && (
                          <button
                            className="btn-icon reject"
                            style={{ marginLeft: 'auto' }}
                            onClick={() => setConfirmRemove({ teamId: selectedTeam.id, member: m })}
                            title="Исключить из команды"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedTeam.is_mine && selectedTeam.requests && selectedTeam.requests.length > 0 && (
                    <div className="td-section" style={{ marginTop: 24 }}>
                      <div className="td-label">Запросы на вступление</div>
                      <div className="team-requests">
                        {selectedTeam.requests.map((req) => (
                          <div className="request-row" key={req.userId}>
                            <Link to={`/profile/${req.userId}`} className="lb-user">
                              <img src={req.userAvatar} alt="" className="request-avatar" />
                              <span className="request-name">{req.userName}</span>
                            </Link>
                            <div className="request-actions">
                              <button
                                className="btn-icon accept"
                                onClick={() => accept(selectedTeam.id, req)}
                                title="Принять"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className="btn-icon reject"
                                onClick={() => reject(selectedTeam.id, req.userId)}
                                title="Отклонить"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
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
                {selectedTeam.is_pending && (
                  <button
                    className="btn btn-outline btn-danger"
                    onClick={() => {
                      cancelJoin(selectedTeam)
                      setSelectedTeam(null)
                    }}
                    style={{ marginRight: 'auto' }}
                  >
                    Отменить запрос
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => setSelectedTeam(null)}>
                  Закрыть
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {confirmRemove && (
        <Modal title="Исключить участника" onClose={() => setConfirmRemove(null)}>
          <p>
            Точно ли вы хотите удалить {confirmRemove.member.name}?
          </p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setConfirmRemove(null)}>
              Отмена
            </button>
            <button
              className="btn btn-primary"
              onClick={() => excludeMember(confirmRemove.teamId, confirmRemove.member)}
            >
              Удалить
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
          <div className="td-section" style={{ alignItems: 'center', marginBottom: 20 }}>
            <label className="form-label">Фотография команды</label>
            <input
              ref={newAvatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                pickNewAvatar(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <button
              type="button"
              className="avatar-picker"
              onClick={() => newAvatarInputRef.current?.click()}
              title="Выбрать фото"
            >
              <img src={newAvatar} alt="" className="td-avatar" />
              <span className="avatar-picker-overlay">
                <Camera size={18} />
                Выбрать
              </span>
            </button>
          </div>

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
