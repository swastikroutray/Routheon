import { useEffect, useRef } from 'react'
import EmptyState from './EmptyState'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'

export default function ChatArea({ messages, onSend, onSuggestionClick, loading }) {
  const scrollRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const hasMessages = messages.length > 0

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Scrollable message area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {!hasMessages ? (
            <EmptyState onSuggestionClick={onSuggestionClick} />
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="max-w-3xl mx-auto w-full px-4 pb-4">
        <InputBar onSend={onSend} disabled={loading} />
        <p className="text-[10px] text-center text-gray-400 dark:text-gray-600 mt-2">
          Responses are routed to the cheapest capable model. Routing details shown below each reply.
        </p>
      </div>
    </div>
  )
}
