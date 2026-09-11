import { ApiError } from "./types"

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? ""

function kindForStatus(status: number): ApiError["kind"] {
  if (status === 400) return "bad-request"
  if (status === 404) return "not-found"
  if (status === 422) return "validation"
  if (status === 429) return "rate-limit"
  if (status >= 500) return "server"
  return "unknown"
}

export function userMessageForError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case "not-found":
        return "Произведение не найдено."
      case "network":
        return "Нет соединения с сервером. Проверьте интернет и попробуйте снова."
      case "rate-limit":
        return "Слишком много запросов. Подождите немного и попробуйте ещё раз."
      case "validation":
      case "bad-request":
        return "Некорректный запрос. Попробуйте изменить параметры."
      case "server":
        return "Не удалось загрузить данные. Попробуйте ещё раз."
      default:
        return "Не удалось загрузить данные. Попробуйте ещё раз."
    }
  }
  return "Не удалось загрузить данные. Попробуйте ещё раз."
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    })
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Network error", null, "network")
  }
  if (!res.ok) {
    const data = await parseJsonSafe(res)
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : res.statusText
    throw new ApiError(
      detail || `Request failed: ${res.status}`,
      res.status,
      kindForStatus(res.status),
    )
  }
  return (await parseJsonSafe(res)) as T
}

export const apiClient = {
  get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return request<T>(path, { method: "GET", signal })
  },
  post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    return request<T>(path, { method: "POST", body: JSON.stringify(body), signal })
  },
  /** Полный URL backend-ресурса (аудио/S3) — использовать как есть (§9, §26). */
  resolveUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url
    return `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`
  },
}

export { BASE_URL }
