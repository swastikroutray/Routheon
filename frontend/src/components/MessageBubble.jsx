import { useState, useEffect, useRef } from 'react'
import RoutingDetails from './RoutingDetails'

const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
    <path
      d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
      fill="url(#sparkle-gradient)"
    />
    <defs>
      <linearGradient id="sparkle-gradient" x1="3" y1="2" x2="21" y2="22">
        <stop stopColor="#4285f4" />
        <stop offset="1" stopColor="#a855f7" />
      </linearGradient>
    </defs>
  </svg>
)

export default function MessageBubble({ message }) {
  const { role, content, metadata, isStreaming } = message
  const [displayedText, setDisplayedText] = useState('')
  const [streamDone, setStreamDone] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const indexRef = useRef(0)

  // Streaming/typing effect
  useEffect(() => {
    if (role !== 'assistant' || !content) {
      setDisplayedText(content || '')
      setStreamDone(true)
      return
    }

    if (!isStreaming) {
      setDisplayedText(content)
      setStreamDone(true)
      return
    }

    // Reset for new content
    indexRef.current = 0
    setDisplayedText('')
    setStreamDone(false)

    const timer = setInterval(() => {
      indexRef.current += 1
      // Speed up as we go: reveal more chars per tick
      const charsPerTick = Math.min(3, 1 + Math.floor(indexRef.current / 50))
      const nextIdx = Math.min(indexRef.current * charsPerTick, content.length)

      setDisplayedText(content.slice(0, nextIdx))

      if (nextIdx >= content.length) {
        clearInterval(timer)
        setStreamDone(true)
      }
    }, 15)

    return () => clearInterval(timer)
  }, [content, role, isStreaming])

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-[#e8eaed] dark:bg-[#3c4043] text-sm leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="flex gap-2">
          <SparkleIcon />
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {displayedText}
            {!streamDone && <span className="typing-cursor" />}
          </div>
        </div>

        {/* Routing badge */}
        {metadata && streamDone && (
          <div className="ml-7 mt-2">
            <button
              onClick={() => setShowDetails((d) => !d)}
              className="
                inline-flex items-center gap-1 px-2 py-0.5
                text-[11px] text-[#5f6368] dark:text-[#9aa0a6]
                bg-gray-100 dark:bg-[#282a2c]
                rounded-full
                hover:bg-gray-200 dark:hover:bg-[#3c4043]
                transition-colors duration-150
              "
            >
              <span>Tier {metadata.tier}</span>
              <span className="opacity-40">·</span>
              <span>{metadata.model}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showDetails && <RoutingDetails metadata={metadata} />}
          </div>
        )}
      </div>
    </div>
  )
}
