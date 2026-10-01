const ALLOWED_MODELS = new Set([
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'qwen/qwen3-8b',
])
const requestsByIp = new Map()

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: { message: 'Method not allowed.' } })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return response.status(503).json({ error: { message: 'AI is not configured on the server.' } })
  }

  const clientIp = request.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const recentRequests = (requestsByIp.get(clientIp) || []).filter((timestamp) => now - timestamp < 60000)
  if (recentRequests.length >= 30) {
    response.setHeader('Retry-After', '60')
    return response.status(429).json({ error: { message: 'Too many AI requests. Try again shortly.' } })
  }
  recentRequests.push(now)
  requestsByIp.set(clientIp, recentRequests)

  let body
  try {
    body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body
  } catch {
    return response.status(400).json({ error: { message: 'Invalid JSON request.' } })
  }
  const messages = body?.messages
  const totalTextLength = Array.isArray(messages)
    ? messages.reduce((total, message) => total + (typeof message.content === 'string' ? message.content.length : 0), 0)
    : 0

  if (
    !Array.isArray(messages)
    || messages.length < 1
    || messages.length > 40
    || totalTextLength > 40000
    || messages.some((message) => !['system', 'user', 'assistant'].includes(message?.role) || typeof message.content !== 'string')
    || !ALLOWED_MODELS.has(body.model)
  ) {
    return response.status(400).json({ error: { message: 'Invalid AI request.' } })
  }

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: body.model,
        messages,
        temperature: Math.max(0, Math.min(2, Number(body.temperature) || 0)),
        max_tokens: Math.max(1, Math.min(5000, Math.round(Number(body.max_tokens) || 1000))),
      }),
    })
    const text = await upstream.text()
    response.status(upstream.status).setHeader('Content-Type', 'application/json').send(text)
  } catch {
    response.status(502).json({ error: { message: 'AI service is temporarily unavailable.' } })
  }
}