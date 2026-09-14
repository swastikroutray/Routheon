import { useEffect, useState } from 'react'
import StatsWidget from './StatsWidget'

/* inline SVGs */
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="10" y1="4" x2="10" y2="16" />
    <line x1="4" y1="10" x2="16" y2="10" />
  </svg>
)

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
)

export default function Sidebar({ open, conversations, activeId, onSelect, onNewChat }) {
  return (
    <aside
      className={`
        fixed md:relative z-30 h-full
        w-[280px] bg-[#f0f4f9] dark:bg-[#171717]
        border-r border-gray-200 dark:border-gray-800
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'}
      `}
    >
      {/* New Chat button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="
            w-full flex items-center gap-2 px-4 py-2.5
            rounded-full
            bg-gradient-to-r from-blue-500 to-purple-500
            text-white font-medium text-sm
            hover:shadow-lg hover:shadow-blue-500/25
            transition-all duration-200
          "
        >
          <PlusIcon />
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {conversations.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
            No conversations yet
          </p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`
              w-full text-left px-3 py-2.5 rounded-lg mb-0.5
              flex items-center gap-2
              text-sm truncate
              transition-colors duration-150
              ${
                conv.id === activeId
                  ? 'bg-white dark:bg-[#282a2c] text-[#1f1f1f] dark:text-white font-medium'
                  : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-white/60 dark:hover:bg-white/5'
              }
            `}
          >
            <span className="shrink-0 opacity-50"><ChatIcon /></span>
            <span className="truncate">{conv.title || 'New chat'}</span>
          </button>
        ))}
      </div>

      {/* Stats widget */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <StatsWidget />
      </div>
    </aside>
  )
}
