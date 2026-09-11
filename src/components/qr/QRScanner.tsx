import { Html5Qrcode } from "html5-qrcode"
import { useEffect, useRef, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface QRScannerProps {
  onResult: (text: string) => void
  paused: boolean
}

const REGION_ID = "tretyakov-qr-region"

/** Остановка без исключений: Html5Qrcode.stop() бросает sync-throw, если не запущен. */
async function stopQuietly(scanner: Html5Qrcode): Promise<void> {
  try {
    await scanner.stop()
  } catch {
    /* сканер не был запущен — нечего останавливать */
  }
  try {
    scanner.clear()
  } catch {
    /* ignore */
  }
}

/**
 * QR-сканирование камерой (§28): Html5Qrcode + facingMode environment.
 * Без самописного декодера. Ручной ввод URL — fallback для desktop/ошибок камеры.
 */
export function QRScanner({ onResult, paused }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [starting, setStarting] = useState(true)
  const [manualUrl, setManualUrl] = useState("")

  useEffect(() => {
    let cancelled = false
    let running = false
    const scanner = new Html5Qrcode(REGION_ID, { verbose: false })
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (decodedText) => {
          if (paused) return
          onResultRef.current(decodedText)
        },
        undefined,
      )
      .then(() => {
        if (cancelled) {
          // StrictMode remount / unmount во время запуска — останавливаем сразу.
          void stopQuietly(scanner)
          return
        }
        running = true
        setStarting(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setStarting(false)
        const message = err instanceof Error ? err.message : String(err)
        if (/permission|denied|NotAllowed/i.test(message)) {
          setCameraError("Нет доступа к камере. Разрешите доступ к камере в настройках браузера.")
        } else {
          setCameraError(
            "Не удалось запустить камеру. Проверьте HTTPS-соединение и наличие камеры, либо вставьте ссылку вручную.",
          )
        }
      })

    return () => {
      cancelled = true
      scannerRef.current = null
      // stop()/clear() бросают синхронное исключение, если сканер не запущен —
      // это штатная ситуация (нет камеры, отказ в permission, StrictMode remount).
      if (running) {
        running = false
        void stopQuietly(scanner)
      } else {
        try {
          scanner.clear()
        } catch {
          /* ignore */
        }
      }
    }
  }, [paused])

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border bg-black">
        <div id={REGION_ID} aria-label="Область сканирования QR-кода" className="min-h-64 w-full" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-56 w-56 rounded-lg border-2 border-white/80" />
        </div>
      </div>

      {starting && (
        <p role="status" className="text-center text-sm text-muted-foreground">
          Запуск камеры…
        </p>
      )}
      {!starting && !cameraError && (
        <p className="text-center text-sm text-muted-foreground">
          Наведите камеру на QR-код произведения
        </p>
      )}
      {cameraError && (
        <Alert variant="destructive">
          <AlertTitle>Камера недоступна</AlertTitle>
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (manualUrl.trim()) onResultRef.current(manualUrl.trim())
        }}
      >
        <Input
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder="https://my.tretyakov.ru/app/masterpiece/…"
          aria-label="Вставить ссылку с QR-кода вручную"
          inputMode="url"
          type="text"
          autoComplete="off"
        />
        <Button type="submit" variant="secondary">
          Открыть
        </Button>
      </form>
    </div>
  )
}
