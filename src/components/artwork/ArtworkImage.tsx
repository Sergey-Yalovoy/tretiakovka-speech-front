import { useState } from "react"

import { ImageUnavailable } from "@/components/layout/states"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Изображение с lazy loading, alt и fallback (§46–§47). */
export function ArtworkImage({
  src,
  alt,
  className,
  eager = false,
  fit = "cover",
}: {
  src?: string
  alt: string
  className?: string
  eager?: boolean
  /** cover — заполнить кадр (карточки), contain — вся картина целиком (detail). */
  fit?: "cover" | "contain"
}) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  if (!src || failed) return <ImageUnavailable title="Изображение недоступно" />
  return (
    <span
      className={cn(
        "relative block h-full",
        // Пока contain-картина грузится и её пропорции неизвестны —
        // резервируем место, чтобы не было layout shift.
        fit === "contain" && !loaded && "aspect-[4/3] w-full",
      )}
    >
      {/* Skeleton поверх: убирает «пустые» боксы, пока грузится CDN. */}
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full" aria-hidden />}
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        // visibility (а не display:none): у элемента с display:none
        // и loading="lazy" браузер вообще не начинает загрузку.
        className={cn(
          fit === "contain" ? "object-contain" : "object-cover",
          !loaded && "invisible",
          className,
        )}
      />
    </span>
  )
}
