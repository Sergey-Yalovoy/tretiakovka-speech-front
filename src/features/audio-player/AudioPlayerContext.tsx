import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"

export interface AudioTrack {
  id: string | number
  title: string
  author?: string
  src: string
  image?: string
}

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "error"

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const

interface AudioPlayerContextValue {
  track: AudioTrack | null
  status: AudioStatus
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  rate: number
  error: string | null
  playTrack: (track: AudioTrack) => void
  /**
   * Заменить текущий трек без автоплея: пауза, новый src, позиция в 0.
   * Нужно при смене голоса — чтобы в плеере не продолжал звучать старый спикер.
   */
  replaceTrack: (track: AudioTrack) => void
  toggle: () => void
  seek: (seconds: number) => void
  skip: (deltaSeconds: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setRate: (rate: number) => void
  retry: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null)

/**
 * Единый playback controller (§48–§49): один HTMLAudioElement на всё приложение.
 * Не загружать audio до Play (§47): preload="none", src выставляется при playTrack.
 */
export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [status, setStatus] = useState<AudioStatus>("idle")
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.9)
  const [muted, setMuted] = useState(false)
  const [rate, setRateState] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)

  const ensureAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const el = new Audio()
      el.preload = "none"
      audioRef.current = el
    }
    return audioRef.current
  }, [])

  // Подписка на события единственного элемента — один раз.
  useEffect(() => {
    const el = ensureAudio()
    const onTime = () => setCurrentTime(el.currentTime)
    const onDuration = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0)
    const onPlay = () => setStatus("playing")
    const onPause = () => {
      // pause срабатывает и при окончании — ended обработаем отдельно
      if (!el.ended) setStatus((s) => (s === "loading" ? s : "paused"))
    }
    const onWaiting = () => setStatus("loading")
    const onPlaying = () => setStatus("playing")
    const onEnded = () => {
      setStatus("paused")
      setCurrentTime(0)
    }
    const onError = () => {
      setStatus("error")
      setError("Не удалось загрузить аудио")
    }
    el.addEventListener("timeupdate", onTime)
    el.addEventListener("loadedmetadata", onDuration)
    el.addEventListener("durationchange", onDuration)
    el.addEventListener("play", onPlay)
    el.addEventListener("pause", onPause)
    el.addEventListener("waiting", onWaiting)
    el.addEventListener("playing", onPlaying)
    el.addEventListener("ended", onEnded)
    el.addEventListener("error", onError)
    return () => {
      el.removeEventListener("timeupdate", onTime)
      el.removeEventListener("loadedmetadata", onDuration)
      el.removeEventListener("durationchange", onDuration)
      el.removeEventListener("play", onPlay)
      el.removeEventListener("pause", onPause)
      el.removeEventListener("waiting", onWaiting)
      el.removeEventListener("playing", onPlaying)
      el.removeEventListener("ended", onEnded)
      el.removeEventListener("error", onError)
    }
  }, [ensureAudio])

  // Синхронизация громкости/скорости с элементом.
  useEffect(() => {
    const el = audioRef.current
    if (el) el.volume = volume
  }, [volume])
  useEffect(() => {
    const el = audioRef.current
    if (el) el.muted = muted
  }, [muted])
  useEffect(() => {
    const el = audioRef.current
    if (el) el.playbackRate = rate
  }, [rate])

  const playTrack = useCallback(
    (next: AudioTrack) => {
      const el = ensureAudio()
      setTrack((prev) => {
        if (!prev || prev.id !== next.id || prev.src !== next.src) {
          el.src = next.src
          el.currentTime = 0
          setCurrentTime(0)
          setDuration(0)
          setError(null)
          setStatus("loading")
          void el.play().catch(() => {
            setStatus("error")
            setError("Не удалось загрузить аудио")
          })
          return next
        }
        // Тот же трек — просто продолжить.
        setError(null)
        void el.play().catch(() => {
          setStatus("error")
          setError("Не удалось загрузить аудио")
        })
        return prev
      })
    },
    [ensureAudio],
  )

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el || !track) return
    if (el.paused) {
      setError(null)
      void el.play().catch(() => {
        setStatus("error")
        setError("Не удалось загрузить аудио")
      })
    } else {
      el.pause()
    }
  }, [track])

  const replaceTrack = useCallback(
    (next: AudioTrack) => {
      const el = ensureAudio()
      el.pause()
      el.removeAttribute("src")
      el.src = next.src
      el.currentTime = 0
      setCurrentTime(0)
      setDuration(0)
      setError(null)
      setStatus("paused")
      setTrack(next)
    },
    [ensureAudio],
  )

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current
    if (!el || !Number.isFinite(seconds)) return
    el.currentTime = Math.max(0, Math.min(el.duration || seconds, seconds))
    setCurrentTime(el.currentTime)
  }, [])

  const skip = useCallback(
    (delta: number) => {
      const el = audioRef.current
      if (!el) return
      seek((el.currentTime || 0) + delta)
    },
    [seek],
  )

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)))
    setMuted(false)
  }, [])

  const toggleMute = useCallback(() => setMuted((m) => !m), [])
  const setRate = useCallback((r: number) => setRateState(r), [])

  const retry = useCallback(() => {
    const el = audioRef.current
    if (!el || !track) return
    setError(null)
    setStatus("loading")
    el.load()
    void el.play().catch(() => {
      setStatus("error")
      setError("Не удалось загрузить аудио")
    })
  }, [track])

  // Пауза при размонтировании провайдера не нужна (живёт весь сеанс),
  // но сбрасываем элемент при выгрузке страницы — не держим ресурсов.
  useEffect(
    () => () => {
      audioRef.current?.pause()
    },
    [],
  )

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      track,
      status,
      isPlaying: status === "playing",
      currentTime,
      duration,
      volume,
      muted,
      rate,
      error,
      playTrack,
      replaceTrack,
      toggle,
      seek,
      skip,
      setVolume,
      toggleMute,
      setRate,
      retry,
    }),
    [
      track,
      status,
      currentTime,
      duration,
      volume,
      muted,
      rate,
      error,
      playTrack,
      replaceTrack,
      toggle,
      seek,
      skip,
      setVolume,
      toggleMute,
      setRate,
      retry,
    ],
  )

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
}

export function useAudioPlayer(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider")
  return ctx
}
