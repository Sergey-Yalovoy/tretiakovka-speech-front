import { useState } from "react"

import { ArtworkImage } from "@/components/artwork/ArtworkImage"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Простая галерея detail (§21): основное изображение + thumbnails + swipe.
 * Без тяжёлой фотогалереи на первом этапе.
 */
export function ArtworkGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0)
  const [touchX, setTouchX] = useState<number | null>(null)
  if (images.length === 0) return null
  const current = images[index] ?? images[0]
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + images.length) % images.length)

  return (
    <figure className="min-w-0 space-y-2">
      <div
        className="overflow-hidden rounded-xl border bg-muted"
        onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const endX = e.changedTouches[0]?.clientX
          if (touchX === null || endX === undefined) return
          const dx = endX - touchX
          if (dx > 40) go(-1)
          else if (dx < -40) go(1)
          setTouchX(null)
        }}
      >
        <ArtworkImage
          src={current}
          alt={title}
          eager
          fit="contain"
          className="mx-auto block h-auto max-h-[70svh] w-full lg:max-h-[75svh]"
        />
      </div>
      {images.length > 1 && (
        <div className="flex items-center gap-2" role="group" aria-label="Выбор изображения">
          <Button
            variant="outline"
            size="sm"
            onClick={() => go(-1)}
            aria-label="Предыдущее изображение"
          >
            ←
          </Button>
          <div className="flex flex-1 gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Показать изображение ${i + 1}`}
                aria-pressed={i === index}
                className={cn(
                  "h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  i === index
                    ? "border-primary"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <img
                  src={src}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => go(1)}
            aria-label="Следующее изображение"
          >
            →
          </Button>
        </div>
      )}
    </figure>
  )
}
