import { Chat } from './Chat'
import './style.css'

export function App() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">RAG App</h1>
        <Chat />
      </div>
    </div>
  )
}
