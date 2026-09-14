const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export default function Sidebar({ open, conversations, activeId, onSelect, onNewChat }) {
  return (
    <aside
        className={`shrink-0 h-full flex flex-col bg-claude-sidebar border-r border-claude-border overflow-hidden transition-all duration-300 ${
          open ? 'w-64' : 'w-0'
        }`}
      >
      <div className="px-3 pt-14 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-claude-text hover:bg-white/5 transition-colors"
        >
          <span className="w-6 h-6 rounded-full bg-claude-accent text-black flex items-center justify-center">
            <PlusIcon />
          </span>
          New chat
        </button>
      </div>

      <div className="px-5 pt-4 pb-1 text-xs font-medium text-claude-muted">Recents</div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {conversations.length === 0 && (
          <p className="px-3 py-2 text-sm text-claude-muted/70">No conversations yet</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left truncate px-3 py-2 rounded-lg text-sm transition-colors ${
              c.id === activeId
                ? 'bg-white/10 text-claude-text'
                : 'text-claude-muted hover:bg-white/5 hover:text-claude-text'
            }`}
          >
            {c.title}
          </button>
        ))}
      </nav>
    </aside>
  )
}
