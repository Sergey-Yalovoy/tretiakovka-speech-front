import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { userMessageForError } from "@/api/client"
import { getArtwork } from "@/api/artworks"
import type { SpeakerId } from "@/api/types"
import { authorDisplay, refName } from "@/api/types"
import { ArtworkGallery } from "@/components/artwork/ArtworkGallery"
import { AudioPlayer } from "@/components/audio/AudioPlayer"
import { ErrorState, LoadingState } from "@/components/layout/states"
import { useAudioPlayer } from "@/features/audio-player/AudioPlayerContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DEFAULT_SPEAKER, SPEAKERS } from "@/config/voices"

/**
 * Detail экран (§19–§20): изображение → название → автор → плеер → описание →
 * факты → характеристики → материалы/техника → размещение.
 */
export function ArtworkDetailPage() {
  const { id = "" } = useParams()
  const [speaker, setSpeaker] = useState<SpeakerId>(DEFAULT_SPEAKER)
  // Аудио грузится только по явному запросу пользователя (§53):
  // сначала detail с with_audio=false, затем — с with_audio=true.
  const [wantsAudio, setWantsAudio] = useState(false)
  const player = useAudioPlayer()

  const detailQuery = useQuery({
    queryKey: ["artwork", id, speaker, wantsAudio],
    queryFn: ({ signal }) => getArtwork(id, { with_audio: wantsAudio, speaker }, signal),
    enabled: id.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })

  // Если URL аудио сменился (смена голоса), а в плеере старый трек этой же
  // картины — подменяем src без автоплея, чтобы не звучал предыдущий спикер.
  const loaded = detailQuery.data
  const trackId = player.track?.id
  const trackSrc = player.track?.src
  const freshUrl = loaded?.audio_url ?? null
  const isUpdating = detailQuery.isFetching
  const replaceTrack = player.replaceTrack
  useEffect(() => {
    if (loaded && freshUrl && trackId === loaded.id && trackSrc !== freshUrl && !isUpdating) {
      replaceTrack({
        id: loaded.id,
        title: loaded.name,
        author: loaded.authors.map(authorDisplay).join(", ") || "Автор неизвестен",
        src: freshUrl,
        image: loaded.picture_big[0] ?? loaded.picture_thumb[0],
      })
    }
  }, [loaded, freshUrl, trackId, trackSrc, isUpdating, replaceTrack])

  if (detailQuery.isPending) {
    return (
      <div className="space-y-4 py-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/artworks">
            <ArrowLeft aria-hidden /> Назад
          </Link>
        </Button>
        <LoadingState label="Загрузка произведения" />
      </div>
    )
  }

  if (detailQuery.isError) {
    return (
      <div className="space-y-4 py-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/artworks">
            <ArrowLeft aria-hidden /> Назад
          </Link>
        </Button>
        <ErrorState
          message={userMessageForError(detailQuery.error)}
          onRetry={() => detailQuery.refetch()}
        />
      </div>
    )
  }

  const artwork = detailQuery.data
  const author = artwork.authors.map(authorDisplay).join(", ") || "Автор неизвестен"
  const coverImage = artwork.picture_big[0] ?? artwork.picture_thumb[0]
  // Кнопка — всегда, когда нет audio_url: with_audio=true генерирует аудио
  // даже при has_audio=false (флаг означает лишь «уже готово»).
  const audioPending = !artwork.audio_url

  /** Смена голоса: если аудио уже загружено — перезапрос с новым speaker. */
  const handleSpeakerChange = (value: string) => {
    const next = value as SpeakerId
    if (next !== speaker) setSpeaker(next)
  }

  return (
    <article className="space-y-5 py-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/artworks" aria-label="Назад к каталогу">
          <ArrowLeft aria-hidden /> Назад
        </Link>
      </Button>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <ArtworkGallery images={artwork.picture_big} title={artwork.name} />

        <div className="space-y-4">
          <header className="space-y-1">
            <h1 className="text-2xl leading-tight font-bold tracking-tight">{artwork.name}</h1>
            <p className="text-base text-muted-foreground">{author}</p>
            {(artwork.creat_f || artwork.creat || artwork.period) && (
              <p className="text-sm text-muted-foreground">
                {artwork.creat_f || artwork.creat}
                {artwork.period ? ` · ${artwork.period}` : ""}
              </p>
            )}
            <div className="flex flex-wrap gap-1 pt-1">
              {artwork.styles.map((s) => (
                <Badge key={s.id} variant="secondary">
                  {refName(s)}
                </Badge>
              ))}
            </div>
          </header>

          {audioPending && !wantsAudio ? (
            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium">Аудиогид</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Нажмите, чтобы загрузить аудио-описание для выбранного голоса.
              </p>
              <Button className="mt-3" onClick={() => setWantsAudio(true)}>
                Загрузить аудио
              </Button>
            </div>
          ) : audioPending && detailQuery.isFetching ? (
            <div className="rounded-xl border p-4" role="status" aria-live="polite">
              <p className="text-sm font-medium">Аудиогид</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Загрузка аудио… Генерация занимает несколько секунд.
              </p>
            </div>
          ) : audioPending ? (
            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium">Аудиогид</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Аудио пока недоступно. Проверьте готовность чуть позже.
              </p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => detailQuery.refetch()}
                disabled={detailQuery.isFetching}
              >
                Проверить снова
              </Button>
            </div>
          ) : (
            <AudioPlayer
              trackId={artwork.id}
              title={artwork.name}
              author={author}
              src={artwork.audio_url}
              image={coverImage}
              hasAudio={artwork.has_audio}
            />
          )}

          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="voice-select" className="text-muted-foreground">
              Голос:
            </label>
            <Select value={speaker} onValueChange={handleSpeakerChange}>
              <SelectTrigger id="voice-select" aria-label="Голос аудиогида" className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEAKERS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {detailQuery.isFetching && (
              <span role="status" className="text-xs text-muted-foreground">
                Обновление…
              </span>
            )}
          </div>

          {artwork.description && (
            <section aria-label="Описание">
              <h2 className="mb-1 text-base font-semibold">Описание</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line">{artwork.description}</p>
            </section>
          )}

          {artwork.facts && (
            <section aria-label="Факты">
              <h2 className="mb-1 text-base font-semibold">Факты</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line">{artwork.facts}</p>
            </section>
          )}
        </div>
      </div>

      <Separator />

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {(artwork.height || artwork.width || artwork.depth) && (
          <div>
            <dt className="font-medium">Размер</dt>
            <dd className="text-muted-foreground">
              {[artwork.height, artwork.width, artwork.depth]
                .filter((v): v is string => Boolean(v))
                .join(" × ")}
            </dd>
          </div>
        )}
        {artwork.creat && (
          <div>
            <dt className="font-medium">Дата создания</dt>
            <dd className="text-muted-foreground">{artwork.creat_f || artwork.creat}</dd>
          </div>
        )}
        {artwork.materials.length > 0 && (
          <div>
            <dt className="font-medium">Материалы</dt>
            <dd className="text-muted-foreground">{artwork.materials.map(refName).join(", ")}</dd>
          </div>
        )}
        {artwork.techniques.length > 0 && (
          <div>
            <dt className="font-medium">Техника</dt>
            <dd className="text-muted-foreground">{artwork.techniques.map(refName).join(", ")}</dd>
          </div>
        )}
        {artwork.placement && (
          <div>
            <dt className="font-medium">Место размещения</dt>
            <dd className="text-muted-foreground">{artwork.placement}</dd>
          </div>
        )}
      </dl>
    </article>
  )
}
