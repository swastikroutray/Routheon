import { useState, useEffect } from 'react'
import { getStats } from '../api'

export default function StatsWidget() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(false)

  const fetchStats = async () => {
    try {
      const data = await getStats()
      setStats(data)
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (error || !stats) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-600 text-center py-2">
        {error ? 'Stats unavailable' : 'Loading stats...'}
      </div>
    )
  }

  const { total_requests, tier1_pct, avg_latency_per_tier } = stats

  // Calculate overall avg latency
  const latencies = Object.values(avg_latency_per_tier || {})
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0

  return (
    <div className="rounded-xl bg-white dark:bg-[#282a2c] p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[#5f6368] dark:text-[#9aa0a6]">Cost saved</span>
        <span className="font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          {tier1_pct || 0}%
        </span>
      </div>
      <div className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">
        {tier1_pct > 0
          ? `${tier1_pct}% of requests used the cheapest tier`
          : 'Send some messages to see routing stats'}
      </div>
      <div className="flex items-center justify-between text-[10px] text-[#5f6368] dark:text-[#9aa0a6] pt-1 border-t border-gray-100 dark:border-gray-700">
        <span>{total_requests} total requests</span>
        <span>{avgLatency}ms avg</span>
      </div>
    </div>
  )
}
