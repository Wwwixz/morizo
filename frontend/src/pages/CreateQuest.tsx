import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ImagePlus, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import type { QuestPoint } from '../types'
import { useToast } from '../components/Toast'
import { useUser } from '../context/UserContext'

const DIFFICULTIES = ['1 — лёгко', '2 — ниже среднего', '3 — средне', '4 — сложно', '5 — очень сложно']
const DISTRICTS = ['Нижегородский район', 'Советский район', 'Канавинский район', 'Автозаводский район', 'Сормовский район']
const TRANSPORTS: { value: string; label: string }[] = [
  { value: 'FOOT', label: 'Пешком' },
  { value: 'PUBLIC_TRANSPORT', label: 'Общественный транспорт' },
  { value: 'CAR', label: 'Транспорт (авто)' },
  { value: 'DIRT_ROADS', label: 'Только по грунтовкам' },
  { value: 'NO_ROADS', label: 'Без дорог' },
]
const MIN_POINTS = 3

interface PointForm {
  lat: number
  lng: number
  title: string
  task: string
  type: 'word' | 'choice'
  answer: string
  hint: string
  pointRules: string
  options: string[]
  correctIndex: number
}

const emptyPoint = (): PointForm => ({
  lat: 56.3269,
  lng: 44.0059,
  title: '',
  task: '',
  type: 'word',
  answer: '',
  hint: '',
  pointRules: '',
  options: ['', '', '', ''],
  correctIndex: 0,
})

export function CreateQuest() {
  const nav = useNavigate()
  const { user } = useUser()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [district, setDistrict] = useState(DISTRICTS[0])
  const [difficulty, setDifficulty] = useState(1)
  const [durationMin, setDurationMin] = useState(60)
  const [playersMin, setPlayersMin] = useState(1)
  const [playersMax, setPlayersMax] = useState(6)
  const [transport, setTransport] = useState('FOOT')
  const [rules, setRules] = useState('')
  const [cover, setCover] = useState<File | null>(null)
  const [points, setPoints] = useState<PointForm[]>([emptyPoint()])
  const [busy, setBusy] = useState(false)

  const setPoint = (i: number, patch: Partial<PointForm>) =>
    setPoints((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  const setOption = (i: number, oi: number, value: string) =>
    setPoints((ps) =>
      ps.map((p, idx) => (idx === i ? { ...p, options: p.options.map((o, k) => (k === oi ? value : o)) } : p)),
    )

  const step0Ok = title.trim().length >= 5 && description.trim().length >= 30
  const step1Ok =
    points.length >= MIN_POINTS &&
    points.every(
      (p) =>
        p.title.trim().length > 0 &&
        p.task.trim().length >= 20 &&
        (p.type === 'word'
          ? p.answer.trim().length > 0
          : p.options.every((o) => o.trim().length > 0)),
    )

  const publish = async () => {
    if (!user) {
      nav('/login')
      return
    }
    if (!step0Ok || !step1Ok) {
      toast('Проверьте поля: название ≥5, описание ≥30, минимум 3 точки с заданиями ≥20 символов', 'err')
      return
    }
    const payloadPoints: QuestPoint[] = points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      title: p.title.trim(),
      task: p.task.trim(),
      hint: p.hint.trim(),
      type: p.type,
      point_rules: p.pointRules.trim() || undefined,
      options: p.type === 'choice' ? p.options.map((o) => o.trim()) : undefined,
      answer: p.type === 'choice' ? p.options[p.correctIndex].trim() : p.answer.trim(),
    }))
    setBusy(true)
    try {
      await api.createQuest(
        {
          title: title.trim(),
          description: description.trim(),
          district,
          difficulty,
          duration_min: durationMin,
          players_min: playersMin,
          players_max: playersMax,
          rules: rules.trim() || undefined,
          transport_mode: transport,
          points: payloadPoints,
        },
        cover,
      )
      toast('Квест отправлен на модерацию!')
      nav('/quests')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Не удалось создать квест', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Создание квеста</h1>
      </div>

      <div className="create-grid">
        <div className="card steps">
          {['Основная информация', 'Локации', 'Публикация'].map((label, i) => (
            <button
              key={label}
              className={`step ${step === i ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
            >
              <span className="step-num">{i + 1}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="card form-card">
          {step === 0 && (
            <>
              <h2 className="form-title">Основная информация</h2>

              <div className="form-group">
                <label className="form-label">Название квеста</label>
                <input
                  className="field"
                  placeholder="Введите название квеста"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="char-counter">{title.length}/120 · минимум 5</div>
              </div>

              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea
                  className="field"
                  placeholder="Введите описание"
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="char-counter">{description.length}/500 · минимум 30</div>
              </div>

              <div className="form-row form-group">
                <div>
                  <label className="form-label">Район / город</label>
                  <div className="select-wrap">
                    <select className="field" value={district} onChange={(e) => setDistrict(e.target.value)}>
                      {DISTRICTS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Уровень сложности</label>
                  <div className="select-wrap">
                    <select className="field" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
                      {DIFFICULTIES.map((d, i) => (
                        <option key={d} value={i + 1}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="form-row form-group">
                <div>
                  <label className="form-label">Длительность (мин)</label>
                  <input
                    className="field"
                    type="number"
                    min={5}
                    value={durationMin}
                    onChange={(e) => setDurationMin(Math.max(5, Number(e.target.value) || 0))}
                  />
                </div>
                <div>
                  <label className="form-label">Способ передвижения</label>
                  <div className="select-wrap">
                    <select className="field" value={transport} onChange={(e) => setTransport(e.target.value)}>
                      {TRANSPORTS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="form-row form-group">
                <div>
                  <label className="form-label">Игроков, мин</label>
                  <input
                    className="field"
                    type="number"
                    min={1}
                    max={6}
                    value={playersMin}
                    onChange={(e) => setPlayersMin(Number(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="form-label">Игроков, макс</label>
                  <input
                    className="field"
                    type="number"
                    min={1}
                    max={6}
                    value={playersMax}
                    onChange={(e) => setPlayersMax(Number(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Правила / предупреждения</label>
                <textarea
                  className="field"
                  rows={3}
                  placeholder="Необязательно: правила безопасности, ограничения по времени"
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Обложка</label>
                <label className={`dropzone ${cover ? 'has-file' : ''}`}>
                  <ImagePlus size={26} />
                  <div>
                    {cover ? (
                      <>Файл выбран: {cover.name}</>
                    ) : (
                      <>
                        Перетащите файл сюда или <b style={{ color: '#8a6d00' }}>выберите</b>
                        <br />
                        до 5 МБ, JPG, PNG
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    hidden
                    onChange={(e) => setCover(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="form-footer">
                <button className="btn btn-primary" disabled={!step0Ok} onClick={() => setStep(1)}>
                  Далее
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="form-title">Локации</h2>
              <p className="muted small" style={{ marginTop: -6, marginBottom: 16 }}>
                Нужно минимум {MIN_POINTS} точки. Задание — не короче 20 символов.
              </p>
              {points.map((p, i) => {
                const isChoice = p.type === 'choice'
                return (
                  <div className="point-item" key={i}>
                    <div className="point-item-head">
                      <span className="play-point-num">{i + 1}</span>
                      Точка {i + 1}
                      {points.length > MIN_POINTS && (
                        <button
                          className="icon-btn"
                          onClick={() => setPoints((ps) => ps.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Название точки</label>
                        <input
                          className="field"
                          placeholder="Например, Кремль"
                          value={p.title}
                          onChange={(e) => setPoint(i, { title: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Координаты</label>
                        <input
                          className="field"
                          placeholder="56.3269, 44.0059"
                          value={`${p.lat}, ${p.lng}`}
                          onChange={(e) => {
                            const [lat, lng] = e.target.value.split(',').map((v) => Number(v.trim()))
                            if (!Number.isNaN(lat) && !Number.isNaN(lng)) setPoint(i, { lat, lng })
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Задание</label>
                      <input
                        className="field"
                        placeholder="Что нужно найти или сделать (минимум 20 символов)"
                        value={p.task}
                        onChange={(e) => setPoint(i, { task: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Тип задания</label>
                      <div className="play-options" style={{ marginTop: 4 }}>
                        <button
                          type="button"
                          className={`play-option ${!isChoice ? 'active' : ''}`}
                          onClick={() => setPoint(i, { type: 'word' })}
                        >
                          Код-слово
                        </button>
                        <button
                          type="button"
                          className={`play-option ${isChoice ? 'active' : ''}`}
                          onClick={() => setPoint(i, { type: 'choice' })}
                        >
                          Вопрос с вариантами
                        </button>
                      </div>
                    </div>

                    {isChoice ? (
                      <div className="form-group">
                        <label className="form-label">Варианты ответа (отметьте правильный)</label>
                        {p.options.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <input
                              type="radio"
                              name={`correct-${i}`}
                              checked={p.correctIndex === oi}
                              onChange={() => setPoint(i, { correctIndex: oi })}
                              title="Правильный вариант"
                            />
                            <input
                              className="field"
                              placeholder={`Вариант ${oi + 1}`}
                              value={opt}
                              onChange={(e) => setOption(i, oi, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Правильный ответ</label>
                          <input
                            className="field"
                            placeholder="Правильный ответ"
                            value={p.answer}
                            onChange={(e) => setPoint(i, { answer: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Подсказка</label>
                          <input
                            className="field"
                            placeholder="Необязательно"
                            value={p.hint}
                            onChange={(e) => setPoint(i, { hint: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {isChoice && (
                      <div className="form-group">
                        <label className="form-label">Подсказка</label>
                        <input
                          className="field"
                          placeholder="Необязательно"
                          value={p.hint}
                          onChange={(e) => setPoint(i, { hint: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Правила точки</label>
                      <input
                        className="field"
                        placeholder="Например: не заходить за ограждение"
                        value={p.pointRules}
                        onChange={(e) => setPoint(i, { pointRules: e.target.value })}
                      />
                    </div>
                  </div>
                )
              })}

              <button className="btn btn-outline" onClick={() => setPoints((ps) => [...ps, emptyPoint()])}>
                + Добавить точку
              </button>

              <div className="form-footer">
                <button className="btn btn-outline" onClick={() => setStep(0)}>
                  Назад
                </button>
                <button className="btn btn-primary" disabled={!step1Ok} onClick={() => setStep(2)}>
                  Далее
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="form-title">Публикация</h2>
              <div className="form-group">
                <label className="form-label">Название</label>
                <p className="field" style={{ background: '#fafafa' }}>{title || '—'}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Описание</label>
                <p className="field" style={{ background: '#fafafa', whiteSpace: 'pre-wrap' }}>{description || '—'}</p>
              </div>
              <div className="form-row form-group">
                <div>
                  <label className="form-label">Район / город</label>
                  <p className="field" style={{ background: '#fafafa' }}>{district}</p>
                </div>
                <div>
                  <label className="form-label">Уровень сложности</label>
                  <p className="field" style={{ background: '#fafafa' }}>{DIFFICULTIES[difficulty - 1]}</p>
                </div>
              </div>
              <div className="form-row form-group">
                <div>
                  <label className="form-label">Длительность</label>
                  <p className="field" style={{ background: '#fafafa' }}>~{durationMin} мин</p>
                </div>
                <div>
                  <label className="form-label">Способ передвижения</label>
                  <p className="field" style={{ background: '#fafafa' }}>
                    {TRANSPORTS.find((t) => t.value === transport)?.label}
                  </p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Локации</label>
                <p className="field" style={{ background: '#fafafa' }}>
                  {points.length} точек: {points.map((p) => p.title || 'Без названия').join(', ')}
                </p>
              </div>
              {cover && (
                <div className="form-group">
                  <label className="form-label">Обложка</label>
                  <p className="field" style={{ background: '#fafafa' }}>{cover.name}</p>
                </div>
              )}
              <div className="hint-box">
                После публикации квест отправится на проверку модератору и появится в каталоге после одобрения.
              </div>
              <div className="form-footer">
                <button className="btn btn-outline" onClick={() => setStep(1)}>
                  Назад
                </button>
                <button className="btn btn-primary" onClick={publish} disabled={busy || !step0Ok || !step1Ok}>
                  {busy ? 'Отправляем…' : 'Опубликовать'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
