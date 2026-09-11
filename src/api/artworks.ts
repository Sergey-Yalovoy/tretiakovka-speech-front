import { apiClient } from "./client"
import type {
  ArtworkDetail,
  ArtworkDetailParams,
  ArtworkListParams,
  ArtworkListResponse,
  FindArtworkBody,
} from "./types"

function appendMulti(search: URLSearchParams, key: string, values?: string[]): void {
  // Backend ждёт повторяющиеся параметры БЕЗ скобок: ?style_id=1&style_id=2 (§5).
  // Вариант со скобками (style_id[]=1) backend игнорирует и возвращает всё без фильтра.
  for (const v of values ?? []) {
    if (v) search.append(key, v)
  }
}

export function buildArtworksQuery(params: ArtworkListParams): string {
  const search = new URLSearchParams()
  if (params.q?.trim()) search.set("q", params.q.trim())
  appendMulti(search, "author_id", params.author_id)
  appendMulti(search, "style_id", params.style_id)
  appendMulti(search, "material_id", params.material_id)
  appendMulti(search, "technique_id", params.technique_id)
  if (params.period) for (const p of params.period) if (p) search.append("period", p)
  search.set("page", String(params.page ?? 1))
  search.set("page_size", String(params.page_size ?? 20))
  return `/api/v1/artworks?${search.toString()}`
}

/** GET /api/v1/artworks — список с поиском/фильтрами/пагинацией (§5). */
export function getArtworks(
  params: ArtworkListParams,
  signal?: AbortSignal,
): Promise<ArtworkListResponse> {
  return apiClient.get<ArtworkListResponse>(buildArtworksQuery(params), signal)
}

/** GET /api/v1/artworks/{id} — detail (§6). */
export function getArtwork(
  id: string | number,
  params: ArtworkDetailParams = {},
  signal?: AbortSignal,
): Promise<ArtworkDetail> {
  const search = new URLSearchParams()
  search.set("with_audio", String(params.with_audio ?? false))
  if (params.speaker) search.set("speaker", params.speaker)
  return apiClient.get<ArtworkDetail>(
    `/api/v1/artworks/${encodeURIComponent(String(id))}?${search.toString()}`,
    signal,
  )
}

/**
 * POST /api/v1/artworks/find — QR-сценарий (§7).
 * URL передаётся backend целиком, ID на frontend не парсим (§30).
 */
export function findArtworkByUrl(
  body: FindArtworkBody,
  params: ArtworkDetailParams = {},
  signal?: AbortSignal,
): Promise<ArtworkDetail> {
  const search = new URLSearchParams()
  search.set("with_audio", String(params.with_audio ?? false))
  if (params.speaker) search.set("speaker", params.speaker)
  return apiClient.post<ArtworkDetail>(`/api/v1/artworks/find?${search.toString()}`, body, signal)
}

/** Прямой URL streaming/caching endpoint (§9). Используется как src для <audio>. */
export function artworkAudioUrl(id: string | number, voice?: string): string {
  const search = new URLSearchParams()
  if (voice) search.set("voice", voice)
  const qs = search.toString()
  return `/api/v1/artworks/${encodeURIComponent(String(id))}/audio${qs ? `?${qs}` : ""}`
}
