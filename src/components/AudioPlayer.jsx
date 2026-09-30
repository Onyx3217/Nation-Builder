import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

const AUDIO_TRACKS = {
  theme: '/audio/theme.mp3',
}

/**
 * AudioPlayer — Global ambient music controller.
 * Renders nothing visually; manages the HTML Audio element reactively.
 * Place once at the App root.
 */
export default function AudioPlayer() {
  const musicEnabled = useGameStore((s) => s.musicEnabled)
  const musicVolume = useGameStore((s) => s.musicVolume)
  const musicPosition = useGameStore((s) => s.musicPosition)
  const audioRef = useRef(null)

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(AUDIO_TRACKS.theme)
    audio.loop = true
    audio.preload = 'metadata'
    audio.volume = musicVolume
    audioRef.current = audio

    const setPlaying = useGameStore.getState().setMusicPlaying
    const setError = useGameStore.getState().setMusicError
    const setMusicPosition = useGameStore.getState().setMusicPosition
    const savedPosition = useGameStore.getState().musicPosition || 0
    let trackCheckComplete = false
    let trackAvailable = false
    let lastStoredPosition = savedPosition
    const missingTrackMessage = () => useGameStore.getState().language === 'en'
      ? 'Music unavailable: /audio/theme.mp3 is missing or unreadable.'
      : 'Musique indisponible : le fichier /audio/theme.mp3 est absent ou illisible.'
    const handlePlaying = () => {
      if (!trackCheckComplete) {
        setPlaying(false)
        return
      }
      if (audio.error || !trackAvailable) {
        audio.pause()
        setPlaying(false)
        setError(missingTrackMessage())
        return
      }
      setPlaying(true)
      setError('')
    }
    const persistPosition = (force = false) => {
      if (!Number.isFinite(audio.currentTime)) return
      const position = Math.floor(audio.currentTime)
      if (!force && Math.abs(position - lastStoredPosition) < 30) return
      lastStoredPosition = position
      setMusicPosition(position)
    }
    const handlePause = () => {
      setPlaying(false)
      persistPosition(true)
    }
    const restorePosition = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return
      const position = savedPosition % audio.duration
      audio.currentTime = position
      lastStoredPosition = Math.floor(position)
    }
    const handleError = () => {
      setPlaying(false)
      trackCheckComplete = true
      trackAvailable = false
      setError(missingTrackMessage())
    }
    const attemptPlay = () => {
      if (trackCheckComplete && !trackAvailable) {
        setPlaying(false)
        setError(missingTrackMessage())
        return
      }
      setError('')
      audio.play().catch((error) => {
        setPlaying(false)
        const isFrench = useGameStore.getState().language !== 'en'
        if (error.name === 'NotAllowedError') {
          setError(isFrench
            ? 'Lecture bloquée par le navigateur. Activez la musique après avoir interagi avec la page.'
            : 'Playback was blocked by the browser. Enable music after interacting with the page.')
        } else {
          setError(isFrench
            ? 'Musique indisponible : vérifiez le fichier /audio/theme.mp3.'
            : 'Music unavailable: check the /audio/theme.mp3 file.')
        }
      })
    }
    const handleToggle = (event) => {
      if (event.detail) attemptPlay()
      else {
        audio.pause()
        setError('')
      }
    }
    const handleUserGesture = () => {
      if (useGameStore.getState().musicEnabled && audio.paused) attemptPlay()
    }

    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)
    audio.addEventListener('timeupdate', persistPosition)
    audio.addEventListener('loadedmetadata', restorePosition)
    window.addEventListener('nation-builder:music-toggle', handleToggle)
    document.addEventListener('pointerdown', handleUserGesture)
    fetch(AUDIO_TRACKS.theme, { method: 'HEAD' })
      .then((response) => {
        const contentType = response.headers.get('content-type') || ''
        trackCheckComplete = true
        trackAvailable = response.ok && contentType.startsWith('audio/')
        if (!trackAvailable) {
          audio.pause()
          setPlaying(false)
          if (useGameStore.getState().musicEnabled) setError(missingTrackMessage())
        } else if (useGameStore.getState().musicEnabled) {
          if (audio.paused) attemptPlay()
          else setPlaying(true)
        }
      })
      .catch(() => {
        trackCheckComplete = true
        trackAvailable = false
        audio.pause()
        setPlaying(false)
        if (useGameStore.getState().musicEnabled) setError(missingTrackMessage())
      })
    if (musicEnabled) attemptPlay()

    return () => {
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('timeupdate', persistPosition)
      audio.removeEventListener('loadedmetadata', restorePosition)
      persistPosition(true)
      window.removeEventListener('nation-builder:music-toggle', handleToggle)
      document.removeEventListener('pointerdown', handleUserGesture)
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // React to volume changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = musicVolume
  }, [musicVolume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return
    if (Math.abs(audio.currentTime - musicPosition) > 2) {
      audio.currentTime = musicPosition % audio.duration
    }
  }, [musicPosition])

  return null
}
