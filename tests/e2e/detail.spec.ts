import { expect, test } from "@playwright/test"

import { mockCatalogApi } from "./mocks"

test.beforeEach(async ({ page }) => {
  await mockCatalogApi(page)
})

test("Test 2 — detail: название, изображение, аудиоплеер", async ({ page }) => {
  await page.goto("/artworks/8395")
  await expect(page.getByRole("heading", { name: "Явление Христа народу" })).toBeVisible()
  await expect(page.getByRole("img", { name: "Явление Христа народу" })).toBeVisible()
  await expect(page.getByRole("region", { name: "Аудиогид" })).toBeVisible()
  await expect(page.getByRole("button", { name: /слушать аудиогид/i })).toBeVisible()
  await expect(page.getByText("Главное произведение Александра Иванова.")).toBeVisible()
})
