const API_BASE = ''

export async function sendMessage(message, history = []) {
  const res = await fetch(`${API_BASE}/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/v1/stats`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
