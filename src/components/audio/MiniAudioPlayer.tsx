import { Pause, Play } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAudioPlayer } from "@/features/audio-player/AudioPlayerContext"

/** Sticky mini-player (§25): продолжает играть при чтении описания. */
export function MiniAudioPlayer() {
  const player = useAudioPlayer()
  if (!player.track || player.status === "idle") return null
  const progress = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0

  return (
    <div
      className="fixed inset-x-0 bottom-16 z-40 px-3 md:bottom-4"
      role="region"
      aria-label="Мини-плеер"
    >
      <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border bg-card shadow-lg">
        <div className="flex items-center gap-3 p-2">
          {player.track.image ? (
            <img
              src={player.track.image}
              alt=""
              aria-hidden
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-md bg-muted" aria-hidden />
          )}
          <Link
            to={`/artworks/${player.track.id}`}
            className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline"
          >
            {player.track.title}
          </Link>
          <Button
            size="icon"
            variant="secondary"
            onClick={player.toggle}
            aria-label={player.isPlaying ? "Пауза" : "Продолжить"}
          >
            {player.isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
          </Button>
        </div>
        <div
          className="h-1 w-full bg-secondary"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Прогресс воспроизведения"
        >
          <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
