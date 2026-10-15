import { Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { BottomNav } from './components/BottomNav'
import { Home } from './pages/Home'
import { Catalog } from './pages/Catalog'
import { QuestDetails } from './pages/QuestDetails'
import { PlayQuest } from './pages/PlayQuest'
import { CreateQuest } from './pages/CreateQuest'
import { Teams } from './pages/Teams'
import { Leaderboard } from './pages/Leaderboard'
import { Profile } from './pages/Profile'
import { Moderation } from './pages/Moderation'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { About } from './pages/About'

export default function App() {
  const { pathname } = useLocation()
  const isPlay = pathname.includes('/play')
  const isAuth = pathname === '/login' || pathname === '/register'

  if (isPlay) {
    return (
      <Routes>
        <Route path="/quests/:id/play" element={<PlayQuest />} />
      </Routes>
    )
  }

  return (
    <>
      {!isAuth && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quests" element={<Catalog />} />
        <Route path="/quests/map" element={<Catalog onlyMap />} />
        <Route path="/quests/:id" element={<QuestDetails />} />
        <Route path="/quests/:id/play" element={<PlayQuest />} />
        <Route path="/create" element={<CreateQuest />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/moderation" element={<Moderation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Home />} />
      </Routes>
      {!isAuth && <Footer />}
      {!isAuth && <BottomNav />}
    </>
  )
}
