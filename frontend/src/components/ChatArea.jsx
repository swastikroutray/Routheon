import { useState, useRef, useEffect } from 'react'

const SUGGESTIONS = [
  'Explain a complex concept simply',
  'Help me write some code',
  'Summarize a long document',
  'Brainstorm ideas for a project',
]

const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
)

const StopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
)

const Mark = ({ className = 'text-4xl' }) => (
  <span className={`${className} font-serif text-claude-accent leading-none select-none`}>✱</span>
)

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function fmt(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function TypewriterText({ text, streaming }) {
  const safeText = typeof text === 'string' ? text : fmt(text)
  const [shown, setShown] = useState(streaming ? '' : safeText)

  useEffect(() => {
    if (!streaming) {
      setShown(safeText)
      return
    }
    let i = 0
    const id = setInterval(() => {
      i += 3
      setShown(safeText.slice(0, i))
      if (i >= safeText.length) clearInterval(id)
    }, 15)
    return () => clearInterval(id)
  }, [safeText, streaming])

  const done = shown.length >= safeText.length
  return <span className={done ? '' : 'typing-cursor'}>{shown}</span>
}

function RoutingDetails({ metadata }) {
  const [open, setOpen] = useState(false)
  if (!metadata) return null
  return (
    <div className="mt-3 text-xs text-claude-muted">
      <button onClick={() => setOpen((o) => !o)} className="hover:text-claude-text transition-colors">
        {fmt(metadata.model)} · {fmt(metadata.latency_ms)}ms {open ? '▾' : '▸'}
      </button>
      <div className={`details-enter ${open ? 'details-enter-active' : ''}`}>
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg border border-claude-border bg-claude-surface p-3">
          <span>Tier</span><span className="text-claude-text">{fmt(metadata.tier)}</span>
          <span>Provider</span><span className="text-claude-text">{fmt(metadata.provider)}</span>
          <span>Tokens</span><span className="text-claude-text">{fmt(metadata.tokens)}</span>
          <span>Verified</span><span className="text-claude-text">{fmt(metadata.verified)}</span>
          <span>Request</span><span className="text-claude-text truncate">{fmt(metadata.request_id)}</span>
        </div>
      </div>
    </div>
  )
}

function Message({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-claude-surface px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
          {fmt(msg.content)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <div className="mt-1 shrink-0">
        <Mark className="text-lg" />
      </div>
      <div className="min-w-0 flex-1 text-[15px] leading-relaxed whitespace-pre-wrap">
        {!msg.content ? (
          <span className="inline-block w-2 h-2 rounded-full bg-claude-accent animate-pulse" />
        ) : (
          <TypewriterText text={msg.content} streaming={msg.isStreaming} />
        )}
        <RoutingDetails metadata={msg.metadata} />
      </div>
    </div>
  )
}

function Composer({ onSend, onStop, loading }) {
  const [value, setValue] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [value])

  const submit = (e) => {
    e?.preventDefault()
    if (loading) {
      onStop()
      return
    }
    if (!value.trim()) return
    onSend(value)
    setValue('')
  }

  return (
    <form
      onSubmit={submit}
      className="relative rounded-2xl border border-claude-border bg-claude-surface shadow-xl shadow-black/20 focus-within:border-claude-muted/50 transition-colors"
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !loading) submit(e)
        }}
        placeholder="How can I help you today?"
        className="w-full resize-none bg-transparent px-4 pt-4 pb-14 text-[15px] text-claude-text placeholder:text-claude-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={!loading && !value.trim()}
        className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-claude-accent hover:bg-claude-accentHover disabled:opacity-30 disabled:hover:bg-claude-accent flex items-center justify-center text-black transition-colors"
        aria-label={loading ? 'Stop' : 'Send'}
      >
        {loading ? <StopIcon /> : <ArrowUpIcon />}
      </button>
    </form>
  )
}

export default function ChatArea({ messages, onSend, onStop, onSuggestionClick, loading }) {
  const bottomRef = useRef(null)
  const empty = messages.length === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (empty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-center mb-10">
            <h1 className="font-serif text-4xl md:text-5xl text-claude-text tracking-tight">
              {greeting()}
            </h1>
          </div>
          <Composer onSend={onSend} onStop={onStop} loading={loading} />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestionClick(s)}
                className="px-3.5 py-2 rounded-xl border border-claude-border text-sm text-claude-muted hover:text-claude-text hover:bg-white/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 pt-16 pb-8 space-y-8">
          {messages.map((m, i) => (
            <Message key={i} msg={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="max-w-3xl mx-auto">
          <Composer onSend={onSend} onStop={onStop} loading={loading} />
          <p className="mt-2 text-center text-xs text-claude-muted/70">
            Routheon can make mistakes. Please double-check responses.
          </p>
        </div>
      </div>
    </div>
  )
}
