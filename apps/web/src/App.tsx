import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { BottomNav } from './components/layout/BottomNav'
import { TodayPage } from './pages/TodayPage'
import { BiblePage } from './pages/BiblePage'
import { DiaryPage } from './pages/DiaryPage'
import { ProfilePage } from './pages/ProfilePage'
import './style.css'

function BibleRedirect() {
  try {
    const saved = localStorage.getItem('bible.lastPosition')
    if (saved) {
      const { book, chapter, version } = JSON.parse(saved)
      const query = version && version !== 'NIV' ? `?v=${version}` : ''
      return <Navigate to={`/bible/${book}/${chapter}${query}`} replace />
    }
  } catch {
    // corrupted storage — fall through to default
  }
  return <Navigate to="/bible/JHN/3" replace />
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route index element={<TodayPage />} />
          <Route path="/bible/:book/:chapter" element={<BiblePage />} />
          <Route path="/bible" element={<BibleRedirect />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <BottomNav />
      </AppShell>
    </BrowserRouter>
  )
}
