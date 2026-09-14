const API_BASE = ''

export async function sendMessage(text, history, signal) {
  const res = await fetch(`${API_BASE}/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, history }),
    signal,
  })

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }

  return res.json()
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/v1/stats`)

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }

  return res.json()
}