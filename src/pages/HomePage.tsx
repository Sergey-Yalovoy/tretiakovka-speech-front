import { useQuery } from "@tanstack/react-query"
import { QrCode, Search } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { getArtworks } from "@/api/artworks"
import { ArtworkGrid } from "@/components/artwork/ArtworkGrid"
import { CardSkeletonGrid, ErrorState } from "@/components/layout/states"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Главная (§13): объяснение + CTA «Сканировать QR-код» + поиск + каталог-превью. */
export function HomePage() {
  const navigate = useNavigate()
  const [q, setQ] = useState("")

  const previewQuery = useQuery({
    queryKey: ["artworks", "home-preview"],
    queryFn: ({ signal }) => getArtworks({ page: 1, page_size: 8 }, signal),
    staleTime: 5 * 60_000,
  })

  return (
    <div className="space-y-8 py-8">
      <section aria-label="О приложении" className="mx-auto max-w-xl space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Tretyakov Audio</h1>
        <p className="text-base text-muted-foreground">
          Слушайте истории картин Третьяковской галереи
        </p>
        <Button size="lg" className="w-full sm:w-auto" asChild>
          <Link to="/scan" aria-label="Сканировать QR-код">
            <QrCode aria-hidden /> Сканировать QR-код
          </Link>
        </Button>
        <form
          role="search"
          aria-label="Быстрый поиск"
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            navigate(q.trim() ? `/artworks?q=${encodeURIComponent(q.trim())}` : "/artworks")
          }}
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Найти картину"
            aria-label="Найти картину"
            type="search"
          />
          <Button type="submit" variant="secondary" aria-label="Искать">
            <Search aria-hidden />
          </Button>
        </form>
      </section>

      <section aria-label="Каталог" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Каталог</h2>
          <Button variant="link" asChild>
            <Link to="/artworks">Все произведения →</Link>
          </Button>
        </div>
        {previewQuery.isPending ? (
          <CardSkeletonGrid count={4} />
        ) : previewQuery.isError ? (
          <ErrorState
            message="Не удалось загрузить каталог. Попробуйте ещё раз."
            onRetry={() => previewQuery.refetch()}
          />
        ) : (
          <ArtworkGrid items={previewQuery.data.items} />
        )}
      </section>
    </div>
  )
}
