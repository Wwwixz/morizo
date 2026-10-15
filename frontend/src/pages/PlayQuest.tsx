import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Clock, Lightbulb, LogOut, Trophy, UsersRound, X } from 'lucide-react'
import { api } from '../api/client'
import {
  RUN_STATUS_LABEL,
  abandonRun,
  completePoint,
  fmtTime,
  runDurationMin,
  runStatus,
  startRun,
  type QuestRun,
} from '../api/runs'
import type { Quest } from '../types'
import { QuestMap } from '../components/QuestMap'

export function PlayQuest() {
  const { id } = useParams()
  const nav = useNavigate()
  const [quest, setQuest] = useState<Quest | null>(null)
  const [run, setRun] = useState<QuestRun | null>(null)
  const [answer, setAnswer] = useState('')
  const [choice, setChoice] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'ok' | 'err' | null>(null)
  const [showHint, setShowHint] = useState(true)
  const [showTask, setShowTask] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!id) return
    api.getQuest(Number(id)).then((q) => {
      if (!q) {
        setQuest(null)
        return
      }
      setQuest(q)
      setRun(startRun(q))
    })
  }, [id])

  // Тикаем раз в секунду, чтобы показывать сколько прошло с момента старта
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const total = quest ? run?.total ?? quest.points.length : 0
  const done = run?.done.length ?? 0
  const finished = total > 0 && done >= total
  // Строгий порядок: доступна только текущая точка
  const point = quest && !finished ? quest.points[done] : null
  const isChoice = Boolean(point && point.type === 'choice' && point.options?.length)
  const status = run ? runStatus(run) : 'started'
  const isAnswerReady = isChoice ? Boolean(choice) : Boolean(answer.trim())
  // На карте две метки: где мы находимся и куда нужно идти
  const mapPoints = useMemo(() => {
    if (!quest) return []
    if (finished) return quest.points
    const target = quest.points[done]
    if (!target) return []
    // на старте — точка сбора, дальше — предыдущий пройденный чекпоинт
    const here = done > 0 ? quest.points[done - 1] : quest.start
    return here ? [here, target] : [target]
  }, [quest, done, finished])
  const targetIndex = finished ? undefined : mapPoints.length - 1
  const youIndex = finished ? undefined : 0
  // Сколько прошло с момента старта (отсчёт от 00:00:00)
  const elapsed = run
    ? Math.max(
        0,
        Math.floor(((run.finished_at ? Date.parse(run.finished_at) : now) - Date.parse(run.started_at)) / 1000),
      )
    : 0
  const fmtElapsed = (s: number) =>
    [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, '0')).join(':')

  if (!quest) {
    return (
      <div className="play">
        <div className="container">
          <p style={{ padding: 40 }}>Загрузка...</p>
        </div>
      </div>
    )
  }

  const check = () => {
    if (!point || feedback === 'ok' || !isAnswerReady) return
    const norm = (s: string) => s.trim().toLowerCase().replace(/ё/g, 'е')
    const value = isChoice ? choice ?? '' : answer
    if (norm(value) === norm(point.answer)) {
      setFeedback('ok')
      setTimeout(() => {
        setFeedback(null)
        setAnswer('')
        setChoice(null)
        setRun((r) => (r ? completePoint(r, r.done.length) : r))
      }, 900)
    } else {
      setFeedback('err')
    }
  }

  const exit = () => {
    if (run && !finished) setRun(abandonRun(run))
    nav(`/quests/${quest.id}`)
  }

  return (
    <div className="play">
      <div className="container">
        <div className="play-header">
          <button className="icon-btn" onClick={exit}>
            <ArrowLeft size={18} />
          </button>
          <div className="play-title">Прохождение квеста</div>
          {run?.team && (
            <span className="run-chip team">
              <UsersRound size={13} /> {run.team.name} · {run.team.members} чел
            </span>
          )}
          {run && <span className={`run-chip ${status}`}>{RUN_STATUS_LABEL[status]}</span>}
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
            youLabel="Сейчас вы находитесь здесь"
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
                  Вы прошли все {total} точек и заработали {total * 9 + 9} баллов
                </p>
                {run?.team && (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Команда «{run.team.name}» · {run.team.members} чел
                  </p>
                )}
                {run?.finished_at && (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Старт {fmtTime(run.started_at)} · финиш {fmtTime(run.finished_at)} ·{' '}
                    {runDurationMin(run)} мин в пути
                  </p>
                )}
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
                    <div className="caption muted">точек</div>
                  </div>
                  {run && (
                    <div className="play-time caption muted">
                      <span className="play-time-row">
                        <Clock size={13} />
                        старт {fmtTime(run.started_at)}
                      </span>
                      <span className="play-time-row">прошло {fmtElapsed(elapsed)}</span>
                    </div>
                  )}
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
                    {feedback === 'err' && <div className="play-feedback err">Неверно. Попробуйте ещё раз!</div>}
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
                    onClick={() => setShowHint((v) => !v)}
                  >
                    {showHint ? <X size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
                {showHint && point && (
                  <div className="hint-box" style={{ marginTop: 12 }}>
                    {point.hint}
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
