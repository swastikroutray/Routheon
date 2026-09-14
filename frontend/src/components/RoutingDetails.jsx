export default function RoutingDetails({ metadata }) {
  const { tier, provider, model, latency_ms, tokens, verified } = metadata

  const rows = [
    ['Provider', provider],
    ['Model', model],
    ['Tier', tier],
    ['Latency', `${Math.round(latency_ms)}ms`],
    ['Tokens (prompt)', tokens?.prompt ?? '—'],
    ['Tokens (completion)', tokens?.completion ?? '—'],
    ['Verified', verified ? 'Yes' : 'Pending'],
  ]

  return (
    <div
      className="
        mt-2 p-3 rounded-lg
        border border-gray-200 dark:border-gray-700
        bg-white dark:bg-[#282a2c]
        text-xs
        animate-[fadeIn_0.2s_ease]
      "
    >
      <table className="w-full">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="py-0.5 pr-4 text-[#5f6368] dark:text-[#9aa0a6] font-medium">
                {label}
              </td>
              <td className="py-0.5 text-[#1f1f1f] dark:text-[#e3e3e3]">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
