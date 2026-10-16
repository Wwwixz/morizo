import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Clock, Lightbulb, LogOut, Trophy, UsersRound, X } from 'lucide-react'
import { api } from '../api/client'
import type { PlaySession, PlayStatus, QuestPoint } from '../types'
import { QuestMap } from '../components/QuestMap'

const STATUS_LABEL: Record<PlayStatus, string> = {
  STARTED: 'Начато',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершено',
  ABANDONED: 'Брошено',
}

/** css-класс чипа статуса (см. .run-chip в styles.css) */
export const STATUS_CHIP: Record<PlayStatus, string> = {
  STARTED: 'started',
  IN_PROGRESS: 'progress',
  COMPLETED: 'done',
  ABANDONED: 'abandoned',
}

const fmtTime = (ms?: number | null) =>
  ms ? new Date(ms).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'

export function PlayQuest() {
  const { id } = useParams()
  const nav = useNavigate()
  const [session, setSession] = useState<PlaySession | null>(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [choice, setChoice] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'ok' | 'err' | null>(null)
  const [error, setError] = useState('')
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [hintText, setHintText] = useState('')
  const [showTask, setShowTask] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!id) return
    let alive = true
    api
      .startPlay(Number(id))
      .then((s) => alive && setSession(s))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Не удалось начать квест'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const total = session?.total ?? 0
  const done = session?.current ?? 0
  const finished = session?.finished ?? false
  const point: QuestPoint | null = finished ? null : session?.current_point ?? null
  const isChoice = Boolean(point && point.type === 'choice' && point.options?.length)
  const status: PlayStatus = session?.status ?? 'STARTED'
  const isAnswerReady = isChoice ? Boolean(choice) : Boolean(answer.trim())

  // На карте: пройденные + текущая точка. «Вы здесь» — предыдущий чекпоинт.
  const mapPoints = useMemo(() => session?.points ?? [], [session])
  const targetIndex = finished || mapPoints.length === 0 ? undefined : mapPoints.length - 1
  const youIndex = finished ? undefined : Math.max(0, mapPoints.length - 2)

  const elapsed = session
    ? Math.max(0, Math.floor(((session.finished_at ?? now) - session.started_at) / 1000))
    : 0
  const fmtElapsed = (s: number) =>
    [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, '0')).join(':')

  if (loading) {
    return (
      <div className="play">
        <div className="container">
          <p style={{ padding: 40 }}>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="play">
        <div className="container">
          <p style={{ padding: 40 }}>{error || 'Не удалось загрузить квест'}</p>
          <button className="btn btn-outline" onClick={() => nav('/quests')}>
            К каталогу
          </button>
        </div>
      </div>
    )
  }

  const check = async () => {
    if (!point || feedback === 'ok' || !isAnswerReady) return
    const value = isChoice ? choice ?? '' : answer
    setError('')
    try {
      const res = await api.answer(session.session_id, value)
      setAttemptsLeft(res.attempts_left)
      if (res.correct) {
        setFeedback('ok')
        setTimeout(async () => {
          setFeedback(null)
          setAnswer('')
          setChoice(null)
          setShowHint(false)
          setHintText('')
          try {
            setSession(await api.getPlay(session.session_id))
          } catch {
            /* игнорируем: обновимся при следующем действии */
          }
        }, 800)
      } else {
        setFeedback('err')
      }
    } catch (e) {
      setFeedback('err')
      setError(e instanceof Error ? e.message : 'Ошибка проверки ответа')
    }
  }

  const openHint = async () => {
    const next = !showHint
    setShowHint(next)
    if (next && !hintText) {
      setHintText(point?.hint ?? '')
      try {
        const p = await api.hint(session.session_id)
        if (p.hint) setHintText(p.hint)
      } catch {
        /* подсказка уже показана из данных точки */
      }
    }
  }

  const exit = () => {
    if (!finished) api.abandonPlay(session.session_id).catch(() => {})
    nav(`/quests/${session.quest_id}`)
  }

  return (
    <div className="play">
      <div className="container">
        <div className="play-header">
          <button className="icon-btn" onClick={exit}>
            <ArrowLeft size={18} />
          </button>
          <div className="play-title">{session.quest_title}</div>
          {session.team_id != null && (
            <span className="run-chip team">
              <UsersRound size={13} /> Командой
            </span>
          )}
          <span className={`run-chip ${STATUS_CHIP[status]}`}>{STATUS_LABEL[status]}</span>
          <button className="btn btn-outline" style={{ marginLeft: 'auto' }} onClick={exit}>
            <LogOut size={16} />
            Выход
          </button>
        </div>

        <div className="play-grid">
          <QuestMap
            points={mapPoints}
            current={targetIndex}
            currentLabel={finished ? undefined : 'Идите сюда'}
            youIndex={youIndex}
            youLabel="Предыдущая точка"
            showRoute={finished}
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
                  Вы прошли все {total} точек и заработали {session.score} баллов
                </p>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Старт {fmtTime(session.started_at)} · финиш {fmtTime(session.finished_at)}
                </p>
                {!session.counted_for_rating && (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    (результат не засчитан в рейтинг — квест уже проходил в последние 24 часа)
                  </p>
                )}
                <button
                  className="btn btn-primary btn-block btn-lg"
                  style={{ marginTop: 22 }}
                  onClick={() => nav('/leaderboard')}
                >
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
                    <div className="caption muted">точек</div>
                  </div>
                  <div className="play-time caption muted">
                    <span className="play-time-row">
                      <Clock size={13} />
                      старт {fmtTime(session.started_at)}
                    </span>
                    <span className="play-time-row">прошло {fmtElapsed(elapsed)}</span>
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

                {showTask && point && (
                  <>
                    <div className="play-point-name">
                      <span className="play-point-num">{done + 1}</span>
                      {point.title}
                    </div>
                    <p className="play-task">{point.task}</p>
                    {point.point_rules && <div className="hint-box small">{point.point_rules}</div>}

                    {isChoice ? (
                      <div className="play-options">
                        {point.options?.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`play-option ${choice === opt ? 'active' : ''}`}
                            onClick={() => setChoice(opt)}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        className="field"
                        placeholder="Введите ответ..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && check()}
                      />
                    )}
                    <div style={{ height: 14 }} />
                    {feedback === 'ok' && <div className="play-feedback ok">Верно! Переходим к следующей точке…</div>}
                    {feedback === 'err' && (
                      <div className="play-feedback err">
                        Неверно. Попробуйте ещё раз!
                        {attemptsLeft != null && ` Осталось попыток: ${attemptsLeft}.`}
                      </div>
                    )}
                    {error && <div className="play-feedback err">{error}</div>}
                    <button
                      className="btn btn-primary btn-block btn-lg"
                      onClick={check}
                      disabled={!isAnswerReady || feedback === 'ok'}
                    >
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
                    onClick={openHint}
                  >
                    {showHint ? <X size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
                {showHint && (
                  <div className="hint-box" style={{ marginTop: 12 }}>
                    {hintText || 'Подсказка недоступна'}
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
