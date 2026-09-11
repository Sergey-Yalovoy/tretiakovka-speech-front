import {
  Loader2,
  Pause,
  Play,
  Redo,
  RotateCcw,
  TriangleAlert,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useId } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { PLAYBACK_RATES, useAudioPlayer } from "@/features/audio-player/AudioPlayerContext"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

interface AudioPlayerProps {
  trackId: string | number
  title: string
  author?: string
  src: string | null
  image?: string
  hasAudio: boolean
}

/**
 * Полноценный аудиоплеер detail-экрана (§23–§24):
 * Play/Pause, progress+seek, время, громкость, mute, скорость,
 * loading/error/disabled состояния. Обложка — изображение картины (§22).
 */
export function AudioPlayer({ trackId, title, author, src, image, hasAudio }: AudioPlayerProps) {
  const player = useAudioPlayer()
  const sliderId = useId()
  const isCurrent = player.track?.id === trackId
  const status = isCurrent ? player.status : "idle"
  const currentTime = isCurrent ? player.currentTime : 0
  const duration = isCurrent ? player.duration : 0

  if (!hasAudio || !src) {
    return (
      <Card className="p-4" aria-label="Аудиогид недоступен">
        <p className="text-sm font-medium">Аудиогид пока недоступен.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Для этого произведения ещё нет аудио-описания.
        </p>
      </Card>
    )
  }

  const start = () => {
    player.playTrack({ id: trackId, title, author, src, image })
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <section aria-label="Аудиогид" className="overflow-hidden rounded-xl border bg-card shadow">
      <div className="flex gap-3 p-4">
        {image ? (
          <img
            src={image}
            alt=""
            aria-hidden
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
            Аудио
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Аудиогид
          </p>
          <p className="truncate text-sm font-semibold">{title}</p>
          {author && <p className="truncate text-xs text-muted-foreground">{author}</p>}
        </div>
      </div>

      <div className="space-y-3 px-4 pb-4">
        <div>
          <label htmlFor={sliderId} className="sr-only">
            Позиция воспроизведения
          </label>
          <Slider
            id={sliderId}
            aria-label="Позиция воспроизведения"
            min={0}
            max={duration > 0 ? duration : 100}
            step={1}
            value={[Math.min(currentTime, duration > 0 ? duration : 0)]}
            disabled={duration <= 0 && status !== "playing"}
            onValueChange={([v]) => {
              if (v === undefined) return
              if (!isCurrent) start()
              else player.seek(v)
            }}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span aria-label="Текущее время">{formatTime(currentTime)}</span>
            <span aria-label="Длительность">{duration > 0 ? formatTime(duration) : "—:—"}</span>
          </div>
          {duration > 0 && (
            <div
              className="sr-only"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Прогресс воспроизведения"
            />
          )}
        </div>

        {status === "error" && isCurrent ? (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" aria-hidden />
            <AlertTitle>Не удалось загрузить аудио</AlertTitle>
            <AlertDescription>
              <Button variant="outline" size="sm" className="mt-2" onClick={player.retry}>
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (isCurrent ? player.skip(-15) : start())}
                aria-label="Назад на 15 секунд"
              >
                <RotateCcw aria-hidden />
              </Button>
              {status === "loading" ? (
                <Button size="icon" disabled aria-label="Загрузка аудио">
                  <Loader2 className="animate-spin" aria-hidden />
                </Button>
              ) : status === "playing" ? (
                <Button size="icon" onClick={player.toggle} aria-label="Пауза">
                  <Pause aria-hidden />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={() => (isCurrent ? player.toggle() : start())}
                  aria-label={isCurrent ? "Продолжить воспроизведение" : "Слушать аудиогид"}
                >
                  <Play aria-hidden />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (isCurrent ? player.skip(15) : start())}
                aria-label="Вперёд на 15 секунд"
              >
                <Redo aria-hidden />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 md:flex">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => (isCurrent ? player.toggleMute() : undefined)}
                  aria-label={player.muted ? "Включить звук" : "Выключить звук"}
                  disabled={!isCurrent}
                >
                  {player.muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
                </Button>
                <Slider
                  aria-label="Громкость"
                  className="w-20"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[player.muted ? 0 : player.volume]}
                  disabled={!isCurrent}
                  onValueChange={([v]) => v !== undefined && player.setVolume(v)}
                />
              </div>
              <Select
                value={String(isCurrent ? player.rate : 1)}
                onValueChange={(v) => {
                  const r = Number(v)
                  if (!isCurrent) {
                    player.setRate(r)
                    start()
                  } else player.setRate(r)
                }}
                disabled={status === "loading"}
              >
                <SelectTrigger aria-label="Скорость воспроизведения" className="h-11 w-[92px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAYBACK_RATES.map((r) => (
                    <SelectItem key={r} value={String(r)}>
                      {r}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {status === "loading" && (
          <p role="status" className={cn("text-xs text-muted-foreground")}>
            Загрузка аудио…
          </p>
        )}
      </div>
    </section>
  )
}
