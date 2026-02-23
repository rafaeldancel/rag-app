import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles } from 'lucide-react'
import { cn } from '@repo/ui/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatState = 'idle' | 'loading' | 'answered' | 'error'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

// ─── Static content ───────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'What does John 3:16 mean?',
  'Help me understand grace',
  'A prayer for when I feel anxious',
]

const MOCK_RESPONSE = `John 3:16 is often called the heart of the Gospel. It reveals three truths: God's nature (He loves), God's gift (His Son), and God's promise (eternal life for those who believe). The Greek word for "world" here is *kosmos* — not a select group, but all of humanity. It's an invitation, not a statement.`

// ─── Component ───────────────────────────────────────────────────────────────

interface AIModalProps {
  open: boolean
  onClose: () => void
  initialInput?: string
}

export function AIModal({ open, onClose, initialInput }: AIModalProps) {
  const [chatState, setChatState] = useState<ChatState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Reset when modal closes; seed input when it opens
  useEffect(() => {
    if (!open) {
      setChatState('idle')
      setMessages([])
      setInput('')
    } else {
      setInput(initialInput ?? '')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Keep scroll at bottom as messages grow
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatState])

  function handleSend() {
    const text = input.trim()
    if (!text || chatState === 'loading') return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setChatState('loading')

    // Simulate AI response — replace with real call later
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: MOCK_RESPONSE }])
      setChatState('answered')
    }, 1500)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-20 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-label="Logos AI assistant"
        className="absolute bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl bg-background"
        style={{ maxHeight: '85%' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Logos AI</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI assistant"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Message area */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 space-y-3">
          {/* ── Idle: empty state + suggested prompts ── */}
          {chatState === 'idle' && messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">How can I help you today?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ask anything about scripture, faith, or prayer.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-xl border bg-muted/50 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Message thread ── */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* ── Loading: typing indicator ── */}
          {chatState === 'loading' && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Error state ── */}
          {chatState === 'error' && (
            <p className="text-center text-xs text-destructive py-2">
              Something went wrong. Please try again.
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="flex items-end gap-2 border-t px-4 py-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about scripture, prayer…"
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatState === 'loading'}
            aria-label="Send message"
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
              input.trim() && chatState !== 'loading'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}
