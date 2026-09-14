const LightningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const suggestions = [
  { text: 'What is quantum computing?', icon: '🔬' },
  { text: 'Compare Python and Rust', icon: '⚖️' },
  { text: 'Write a short poem about the ocean', icon: '🌊' },
  { text: 'Explain microservices architecture step by step', icon: '🏗️' },
]

export default function EmptyState({ onSuggestionClick }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Greeting */}
      <h2 className="text-3xl md:text-4xl font-medium mb-2">
        <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Hello, how can I help you today?
        </span>
      </h2>
      <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm mb-10">
        Your prompts are automatically routed to the most cost-effective model.
      </p>

      {/* Suggestion chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((s) => (
          <button
            key={s.text}
            onClick={() => onSuggestionClick(s.text)}
            className="
              flex items-start gap-3 p-4
              rounded-xl border border-gray-200 dark:border-gray-700
              bg-white dark:bg-[#282a2c]
              hover:border-blue-300 dark:hover:border-blue-600
              hover:shadow-sm
              text-left text-sm text-[#1f1f1f] dark:text-[#e3e3e3]
              transition-all duration-200
            "
          >
            <span className="text-lg mt-0.5">{s.icon}</span>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
