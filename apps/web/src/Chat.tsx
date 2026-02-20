import React, { useState } from 'react'
import { chatCallable, authReady } from './firebase'

type Msg = { role: 'user' | 'assistant'; text: string }

export function Chat() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setMessages(m => [...m, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    try {
      await authReady
      const resp = await chatCallable({ question: q })
      const data = resp.data as { answer?: string }
      setMessages(m => [...m, { role: 'assistant', text: data.answer ?? '(no response)' }])
    } catch (e: unknown) {
      setMessages(m => [
        ...m,
        { role: 'assistant', text: `Error: ${e instanceof Error ? e.message : 'Unknown error'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 16 }}>
      <h2>RAG Chat</h2>
      <div style={{ border: '1px solid #ddd', padding: 12, minHeight: 360 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '10px 0' }}>
            <b>{m.role === 'user' ? 'You' : 'Bot'}:</b> {m.text}
          </div>
        ))}
        {loading && (
          <div>
            <b>Bot:</b> Thinking...
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          style={{ flex: 1, padding: 10 }}
          placeholder="Ask a question…"
        />
        <button onClick={send} style={{ padding: '10px 14px' }} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  )
}
