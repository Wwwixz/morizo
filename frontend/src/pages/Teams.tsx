import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../api/client'
import type { Team } from '../types'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'

export function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [tab, setTab] = useState<'mine' | 'all'>('mine')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    api.getTeams().then(setTeams)
  }, [])

  const list = tab === 'mine' ? teams.filter((t) => t.is_mine) : teams

  const join = async (t: Team) => {
    const res = await api.joinTeam(t.id)
    setTeams([...res])
    toast(`Вы вступили в команду «${t.name}»`)
  }

  const create = async () => {
    if (!name.trim()) return
    const res = await api.createTeam(name.trim())
    setTeams([...res])
    setName('')
    setCreating(false)
    toast('Команда создана!')
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Команды</h1>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} />
          Создать команду
        </button>
      </div>

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
            <div>
              <div className="team-name">{t.name}</div>
              <div className="team-stats">
                <span>{t.members} участников</span>
                <span>{t.quests} квестов</span>
              </div>
            </div>
            <div className="team-right">
              {t.is_mine ? (
                <span className="joined-label">Вы в команде</span>
              ) : (
                <button className="btn btn-outline" onClick={() => join(t)}>
                  Вступить
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
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setCreating(false)}>
              Отмена
            </button>
            <button className="btn btn-primary" onClick={create}>
              Создать
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
