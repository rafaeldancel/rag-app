import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { BottomNav } from './components/layout/BottomNav'
import { TodayPage } from './pages/TodayPage'
import { BiblePage } from './pages/BiblePage'
import { DiaryPage } from './pages/DiaryPage'
import { ProfilePage } from './pages/ProfilePage'
import './style.css'

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route index element={<TodayPage />} />
          <Route path="/bible/:book/:chapter" element={<BiblePage />} />
          <Route path="/bible" element={<Navigate to="/bible/JHN/3" replace />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <BottomNav />
      </AppShell>
    </BrowserRouter>
  )
}
