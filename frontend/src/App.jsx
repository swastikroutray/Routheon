import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ChatArea from './components/ChatArea'
import { sendMessage } from './api'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)
  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  // Force dark mode permanently (keeps any remaining dark: variants in Sidebar/ChatArea working)
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  // Get active conversation
  const activeConversation = conversations.find((c) => c.id === activeId)

  const createNewChat = useCallback(() => {
    const id = generateId()
    setConversations((prev) => [
      { id, title: 'New chat', messages: [] },
      ...prev,
    ])
    setActiveId(id)
  }, [])

  const handleSend = useCallback(
    async (text) => {
      if (!text.trim() || loading) return

      let convId = activeId
      // Auto-create conversation if none active
      if (!convId) {
        const id = generateId()
        setConversations((prev) => [
          { id, title: text.slice(0, 40), messages: [] },
          ...prev,
        ])
        convId = id
        setActiveId(id)
      }

      const userMsg = { role: 'user', content: text }
      // Placeholder for assistant response
      const assistantPlaceholder = {
        role: 'assistant',
        content: '',
        metadata: null,
        isStreaming: true,
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          return {
            ...c,
            title: c.messages.length === 0 ? text.slice(0, 40) : c.title,
            messages: [...c.messages, userMsg, assistantPlaceholder],
          }
        })
      )

      setLoading(true)

      try {
        // Build history from existing messages (exclude the placeholder)
        const conv = conversations.find((c) => c.id === convId)
        const history = (conv?.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const controller = new AbortController()
        abortRef.current = controller
        const data = await sendMessage(text, history, controller.signal)
        // Replace placeholder with real response
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            const msgs = [...c.messages]
            const lastIdx = msgs.length - 1
            if (msgs[lastIdx]?.isStreaming) {
              msgs[lastIdx] = {
                role: 'assistant',
                content: data.reply,
                isStreaming: true, // triggers typing animation
                metadata: {
                  tier: data.tier,
                  provider: data.provider,
                  model: data.model,
                  latency_ms: data.latency_ms,
                  tokens: data.tokens,
                  verified: data.verified,
                  request_id: data.request_id,
                },
              }
            }
            return { ...c, messages: msgs }
          })
        )
      } catch (err) {
        const aborted = err.name === 'AbortError'
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            const msgs = [...c.messages]
            const lastIdx = msgs.length - 1
            if (msgs[lastIdx]?.isStreaming || msgs[lastIdx]?.content === '') {
              msgs[lastIdx] = {
                role: 'assistant',
                content: aborted ? 'Response stopped.' : `Sorry, something went wrong: ${err.message}`,
                isStreaming: false,
                metadata: null,
              }
            }
            return { ...c, messages: msgs }
          })
        )
      } finally {
        abortRef.current = null
        setLoading(false)
      }
    },
    [activeId, conversations, loading]
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar overlay backdrop on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id)
          setSidebarOpen(false)
        }}
        onNewChat={createNewChat}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        />
        <ChatArea
            messages={activeConversation?.messages || []}
            onSend={handleSend}
            onStop={handleStop}
            onSuggestionClick={handleSend}
            loading={loading}
          />

      </main>
    </div>
  )
}
