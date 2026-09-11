import { Volume2 } from "lucide-react"
import { Link } from "react-router-dom"

import type { ArtworkListItem } from "@/api/types"
import { authorDisplay } from "@/api/types"
import { ArtworkImage } from "@/components/artwork/ArtworkImage"
import { Card } from "@/components/ui/card"

/** Карточка картины (§18): thumbnail, название, автор, год/период, audio-индикатор. */
export function ArtworkCard({ artwork }: { artwork: ArtworkListItem }) {
  const author = artwork.authors[0] ? authorDisplay(artwork.authors[0]) : "Автор неизвестен"
  const thumb = artwork.picture_thumb[0] ?? artwork.picture_big[0]
  return (
    <Link
      to={`/artworks/${artwork.id}`}
      className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label={`${artwork.name}, ${author}`}
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <ArtworkImage src={thumb} alt={artwork.name} className="h-full w-full" />
          {artwork.has_audio && (
            <span
              className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white"
              title="Есть аудиогид"
              aria-label="Есть аудиогид"
            >
              <Volume2 className="h-4 w-4" aria-hidden />
            </span>
          )}
        </div>
        <div className="space-y-1 p-3">
          <p className="text-xs text-muted-foreground">{author}</p>
          <p className="line-clamp-2 text-sm leading-snug font-semibold">{artwork.name}</p>
          {(artwork.creat_f || artwork.creat || artwork.period) && (
            <p className="text-xs text-muted-foreground">
              {artwork.creat_f || artwork.creat || artwork.period}
            </p>
          )}
        </div>
      </Card>
    </Link>
  )
}
