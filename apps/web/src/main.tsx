import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryProvider } from './providers/QueryProvider'
import { App } from './App'
import './style.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>
)
