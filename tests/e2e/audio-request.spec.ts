import { expect, test, type Page } from "@playwright/test"

import { MOCK_DETAIL } from "./mocks"

const DETAIL_RE = /\/api\/v1\/artworks\/\d+(\?.*)?$/
const AIDAR_URL = "https://example.com/audio-8395-aidar.ogg"

function mockDetail(audioUrl: string | null, hasAudio = true) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ...MOCK_DETAIL, audio_url: audioUrl, has_audio: hasAudio }),
  }
}
/** Как живой backend: без with_audio=true аудио нет, с флагом — есть (для своего голоса). */
async function mockVoiceAware(page: Page, hasAudio = true) {
  await page.route(DETAIL_RE, (route) => {
    const url = new URL(route.request().url())
    if (url.searchParams.get("with_audio") !== "true") {
      return route.fulfill(mockDetail(null, hasAudio))
    }
    const voice = url.searchParams.get("speaker") === "aidar" ? AIDAR_URL : MOCK_DETAIL.audio_url
    return route.fulfill(mockDetail(voice, true))
  })
}

test("Загрузить аудио: кнопка → refetch with_audio=true → плеер", async ({ page }) => {
  // Кнопка видна, даже если backend вернул has_audio=false: генерация всё равно возможна.
  await mockVoiceAware(page, false)

  await page.goto("/artworks/8395")
  await expect(page.getByRole("heading", { name: "Явление Христа народу" })).toBeVisible()

  const loadButton = page.getByRole("button", { name: /загрузить аудио/i })
  await expect(loadButton).toBeVisible()
  await loadButton.click()

  const region = page.getByRole("region", { name: "Аудиогид" })
  await expect(region).toBeVisible()
  await expect(region.getByRole("button", { name: /слушать аудиогид/i })).toBeVisible()
})

test("Смена голоса после загрузки: перезапрос с новым speaker и with_audio=true", async ({
  page,
}) => {
  await mockVoiceAware(page)

  await page.goto("/artworks/8395")
  await expect(page.getByRole("heading", { name: "Явление Христа народу" })).toBeVisible()
  await page.getByRole("button", { name: /загрузить аудио/i }).click()
  await expect(page.getByRole("region", { name: "Аудиогид" })).toBeVisible()

  const aidarRequest = page.waitForResponse(
    (r) =>
      r.url().includes("/api/v1/artworks/8395") &&
      r.url().includes("speaker=aidar") &&
      r.url().includes("with_audio=true"),
  )
  await page.getByRole("combobox", { name: /голос аудиогида/i }).click()
  await page.getByRole("option", { name: "Айдар" }).click()
  await aidarRequest
})

test("Смена голоса во время прослушивания: старый спикер останавливается", async ({ page }) => {
  await page.addInitScript(() => {
    const proto = window.HTMLMediaElement.prototype
    Object.defineProperty(proto, "paused", {
      get(this: HTMLMediaElement) {
        return (this as unknown as { __paused: boolean }).__paused !== false
      },
      configurable: true,
    })
    proto.play = function (this: HTMLMediaElement) {
      ;(this as unknown as { __paused: boolean }).__paused = false
      this.dispatchEvent(new Event("play"))
      this.dispatchEvent(new Event("playing"))
      return Promise.resolve()
    } as typeof proto.play
  })
  await mockVoiceAware(page)

  await page.goto("/artworks/8395")
  await expect(page.getByRole("heading", { name: "Явление Христа народу" })).toBeVisible()
  await page.getByRole("button", { name: /загрузить аудио/i }).click()
  const region = page.getByRole("region", { name: "Аудиогид" })
  await expect(region).toBeVisible()
  await region.getByRole("button", { name: /слушать аудиогид/i }).click()
  await expect(region.getByRole("button", { name: /пауза/i })).toBeVisible()

  // Меняем голос — трек подменяется без автоплея, слышно тишину, а не старый голос.
  await page.getByRole("combobox", { name: /голос аудиогида/i }).click()
  await page.getByRole("option", { name: "Айдар" }).click()
  await expect(region.getByRole("button", { name: /продолжить воспроизведение/i })).toBeVisible({
    timeout: 10000,
  })
  await expect(region.getByRole("button", { name: /пауза/i })).toHaveCount(0)
})
