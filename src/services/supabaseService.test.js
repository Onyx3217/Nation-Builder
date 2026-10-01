import { describe, expect, it } from 'vitest'
import { buildCloudSavePayload } from './supabaseService'

describe('buildCloudSavePayload', () => {
  it('keeps the same save key when updating the same game', () => {
    const country = { name: 'France', flag: '🇫🇷' }
    const firstSave = buildCloudSavePayload(country, { gameId: 'game-same-run', day: 12 })
    const updatedSave = buildCloudSavePayload(country, { gameId: 'game-same-run', day: 13 })

    expect(updatedSave.save_key).toBe(firstSave.save_key)
    expect(updatedSave.game_data.gameId).toBe(firstSave.game_data.gameId)
    expect(updatedSave.turn).toBe(13)
  })

  it('uses a different save key for a new game', () => {
    const country = { name: 'France', flag: '🇫🇷' }
    const firstSave = buildCloudSavePayload(country, { gameId: 'game-first', day: 1 })
    const nextGame = buildCloudSavePayload(country, { gameId: 'game-second', day: 1 })

    expect(nextGame.save_key).not.toBe(firstSave.save_key)
  })
})
