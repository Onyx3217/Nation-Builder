import { supabase, hasSupabase } from './supabaseClient'

/**
 * SQL Schema for Supabase (can be executed in Supabase SQL Editor):
 * 
 * CREATE TABLE IF NOT EXISTS saved_games (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   nation_name TEXT NOT NULL,
 *   nation_flag TEXT DEFAULT '🏳️',
 *   turn INT DEFAULT 0,
 *   game_data JSONB NOT NULL
 * );
 */

export function buildCloudSavePayload(country, worldState) {
  const day = Math.max(1, Math.round(Number(worldState.day ?? worldState.turn) || 1))
  const gameData = {
    schemaVersion: 2,
    country,
    worldCountries: worldState.worldCountries || [],
    relations: worldState.relations || {},
    newsFeed: (worldState.newsFeed || []).slice(0, 80),
    day,
    dailyDirectivesRemaining: worldState.dailyDirectivesRemaining,
    dailyEventInjectionsRemaining: worldState.dailyEventInjectionsRemaining,
    cabinetHistory: (worldState.cabinetHistory || []).slice(-100),
    incomingDiplomacy: (worldState.incomingDiplomacy || []).slice(-20),
    diplomaticHistory: Object.fromEntries(
      Object.entries(worldState.diplomaticHistory || {}).map(([id, messages]) => [id, (messages || []).slice(-80)])
    ),
    worldEvents: (worldState.worldEvents || []).slice(0, 40),
    activeResolutions: (worldState.activeResolutions || []).slice(-20),
    projects: (worldState.projects || []).slice(0, 30),
    worldMode: worldState.worldMode || 'real',
    difficultyMode: worldState.difficultyMode || 'normal',
    language: worldState.language || 'fr',
    music: {
      enabled: Boolean(worldState.musicEnabled),
      volume: Math.max(0, Math.min(1, Number(worldState.musicVolume) || 0)),
      position: Math.max(0, Number(worldState.musicPosition) || 0),
    },
    savedAt: new Date().toISOString(),
  }
  const payloadBytes = new TextEncoder().encode(JSON.stringify(gameData)).length

  return {
    nation_name: country.name || 'Unnamed Nation',
    nation_flag: country.flag || '🌐',
    turn: day,
    game_data: gameData,
    updated_at: new Date().toISOString(),
    payloadBytes,
  }
}

export function estimateCloudSaveBytes(country, worldState) {
  return buildCloudSavePayload(country, worldState).payloadBytes
}

/**
 * Save current game state to Supabase
 */
export async function saveGameToCloud(country, worldState) {
  if (!hasSupabase) {
    throw new Error('Supabase is not configured. Check your .env file.')
  }

  const payload = buildCloudSavePayload(country, worldState)
  const { payloadBytes, ...row } = payload

  const { data, error } = await supabase
    .from('saved_games')
    .insert([row])
    .select()

  if (error) {
    console.error('Supabase save error:', error)
    throw new Error(error.message || 'Failed to save to Supabase.')
  }

  return { ...data?.[0], payloadBytes }
}

/**
 * Fetch all cloud saves
 */
export async function getCloudSaves() {
  if (!hasSupabase) return []

  const { data, error } = await supabase
    .from('saved_games')
    .select('id, created_at, updated_at, nation_name, nation_flag, turn')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Supabase fetch error:', error)
    throw new Error(error.message)
  }

  return data || []
}

/**
 * Load a specific game state by save ID
 */
export async function loadGameFromCloud(saveId) {
  if (!hasSupabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('saved_games')
    .select('*')
    .eq('id', saveId)
    .single()

  if (error) {
    console.error('Supabase load error:', error)
    throw new Error(error.message)
  }

  return data?.game_data
}

/**
 * Delete a cloud save
 */
export async function deleteCloudSave(saveId) {
  if (!hasSupabase) return false

  const { error } = await supabase
    .from('saved_games')
    .delete()
    .eq('id', saveId)

  if (error) {
    console.error('Supabase delete error:', error)
    throw new Error(error.message)
  }

  return true
}
