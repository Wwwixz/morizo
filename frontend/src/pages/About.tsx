import { Compass, MapPin, Trophy } from 'lucide-react'
import { LogoMark } from '../components/Logo'

export function About() {
  return (
    <div className="container page">
      <div className="about-hero">
        <LogoMark size={56} />
        <h1 style={{ marginTop: 14 }}>О проекте MORIZO</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          Городские квесты для подростков — исследуй, решай, побеждай.
        </p>
      </div>

      <div className="about-grid">
        <div className="card about-card">
          <div className="icon-btn">
            <Compass size={22} />
          </div>
          <h3>Как это работает</h3>
          <p className="muted small" style={{ marginTop: 8 }}>
            Выбирай квест в каталоге или на карте, собирай команду и двигайся по маршруту. На каждой
            точке — задание: найди место, разгадай загадку, введи ответ.
          </p>
        </div>
        <div className="card about-card">
          <div className="icon-btn">
            <MapPin size={22} />
          </div>
          <h3>Где проводим</h3>
          <p className="muted small" style={{ marginTop: 8 }}>
            Квесты проходят на улицах Нижнего Новгорода: Кремль, Большая Покровская, Чкаловская
            лестница, Стрелка и другие знаковые места.
          </p>
        </div>
        <div className="card about-card">
          <div className="icon-btn">
            <Trophy size={22} />
          </div>
          <h3>Награды и рейтинг</h3>
          <p className="muted small" style={{ marginTop: 8 }}>
            За пройденные точки начисляются баллы и опыт. Поднимайся в рейтинге команд, получай
            достижения и реальные призы от партнёров.
          </p>
        </div>
      </div>
    </div>
  )
}
