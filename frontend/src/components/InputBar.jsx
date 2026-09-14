import { useState, useRef, useCallback, useEffect } from 'react'

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 150) + 'px'
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [text, adjustHeight])

  const handleSubmit = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className={`
        relative flex items-end
        rounded-3xl
        border border-gray-200 dark:border-gray-700
        bg-[#f0f4f9] dark:bg-[#282a2c]
        shadow-sm
        transition-all duration-200
        focus-within:border-blue-400 dark:focus-within:border-blue-500
        focus-within:shadow-md
        ${disabled ? 'opacity-60' : ''}
      `}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Enter a prompt here"
        rows={1}
        className="
          flex-1 resize-none
          bg-transparent
          px-5 py-3.5 pr-12
          text-sm leading-relaxed
          placeholder:text-[#5f6368] dark:placeholder:text-[#9aa0a6]
          focus:outline-none
        "
      />

      <button
        onClick={handleSubmit}
        disabled={!text.trim() || disabled}
        className={`
          absolute right-2 bottom-2
          p-2 rounded-full
          transition-all duration-200
          ${
            text.trim() && !disabled
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
          }
        `}
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </div>
  )
}
