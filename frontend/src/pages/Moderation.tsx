import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ShieldAlert } from 'lucide-react'
import { api } from '../api/client'
import type { Complaint, Quest } from '../types'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { useUser } from '../context/UserContext'

export function Moderation() {
  const { user } = useUser()
  const [tab, setTab] = useState<'quests' | 'complaints'>('quests')
  const [pending, setPending] = useState<Quest[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [rejecting, setRejecting] = useState<Quest | null>(null)
  const [reason, setReason] = useState('')
  const { toast } = useToast()

  const isModerator = user?.role === 'MODERATOR'

  useEffect(() => {
    if (!isModerator) return
    api.moderationQueue('pending').then(setPending)
    api.getComplaints().then(setComplaints)
  }, [isModerator])

  if (!isModerator) {
    return (
      <div className="container page">
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <ShieldAlert size={40} className="muted" />
          <h2 style={{ marginTop: 12 }}>Доступ только для модераторов</h2>
          <p className="muted small" style={{ marginTop: 8 }}>
            Эта панель доступна пользователям с ролью «модератор». Войдите под демо-аккаунтом:{' '}
            <b>moderator / demo123</b>.
          </p>
          <Link className="btn btn-primary" to="/login" style={{ marginTop: 18 }}>
            Войти как модератор
          </Link>
        </div>
      </div>
    )
  }

  const approve = async (q: Quest) => {
    await api.approveQuest(q.id)
    setPending((ps) => ps.filter((p) => p.id !== q.id))
    toast(`«${q.title}» одобрен`, 'ok')
  }

  const submitReject = async () => {
    if (!rejecting || reason.trim().length < 3) return
    await api.rejectQuest(rejecting.id, reason.trim())
    setPending((ps) => ps.filter((p) => p.id !== rejecting.id))
    toast(`«${rejecting.title}» отклонён`, 'err')
    setRejecting(null)
    setReason('')
  }

  const resolve = async (c: Complaint) => {
    await api.resolveComplaint(c.id)
    setComplaints((cs) => cs.filter((x) => x.id !== c.id))
    toast('Жалоба обработана', 'ok')
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
                    <span>· {q.points_count} точек</span>
                  </div>
                </div>
                <div className="mod-actions">
                  <Link className="btn btn-outline" to={`/quests/${q.id}`}>
                    Открыть
                  </Link>
                  <button className="btn btn-primary" onClick={() => approve(q)}>
                    Одобрить
                  </button>
                  <button className="btn btn-outline" onClick={() => setRejecting(q)}>
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
                <th />
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.quest_title}</td>
                  <td>{c.author}</td>
                  <td className="muted">{c.reason}</td>
                  <td className="muted">{c.date}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => resolve(c)}>
                      Обработать
                    </button>
                  </td>
                </tr>
              ))}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted" style={{ padding: 20 }}>
                    Жалоб нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <Modal title="Отклонить квест" onClose={() => setRejecting(null)}>
          <p className="muted small" style={{ marginTop: 0 }}>
            Укажите причину отклонения для автора квеста «{rejecting.title}».
          </p>
          <textarea
            className="field"
            rows={4}
            placeholder="Например: задание не соответствует указанной локации"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setRejecting(null)}>
              Отмена
            </button>
            <button className="btn btn-primary" onClick={submitReject} disabled={reason.trim().length < 3}>
              Отклонить
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
