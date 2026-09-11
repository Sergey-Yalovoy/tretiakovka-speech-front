import { expect, test } from "@playwright/test"

import { mockCatalogApi } from "./mocks"

test.beforeEach(async ({ page }) => {
  await mockCatalogApi(page)
  // Детерминированный <audio>: play() резолвится и переводит элемент в "playing".
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
    const origPause = proto.pause
    proto.pause = function (this: HTMLMediaElement) {
      ;(this as unknown as { __paused: boolean }).__paused = true
      origPause.call(this)
    }
  })
})

test("Test 6 — audio: Play меняет состояние плеера", async ({ page }) => {
  await page.goto("/artworks/8395")
  const region = page.getByRole("region", { name: "Аудиогид" })
  await expect(region).toBeVisible()

  await region.getByRole("button", { name: /слушать аудиогид/i }).click()
  await expect(region.getByRole("button", { name: /пауза/i })).toBeVisible()

  // Mini-player появляется после запуска аудио (§25).
  await expect(page.getByRole("region", { name: "Мини-плеер" })).toBeVisible()
})
