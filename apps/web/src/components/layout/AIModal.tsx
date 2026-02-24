import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@repo/ui/utils'
import { chatCallable, authReady } from '../../firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatState = 'idle' | 'loading' | 'answered' | 'error'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

const MD: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h1 className="mb-1 text-base font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-1 text-sm font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary/50 pl-3 italic text-sm text-foreground/80">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-black/10 p-3 text-xs font-mono dark:bg-white/10">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded bg-black/10 px-1 py-0.5 text-xs font-mono dark:bg-white/10">
      {children}
    </code>
  ),
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'What does John 3:16 mean?',
  'Help me understand grace',
  'A prayer for when I feel anxious',
]

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Reset on close; seed input and focus on open
  useEffect(() => {
    if (!open) {
      setChatState('idle')
      setMessages([])
      setInput('')
    } else {
      const seed = initialInput ?? ''
      setInput(seed)
      setTimeout(() => {
        const el = inputRef.current
        if (!el) return
        el.focus()
        autoResize(el)
      }, 100)
    }
  }, [open, initialInput])

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatState])

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || chatState === 'loading') return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setChatState('loading')

    try {
      await authReady
      const resp = await chatCallable({ question: text, profile: 'bible-study' })
      const data = resp.data as { answer?: string }
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer ?? '(no response)' }])
      setChatState('answered')
    } catch (e) {
      console.error('Chat error:', e)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Something went wrong. Please try again.' },
      ])
      setChatState('error')
    }
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
      {/* Light tint — chathead style keeps content visible behind */}
      <div className="absolute inset-0 z-20 bg-black/20" onClick={onClose} aria-hidden="true" />

      {/* Chat panel sits above BottomNav so the trigger button stays visible */}
      <div
        role="dialog"
        aria-label="Logos AI assistant"
        className="absolute inset-x-0 bottom-[72px] z-30 flex flex-col rounded-t-2xl border-t bg-background shadow-[0_-6px_32px_rgba(0,0,0,0.14)]"
        style={{ maxHeight: 'calc(85vh - 72px)' }}
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
          {/* Empty state + suggested prompts */}
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
                    onClick={() => {
                      setInput(prompt)
                      setTimeout(() => {
                        const el = inputRef.current
                        if (el) {
                          el.focus()
                          autoResize(el)
                        }
                      }, 0)
                    }}
                    className="rounded-xl border bg-muted/50 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message thread */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-foreground">
                  <ReactMarkdown components={MD}>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
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

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="flex items-end gap-2 border-t px-4 py-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              autoResize(e.target)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about scripture, prayer…"
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-xl border bg-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
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
