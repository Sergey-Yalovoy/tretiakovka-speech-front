import { ImageOff, SearchX, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function LoadingState({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Загрузка каталога"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <span className="sr-only">Загрузка каталога…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border p-3">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  title = "Ничего не найдено",
  description = "Попробуйте изменить параметры поиска или фильтры.",
  action,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="text-base font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  )
}

export function ImageUnavailable({ title = "Изображение недоступно" }: { title?: string }) {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl bg-muted text-muted-foreground">
      <ImageOff className="h-8 w-8" aria-hidden />
      <p className="text-sm">{title}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 px-6 py-10 text-center"
    >
      <TriangleAlert className="h-8 w-8 text-destructive" aria-hidden />
      <p className="max-w-md text-sm font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Попробовать ещё раз
        </Button>
      )}
    </div>
  )
}
