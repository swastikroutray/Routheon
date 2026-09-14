const HamburgerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

export default function Header({ sidebarOpen, onToggleSidebar }) {
  return (
    <button
      onClick={onToggleSidebar}
      className={`fixed top-3 left-3 z-50 p-1.5 rounded-lg text-[#9aa0a6] hover:bg-white/10 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-64' : 'translate-x-0'
      }`}
      aria-label="Toggle sidebar"
    >
      <HamburgerIcon />
    </button>
  )
}
