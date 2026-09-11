import { apiClient } from "./client"
import type { FiltersResponse } from "./types"

/** GET /api/v1/filters — кешируется TanStack Query (§8, §37). */
export function getFilters(signal?: AbortSignal): Promise<FiltersResponse> {
  return apiClient.get<FiltersResponse>("/api/v1/filters", signal)
}
