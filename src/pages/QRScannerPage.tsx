import { useMutation } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { lazy, Suspense, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { userMessageForError } from "@/api/client"
import { findArtworkByUrl } from "@/api/artworks"
import { ApiError } from "@/api/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DEFAULT_SPEAKER } from "@/config/voices"

const QRScanner = lazy(() =>
  import("@/components/qr/QRScanner").then((m) => ({ default: m.QRScanner })),
)

function isHttpUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim())
}

/**
 * /scan (§27–§32): QR → URL → POST /find → navigate /artworks/{id}.
 * Без промежуточной страницы поиска и без открытия внешнего URL (§29).
 */
export function QRScannerPage() {
  const navigate = useNavigate()
  const [unsupported, setUnsupported] = useState<string | null>(null)

  const findMutation = useMutation({
    mutationFn: (url: string) =>
      findArtworkByUrl({ url }, { with_audio: false, speaker: DEFAULT_SPEAKER }),
    onSuccess: (artwork) => {
      navigate(`/artworks/${artwork.id}`)
    },
  })

  const handleResult = (text: string) => {
    setUnsupported(null)
    findMutation.reset()
    if (!isHttpUrl(text)) {
      setUnsupported("Этот QR-код не содержит ссылки на произведение Третьяковской галереи.")
      return
    }
    findMutation.mutate(text.trim())
  }

  const busy = findMutation.isPending

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 py-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/" aria-label="Назад на главную">
          <ArrowLeft aria-hidden /> Сканировать QR
        </Link>
      </Button>

      <p className="text-sm text-muted-foreground">
        Разрешите доступ к камере, чтобы сканировать QR-коды произведений.
      </p>

      <Suspense
        fallback={
          <p role="status" className="text-sm">
            Загрузка сканера…
          </p>
        }
      >
        <QRScanner onResult={handleResult} paused={busy} />
      </Suspense>

      {busy && (
        <p role="status" className="flex items-center justify-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Ищем произведение…
        </p>
      )}

      {unsupported && (
        <Alert variant="destructive">
          <AlertTitle>Неподдерживаемый QR-код</AlertTitle>
          <AlertDescription>{unsupported}</AlertDescription>
        </Alert>
      )}

      {findMutation.isError && (
        <Alert variant="destructive">
          <AlertTitle>
            {findMutation.error instanceof ApiError && findMutation.error.status === 404
              ? "Не удалось найти произведение"
              : "Ошибка поиска"}
          </AlertTitle>
          <AlertDescription>
            <p>
              {findMutation.error instanceof ApiError && findMutation.error.status === 404
                ? "Попробуйте отсканировать QR-код ещё раз."
                : userMessageForError(findMutation.error)}
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => findMutation.reset()}>
                Повторить
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/artworks">В каталог</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
