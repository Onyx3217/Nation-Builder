import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './groq'

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value
      return this
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
    send(body) {
      this.body = body
      return this
    },
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Groq server endpoint', () => {
  it('does not call Groq when the server secret is missing', async () => {
    vi.stubEnv('GROQ_API_KEY', '')
    const response = createResponse()

    await handler({ method: 'POST', headers: {}, body: {} }, response)

    expect(response.statusCode).toBe(503)
    expect(response.body.error.message).toContain('not configured')
  })

  it('rejects malformed JSON before contacting Groq', async () => {
    vi.stubEnv('GROQ_API_KEY', 'server-only-test-key')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = createResponse()

    await handler({ method: 'POST', headers: { 'x-forwarded-for': 'test-malformed' }, body: '{' }, response)

    expect(response.statusCode).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps the secret on the server when forwarding a valid request', async () => {
    vi.stubEnv('GROQ_API_KEY', 'server-only-test-key')
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({ choices: [{ message: { content: 'OK' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const response = createResponse()

    await handler({
      method: 'POST',
      headers: { 'x-forwarded-for': 'test-valid' },
      body: {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
      },
    }, response)

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer server-only-test-key')
    expect(response.body).not.toContain('server-only-test-key')
    expect(response.statusCode).toBe(200)
  })
})
