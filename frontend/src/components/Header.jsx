const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

export default function Header({ sidebarOpen, onToggleSidebar }) {
  return (
    <button
      onClick={onToggleSidebar}
      className={`fixed top-3 left-3 z-50 p-2 rounded-lg text-claude-muted hover:text-claude-text hover:bg-white/5 transition-all duration-300 ${
        sidebarOpen ? 'translate-x-64' : 'translate-x-0'
      }`}
      aria-label="Toggle sidebar"
    >
      <HamburgerIcon />
    </button>
  )
}
