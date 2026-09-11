import type { Page } from "@playwright/test"

/** Крошечный валидный PNG (1px), чтобы <img> реально загружался в тестах. */
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

export const MOCK_ARTWORKS = {
  total: 2,
  page: 1,
  page_size: 20,
  items: [
    {
      id: 8395,
      name: "Явление Христа народу",
      code: "zh-1",
      authors: [{ id: 1, name: "Александр Иванов", years: "1806–1858" }],
      styles: [{ id: 10, name: "Академизм" }],
      height: "540",
      width: "750",
      depth: null,
      creat: "1837–1857",
      creat_f: "1837–1857",
      period: "XIX век",
      picture_thumb: [PIXEL],
      picture_big: [PIXEL],
      has_audio: true,
      audio_url: "https://example.com/audio-8395.ogg",
    },
    {
      id: 8396,
      name: "Утро в сосновом лесу",
      code: "zh-2",
      authors: [{ id: 2, name: "Иван Шишкин", years: "1832–1898" }],
      styles: [{ id: 11, name: "Реализм" }],
      height: "139",
      width: "213",
      depth: null,
      creat: "1889",
      creat_f: "1889",
      period: "XIX век",
      picture_thumb: [PIXEL],
      picture_big: [PIXEL],
      has_audio: false,
      audio_url: null,
    },
  ],
}

export const MOCK_DETAIL = {
  id: 8395,
  name: "Явление Христа народу",
  code: "zh-1",
  authors: [{ id: 1, name: "Александр Иванов", years: "1806–1858" }],
  styles: [{ id: 10, name: "Академизм" }],
  height: "540 см",
  width: "750 см",
  depth: null,
  creat: "1837–1857",
  creat_f: "1837–1857",
  period: "XIX век",
  picture_big: [PIXEL],
  picture_thumb: [PIXEL],
  has_audio: true,
  audio_url: "https://example.com/audio-8395.ogg",
  placement: "Зал 10",
  materials: [{ id: 20, name: "Холст" }],
  techniques: [{ id: 21, name: "Масло" }],
  facts: "Картина писалась более 20 лет.",
  description: "Главное произведение Александра Иванова.",
}

export const MOCK_FILTERS = {
  authors: [
    { id: 1, name: "Александр Иванов", years: "1806–1858" },
    { id: 2, name: "Иван Шишкин", years: "1832–1898" },
  ],
  styles: [
    { id: 10, name: "Академизм" },
    { id: 11, name: "Реализм" },
  ],
  materials: [{ id: 20, name: "Холст" }],
  techniques: [{ id: 21, name: "Масло" }],
  periods: ["XIX век"],
}

/** Моки повторяют реальные response shapes (§59). */
export async function mockCatalogApi(page: Page): Promise<void> {
  await page.route("**/api/v1/filters", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_FILTERS),
    }),
  )
  await page.route("**/api/v1/artworks/find*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_DETAIL),
    }),
  )
  await page.route(/\/api\/v1\/artworks\/\d+(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_DETAIL),
    }),
  )
  await page.route("**/api/v1/artworks?*", (route) => {
    const url = new URL(route.request().url())
    const q = (url.searchParams.get("q") ?? "").toLowerCase()
    const items = q
      ? MOCK_ARTWORKS.items.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.authors.some((au) => au.name.toLowerCase().includes(q)),
        )
      : MOCK_ARTWORKS.items
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...MOCK_ARTWORKS, total: items.length, items }),
    })
  })
}
