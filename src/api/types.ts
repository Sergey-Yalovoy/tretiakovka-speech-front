/**
 * API-модели по реальному контракту backend (проверено запросами к API).
 * Не использовать `any`: неизвестные структуры backend — через вложенные типы.
 */

/** Автор произведения: {id, name, years}. */
export interface AuthorRef {
  id: number
  name: string
  years: string | null
}

/** Стиль / материал / техника: {id, name}. */
export interface NamedRef {
  id: number
  name: string
}

export interface ArtworkListItem {
  id: number
  name: string
  code: string
  authors: AuthorRef[]
  styles: NamedRef[]
  height: string | null
  width: string | null
  depth: string | null
  creat: string
  creat_f: string
  period: string
  picture_thumb: string[]
  picture_big: string[]
  has_audio: boolean
  audio_url: string | null
}

export interface ArtworkDetail extends ArtworkListItem {
  placement: string | null
  materials: NamedRef[]
  techniques: NamedRef[]
  facts: string | null
  description: string | null
}

export interface ArtworkListResponse {
  total: number
  page: number
  page_size: number
  items: ArtworkListItem[]
}

export interface FiltersResponse {
  authors: AuthorRef[]
  styles: NamedRef[]
  materials: NamedRef[]
  techniques: NamedRef[]
  periods: string[]
}

export interface ArtworkListParams {
  q?: string
  author_id?: string[]
  style_id?: string[]
  material_id?: string[]
  technique_id?: string[]
  period?: string[]
  page?: number
  page_size?: number
}

export interface ArtworkDetailParams {
  with_audio?: boolean
  speaker?: SpeakerId
}

export interface FindArtworkBody {
  url: string
}

/** Человекочитаемое имя ссылки (автор/стиль/материал/техника). */
export function refName(ref: AuthorRef | NamedRef): string {
  return ref.name
}

/** Автор для карточек/плеера: «Имя» (+ годы жизни, если известны). */
export function authorDisplay(author: AuthorRef): string {
  return author.years ? `${author.name} (${author.years})` : author.name
}

/** Голоса backend (§51). Строки не разбрасывать по компонентам. */
export type SpeakerId = "aidar" | "baya" | "kseniya" | "xenia" | "eugene"

export type ApiErrorKind =
  "bad-request" | "not-found" | "validation" | "rate-limit" | "server" | "network" | "unknown"

export class ApiError extends Error {
  readonly status: number | null
  readonly kind: ApiErrorKind

  constructor(message: string, status: number | null, kind: ApiErrorKind) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.kind = kind
  }
}
