import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Lightbulb, LogOut, Trophy, X } from 'lucide-react'
import { api } from '../api/client'
import type { Quest } from '../types'
import { QuestMap } from '../components/QuestMap'

export function PlayQuest() {
  const { id } = useParams()
  const nav = useNavigate()
  const [quest, setQuest] = useState<Quest | null>(null)
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'ok' | 'err' | null>(null)
  const [showHint, setShowHint] = useState(true)
  const [showTask, setShowTask] = useState(true)

  useEffect(() => {
    if (id) api.getQuest(Number(id)).then((q) => setQuest(q ?? null))
  }, [id])

  if (!quest) {
    return (
      <div className="play">
        <div className="container">
          <p style={{ padding: 40 }}>Загрузка...</p>
        </div>
      </div>
    )
  }

  const total = quest.points.length
  const done = current
  const finished = done >= total

  const check = () => {
    const point = quest.points[current]
    const norm = (s: string) => s.trim().toLowerCase().replace(/ё/g, 'е')
    if (norm(answer) === norm(point.answer)) {
      setFeedback('ok')
      setTimeout(() => {
        setFeedback(null)
        setAnswer('')
        setCurrent((c) => c + 1)
      }, 900)
    } else {
      setFeedback('err')
    }
  }

  return (
    <div className="play">
      <div className="container">
        <div className="play-header">
          <button className="icon-btn" onClick={() => nav(`/quests/${quest.id}`)}>
            <ArrowLeft size={18} />
          </button>
          <div className="play-title">Прохождение квеста</div>
          <button
            className="btn btn-ghost-light"
            style={{ marginLeft: 'auto' }}
            onClick={() => nav(`/quests/${quest.id}`)}
          >
            <LogOut size={16} />
            Выход
          </button>
        </div>

        <div className="play-grid">
          <QuestMap
            points={quest.points}
            dark
            visited={Array.from({ length: done }, (_, i) => i)}
            current={finished ? undefined : current}
            className="play-map-card"
          />

          <div className="play-card">
            <div className="play-progress">
              <div style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
            </div>

            {finished ? (
              <div className="play-done">
                <div className="trophy">
                  <Trophy size={34} />
                </div>
                <h2>Квест завершён!</h2>
                <p className="muted small" style={{ marginTop: 8 }}>
                  Вы прошли все {total} точек и заработали {total * 9 + 9} баллов
                </p>
                <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 22 }} onClick={() => nav('/leaderboard')}>
                  Смотреть рейтинг
                </button>
              </div>
            ) : (
              <div className="play-card-body">
                <div className="play-progress-row">
                  <div className="play-bulb">
                    <Lightbulb size={22} />
                  </div>
                  <div>
                    <div className="play-score">
                      {done}/{total}
                    </div>
                    <div className="caption muted">Прогресс</div>
                  </div>
                </div>

                <hr />

                <div className="play-sec-head">
                  Текущая точка
                  <button
                    className="icon-btn"
                    style={{ width: 30, height: 30, border: 0, background: 'transparent' }}
                    onClick={() => setShowTask((v) => !v)}
                  >
                    {showTask ? <X size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {showTask && (
                  <>
                    <div className="play-point-name">
                      <span className="play-point-num">{current + 1}</span>
                      {quest.points[current].title}
                    </div>
                    <p className="play-task">{quest.points[current].task}</p>
                    <input
                      className="field"
                      placeholder="Введите ответ..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && check()}
                    />
                    <div style={{ height: 14 }} />
                    {feedback === 'ok' && <div className="play-feedback ok">Верно! Переходим к следующей точке…</div>}
                    {feedback === 'err' && <div className="play-feedback err">Неверно. Попробуйте ещё раз!</div>}
                    <button className="btn btn-primary btn-block btn-lg" onClick={check}>
                      Проверить
                    </button>
                  </>
                )}

                <hr />

                <div className="play-sec-head">
                  Подсказка
                  <button
                    className="icon-btn"
                    style={{ width: 30, height: 30, border: 0, background: 'transparent' }}
                    onClick={() => setShowHint((v) => !v)}
                  >
                    {showHint ? <X size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
                {showHint && (
                  <div className="hint-box" style={{ marginTop: 12 }}>
                    {quest.points[current].hint}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
