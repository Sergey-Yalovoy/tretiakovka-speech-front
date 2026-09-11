import type { ArtworkListParams } from "@/api/types"

const PAGE_SIZE = 20

function getAll(search: URLSearchParams, key: string): string[] {
  // Backend contract: `author_id[]` etc. В URL используем короткие ключи без [].
  return search.getAll(key).filter(Boolean)
}

/** Парсинг URL → параметры API (§38). */
export function parseArtworkListParams(search: URLSearchParams): ArtworkListParams {
  const page = Number(search.get("page") ?? "1")
  const pageSize = Number(search.get("page_size") ?? String(PAGE_SIZE))
  return {
    q: search.get("q") ?? undefined,
    author_id: getAll(search, "author_id"),
    style_id: getAll(search, "style_id"),
    material_id: getAll(search, "material_id"),
    technique_id: getAll(search, "technique_id"),
    period: getAll(search, "period"),
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    page_size:
      Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : PAGE_SIZE,
  }
}

/** Параметры API → URL (§38): пустые значения опускаем. */
export function serializeArtworkListParams(params: ArtworkListParams): URLSearchParams {
  const search = new URLSearchParams()
  if (params.q?.trim()) search.set("q", params.q.trim())
  for (const [key, values] of [
    ["author_id", params.author_id],
    ["style_id", params.style_id],
    ["material_id", params.material_id],
    ["technique_id", params.technique_id],
    ["period", params.period],
  ] as const) {
    for (const v of values ?? []) if (v) search.append(key, v)
  }
  if ((params.page ?? 1) > 1) search.set("page", String(params.page))
  if ((params.page_size ?? PAGE_SIZE) !== PAGE_SIZE)
    search.set("page_size", String(params.page_size))
  return search
}

export function countActiveFilters(params: ArtworkListParams): number {
  return (
    (params.author_id?.length ?? 0) +
    (params.style_id?.length ?? 0) +
    (params.material_id?.length ?? 0) +
    (params.technique_id?.length ?? 0) +
    (params.period?.length ?? 0)
  )
}

export { PAGE_SIZE }
