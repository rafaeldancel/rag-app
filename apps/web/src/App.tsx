import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { BottomNav } from './components/layout/BottomNav'
import { AIModal } from './components/layout/AIModal'
import { AIModalContext } from './lib/AIModalContext'
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
  const [aiOpen, setAiOpen] = useState(() => sessionStorage.getItem('ai.open') === 'true')
  const [aiPrefill, setAiPrefill] = useState('')

  useEffect(() => {
    sessionStorage.setItem('ai.open', String(aiOpen))
  }, [aiOpen])

  function openAI(prefill = '') {
    setAiPrefill(prefill)
    setAiOpen(true)
  }

  return (
    <AIModalContext.Provider value={{ openAI }}>
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

          <AIModal
            open={aiOpen}
            onClose={() => {
              setAiOpen(false)
              setAiPrefill('')
            }}
            initialInput={aiPrefill}
          />
          <BottomNav
            aiOpen={aiOpen}
            onAIPress={() => {
              if (aiOpen) {
                setAiOpen(false)
                setAiPrefill('')
              } else {
                openAI()
              }
            }}
          />
        </AppShell>
      </BrowserRouter>
    </AIModalContext.Provider>
  )
}
