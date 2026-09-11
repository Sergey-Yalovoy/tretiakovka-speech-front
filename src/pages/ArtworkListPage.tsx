import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { userMessageForError } from "@/api/client"
import { getArtworks } from "@/api/artworks"
import { ArtworkGrid } from "@/components/artwork/ArtworkGrid"
import { FilterSheet } from "@/components/filters/FilterSheet"
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/layout/states"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  countActiveFilters,
  parseArtworkListParams,
  serializeArtworkListParams,
} from "@/features/artwork-list/urlState"
import { useDebounce } from "@/hooks/useDebounce"

/** Каталог (§15–§17): поиск с debounce, фильтры в Sheet, пагинация, URL-state (§38). */
export function ArtworkListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlParams = useMemo(() => parseArtworkListParams(searchParams), [searchParams])

  // Локальное значение поиска для мгновенного ввода; в API уходит debounced.
  const [queryInput, setQueryInput] = useState(urlParams.q ?? "")
  const debouncedQ = useDebounce(queryInput, 400)

  const effectiveParams = useMemo(
    () => ({ ...urlParams, q: debouncedQ || undefined }),
    [urlParams, debouncedQ],
  )

  // Синхронизация debounced поиска обратно в URL (без лишнего history-спама — replace).
  const syncSearchToUrl = (q: string) => {
    setSearchParams(serializeArtworkListParams({ ...urlParams, q: q || undefined, page: 1 }), {
      replace: true,
    })
  }

  const artworksQuery = useQuery({
    queryKey: ["artworks", effectiveParams],
    queryFn: ({ signal }) => getArtworks(effectiveParams, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

  const totalPages = artworksQuery.data
    ? Math.max(1, Math.ceil(artworksQuery.data.total / artworksQuery.data.page_size))
    : 1
  const page = effectiveParams.page ?? 1
  const activeCount = countActiveFilters(urlParams)

  const goPage = (next: number) => {
    setSearchParams(serializeArtworkListParams({ ...effectiveParams, page: next }))
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="space-y-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Каталог</h1>

      <form
        role="search"
        aria-label="Поиск картин"
        onSubmit={(e) => {
          e.preventDefault()
          syncSearchToUrl(queryInput)
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onBlur={() => {
              if ((queryInput || "") !== (urlParams.q ?? "")) syncSearchToUrl(queryInput)
            }}
            placeholder="Найти картину или автора"
            aria-label="Найти картину или автора"
            className="pl-9"
            type="search"
          />
        </div>
        <FilterSheet
          params={urlParams}
          activeCount={activeCount}
          onApply={(next) => {
            setSearchParams(serializeArtworkListParams({ ...next, q: debouncedQ || undefined }))
          }}
        />
      </form>

      {artworksQuery.isPending ? (
        <CardSkeletonGrid />
      ) : artworksQuery.isError ? (
        <ErrorState
          message={userMessageForError(artworksQuery.error)}
          onRetry={() => artworksQuery.refetch()}
        />
      ) : artworksQuery.data.items.length === 0 ? (
        <EmptyState
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQueryInput("")
                setSearchParams(new URLSearchParams())
              }}
            >
              Сбросить поиск и фильтры
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            Найдено: {artworksQuery.data.total}
            {artworksQuery.isFetching ? " (обновление…)" : ""}
          </p>
          <ArtworkGrid items={artworksQuery.data.items} />
          <nav aria-label="Пагинация" className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => goPage(page - 1)}
              aria-label="Предыдущая страница"
            >
              Назад
            </Button>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              Страница {page} из {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => goPage(page + 1)}
              aria-label="Следующая страница"
            >
              Вперёд
            </Button>
          </nav>
        </>
      )}
    </div>
  )
}
