import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, SquarePen, Clock, ChevronLeft, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@repo/ui/utils'
import { chatCallable, authReady } from '../../firebase'
import { Tooltip } from '../atoms/Tooltip'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatState = 'idle' | 'loading' | 'answered' | 'error'

interface SourceRef {
  sourceNo: number
  fullTitle?: string
  authorFormatted?: string
  year?: string
  publisher?: string
  url?: string
  apa?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources?: SourceRef[]
}

interface Conversation {
  id: string
  createdAt: number
  title: string
  messages: Message[]
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

// ─── Tag badge renderer ────────────────────────────────────────────────────────
// Turns [Out of Scope] and [General Knowledge] tokens into styled visual badges.

const TAG_RE = /(\[Out of Scope\])/g

/** Renders the [Out of Scope] guardrail tag as a styled visual badge. */
function OutOfScopeBadge() {
  return (
    <div className="my-2 flex items-center gap-1.5 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-destructive">
      <span aria-hidden="true">⚠</span>
      <span>Out of Scope</span>
    </div>
  )
}

/** Renders assistant message text, replacing [Out of Scope] with a styled badge. */
function MessageText({ text }: { text: string }) {
  const parts = text.split(TAG_RE)
  return (
    <>
      {parts.map((part, i) => {
        if (part === '[Out of Scope]') return <OutOfScopeBadge key={i} />
        const trimmed = part.trim()
        if (!trimmed) return null
        return (
          <ReactMarkdown key={i} components={MD}>
            {trimmed}
          </ReactMarkdown>
        )
      })}
    </>
  )
}

// ─── Sources footer ───────────────────────────────────────────────────────────

function SourcesFooter({ sources }: { sources: SourceRef[] }) {
  const [open, setOpen] = useState(false)
  if (sources.length === 0) return null

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>
          {sources.length} {sources.length === 1 ? 'source' : 'sources'}
        </span>
      </button>

      {open && (
        <ol className="mt-2 space-y-2 border-l-2 border-muted pl-3">
          {sources.map(s => (
            <li key={s.sourceNo} className="text-xs leading-snug text-muted-foreground">
              {s.apa ? (
                <>
                  <span className="italic">{s.fullTitle}</span>
                  {'. '}
                  {s.authorFormatted} ({s.year}). {s.publisher}.
                </>
              ) : (
                <span className="italic">
                  {s.fullTitle ?? s.authorFormatted ?? 'Unknown source'}
                </span>
              )}
              {s.url && (
                <>
                  {' '}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary underline-offset-2 hover:underline"
                  >
                    Read ↗
                  </a>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'What does John 3:16 mean?',
  'Help me understand grace',
  'A prayer for when I feel anxious',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - ts
  const dayMs = 86_400_000
  if (diffMs < dayMs && now.getDate() === date.getDate()) return 'Today'
  if (diffMs < 2 * dayMs) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const MAX_HISTORY = 20

// ─── Component ────────────────────────────────────────────────────────────────

interface AIModalProps {
  open: boolean
  onClose: () => void
  initialInput?: string
}

export function AIModal({ open, onClose, initialInput }: AIModalProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem('ai.messages')
      return saved ? (JSON.parse(saved) as Message[]) : []
    } catch {
      return []
    }
  })
  const [chatState, setChatState] = useState<ChatState>(() => {
    try {
      const saved = sessionStorage.getItem('ai.messages')
      const msgs = saved ? JSON.parse(saved) : []
      return msgs.length > 0 ? 'answered' : 'idle'
    } catch {
      return 'idle'
    }
  })
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('ai.history')
      return saved ? (JSON.parse(saved) as Conversation[]) : []
    } catch {
      return []
    }
  })
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Persist current messages across page suspensions (sleep/wake)
  useEffect(() => {
    sessionStorage.setItem('ai.messages', JSON.stringify(messages))
  }, [messages])

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem('ai.history', JSON.stringify(conversations))
  }, [conversations])

  // Seed input and focus when opening
  useEffect(() => {
    if (!open) return
    const seed = initialInput ?? ''
    setInput(seed)
    setTimeout(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      autoResize(el)
    }, 100)
  }, [open, initialInput])

  // Scroll to latest message (also on reopen)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatState, open])

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  // Save current conversation to history (if it has messages)
  function saveCurrentToHistory(currentMessages: Message[]) {
    if (currentMessages.length === 0) return
    const title = currentMessages.find(m => m.role === 'user')?.text.slice(0, 60) ?? 'Conversation'
    const entry: Conversation = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      title,
      messages: currentMessages,
    }
    setConversations(prev => [entry, ...prev].slice(0, MAX_HISTORY))
  }

  function startNewChat() {
    saveCurrentToHistory(messages)
    setMessages([])
    setChatState('idle')
    setInput('')
    setView('chat')
  }

  function restoreConversation(conv: Conversation) {
    saveCurrentToHistory(messages)
    setMessages(conv.messages)
    setChatState('answered')
    setConversations(prev => prev.filter(c => c.id !== conv.id))
    setView('chat')
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || chatState === 'loading') return

    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text }])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setChatState('loading')

    try {
      await authReady
      const resp = await chatCallable({ question: text, profile: 'bible-study' })
      const data = resp.data as { answer?: string; sources?: SourceRef[] }
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: data.answer ?? '(no response)',
          sources: data.sources,
        },
      ])
      setChatState('answered')
    } catch (e) {
      console.error('Chat error:', e)
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Something went wrong. Please try again.',
        },
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
      {/* Invisible overlay for click-outside dismiss */}
      <div className="absolute inset-0 z-20" onClick={onClose} aria-hidden="true" />

      {/* Floating chat panel */}
      <div
        role="dialog"
        aria-label="Logos AI assistant"
        className="absolute inset-x-3 bottom-[112px] z-30 flex flex-col rounded-2xl border bg-background shadow-2xl"
        style={{ maxHeight: 'calc(68vh - 100px)' }}
      >
        {view === 'history' ? (
          // ── History panel ──────────────────────────────────────────────────
          <>
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <button
                onClick={() => setView('chat')}
                aria-label="Back to chat"
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">History</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-6">
                  <Clock className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No past conversations yet.</p>
                  <p className="text-xs text-muted-foreground/70">
                    Start a new chat and it will appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {conversations.map(conv => (
                    <li key={conv.id} className="group flex items-stretch">
                      <button
                        onClick={() => restoreConversation(conv)}
                        className="min-w-0 flex-1 px-4 py-3 text-left transition-colors hover:bg-muted/60 flex flex-col gap-0.5"
                      >
                        <span className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                          {conv.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conv.createdAt)} · {(conv.messages.length / 2) | 0}{' '}
                          {conv.messages.length / 2 === 1 ? 'exchange' : 'exchanges'}
                        </span>
                      </button>
                      <button
                        onClick={() => setConversations(prev => prev.filter(c => c.id !== conv.id))}
                        aria-label="Delete conversation"
                        className="flex w-10 shrink-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive text-muted-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          // ── Chat panel ─────────────────────────────────────────────────────
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Logos AI</span>
              </div>
              <div className="flex items-center gap-1">
                {/* History button */}
                <Tooltip label="History" side="bottom">
                  <button
                    onClick={() => setView('history')}
                    aria-label="Chat history"
                    className="relative flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {conversations.length > 0 && (
                      <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                </Tooltip>
                {/* New chat button — only visible when there are messages */}
                {messages.length > 0 && (
                  <Tooltip label="New chat" side="bottom">
                    <button
                      onClick={startNewChat}
                      aria-label="New chat"
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
                    >
                      <SquarePen className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </Tooltip>
                )}
                {/* Close */}
                <Tooltip label="Close" side="bottom">
                  <button
                    onClick={onClose}
                    aria-label="Close AI assistant"
                    className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Message area */}
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none px-4 pb-2 space-y-3">
              {/* Empty state + suggested prompts */}
              {chatState === 'idle' && messages.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      How can I help you today?
                    </p>
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
                  key={msg.id ?? i}
                  className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[88%] flex flex-col">
                      <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-foreground">
                        <MessageText text={msg.text} />
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <SourcesFooter sources={msg.sources} />
                      )}
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
                className="flex-1 resize-none overflow-y-auto scrollbar-none rounded-xl border bg-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
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
          </>
        )}
      </div>
    </>
  )
}
