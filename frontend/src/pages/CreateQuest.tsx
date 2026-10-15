import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ImagePlus, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import type { QuestPoint } from '../types'
import { useToast } from '../components/Toast'

const DIFFICULTIES = ['1 — лёгко', '2 — ниже среднего', '3 — средне', '4 — сложно', '5 — очень сложно']
const DISTRICTS = ['Нижегородский район', 'Советский район', 'Канавинский район', 'Автозаводский район', 'Сормовский район']

interface FormState {
  title: string
  description: string
  district: string
  difficulty: number
  cover: string
}

const emptyPoint = (): QuestPoint => ({ lat: 56.3269, lng: 44.0059, title: '', task: '', answer: '', hint: '' })

export function CreateQuest() {
  const nav = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    district: DISTRICTS[0],
    difficulty: 1,
    cover: '',
  })
  const [points, setPoints] = useState<QuestPoint[]>([emptyPoint()])

  const setF = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))
  const setPoint = (i: number, patch: Partial<QuestPoint>) =>
    setPoints((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))

  const canNext = form.title.trim().length > 2

  const publish = async () => {
    await api.createQuest({ ...form, points })
    toast('Квест отправлен на модерацию!')
    nav('/quests')
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
                  value={form.title}
                  onChange={(e) => setF({ title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea
                  className="field"
                  placeholder="Введите описание"
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => setF({ description: e.target.value })}
                />
                <div className="char-counter">{form.description.length}/500</div>
              </div>

              <div className="form-row form-group">
                <div>
                  <label className="form-label">Район / город</label>
                  <div className="select-wrap">
                    <select className="field" value={form.district} onChange={(e) => setF({ district: e.target.value })}>
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
                    <select
                      className="field"
                      value={form.difficulty}
                      onChange={(e) => setF({ difficulty: Number(e.target.value) })}
                    >
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

              <div className="form-group">
                <label className="form-label">Обложка</label>
                <label className={`dropzone ${form.cover ? 'has-file' : ''}`}>
                  <ImagePlus size={26} />
                  <div>
                    {form.cover ? (
                      <>Файл выбран: {form.cover}</>
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
                    onChange={(e) => setF({ cover: e.target.files?.[0]?.name || '' })}
                  />
                </label>
              </div>

              <div className="form-footer">
                <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(1)}>
                  Далее
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="form-title">Локации</h2>
              {points.map((p, i) => (
                <div className="point-item" key={i}>
                  <div className="point-item-head">
                    <span className="play-point-num">{i + 1}</span>
                    Точка {i + 1}
                    {points.length > 1 && (
                      <button className="icon-btn" onClick={() => setPoints((ps) => ps.filter((_, idx) => idx !== i))}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Название точки</label>
                      <input className="field" placeholder="Например, Кремль" value={p.title} onChange={(e) => setPoint(i, { title: e.target.value })} />
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
                    <input className="field" placeholder="Что нужно найти или сделать" value={p.task} onChange={(e) => setPoint(i, { task: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Ответ</label>
                      <input className="field" placeholder="Правильный ответ" value={p.answer} onChange={(e) => setPoint(i, { answer: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Подсказка</label>
                      <input className="field" placeholder="Необязательно" value={p.hint} onChange={(e) => setPoint(i, { hint: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn btn-outline" onClick={() => setPoints((ps) => [...ps, emptyPoint()])}>
                + Добавить точку
              </button>
              <div className="form-footer">
                <button className="btn btn-outline" onClick={() => setStep(0)}>
                  Назад
                </button>
                <button className="btn btn-primary" onClick={() => setStep(2)}>
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
                <p className="field" style={{ background: '#fafafa' }}>{form.title || '—'}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Описание</label>
                <p className="field" style={{ background: '#fafafa', whiteSpace: 'pre-wrap' }}>{form.description || '—'}</p>
              </div>
              <div className="form-row form-group">
                <div>
                  <label className="form-label">Район / город</label>
                  <p className="field" style={{ background: '#fafafa' }}>{form.district}</p>
                </div>
                <div>
                  <label className="form-label">Уровень сложности</label>
                  <p className="field" style={{ background: '#fafafa' }}>{DIFFICULTIES[form.difficulty - 1]}</p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Локации</label>
                <p className="field" style={{ background: '#fafafa' }}>
                  {points.length} точек: {points.map((p) => p.title || 'Без названия').join(', ')}
                </p>
              </div>
              <div className="hint-box">
                После публикации квест отправится на проверку модератору и появится в каталоге после одобрения.
              </div>
              <div className="form-footer">
                <button className="btn btn-outline" onClick={() => setStep(1)}>
                  Назад
                </button>
                <button className="btn btn-primary" onClick={publish}>
                  Опубликовать
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
