import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { api } from '../api/client'
import type { Complaint, Quest } from '../types'
import { useToast } from '../components/Toast'

export function Moderation() {
  const [tab, setTab] = useState<'quests' | 'complaints'>('quests')
  const [pending, setPending] = useState<Quest[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const { toast } = useToast()

  useEffect(() => {
    api.getQuests('pending').then(setPending)
    api.getComplaints().then(setComplaints)
  }, [])

  const moderate = async (q: Quest, approve: boolean) => {
    await api.moderateQuest(q.id, approve)
    setPending((ps) => ps.filter((p) => p.id !== q.id))
    toast(approve ? `«${q.title}» одобрен` : `«${q.title}» отклонён`, approve ? 'ok' : 'err')
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Модерация</h1>
      </div>

      <div className="tabs-underline">
        <button className={`tab-u ${tab === 'quests' ? 'active' : ''}`} onClick={() => setTab('quests')}>
          Квесты
        </button>
        <button className={`tab-u ${tab === 'complaints' ? 'active' : ''}`} onClick={() => setTab('complaints')}>
          Жалобы
        </button>
      </div>

      {tab === 'quests' ? (
        <>
          <div className="page-head" style={{ marginBottom: 12 }}>
            <h3>Квесты на проверке</h3>
            <span className="mod-count">{pending.length}</span>
          </div>
          <div className="card" style={{ padding: '8px 6px' }}>
            {pending.map((q) => (
              <div className="mod-row" key={q.id}>
                <img className="mod-thumb" src={q.image} alt="" />
                <div>
                  <div style={{ fontWeight: 600 }}>{q.title}</div>
                  <div className="mod-meta">
                    <span>{q.district},</span>
                    <span>
                      <Clock size={13} /> {q.distance_km} км
                    </span>
                  </div>
                </div>
                <div className="mod-actions">
                  <button className="btn btn-primary" onClick={() => moderate(q, true)}>
                    Одобрить
                  </button>
                  <button className="btn btn-outline" onClick={() => moderate(q, false)}>
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
            {pending.length === 0 && <p className="muted" style={{ padding: 20 }}>Все квесты проверены 👌</p>}
          </div>
        </>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Квест</th>
                <th>Автор жалобы</th>
                <th>Причина</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.quest_title}</td>
                  <td>{c.author}</td>
                  <td className="muted">{c.reason}</td>
                  <td className="muted">{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
