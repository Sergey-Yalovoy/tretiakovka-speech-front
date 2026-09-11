import { expect, test } from "@playwright/test"

import { mockCatalogApi } from "./mocks"

test.beforeEach(async ({ page }) => {
  await mockCatalogApi(page)
})

test("Test 1 — каталог: главная → каталог → список картин", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Tretyakov Audio" })).toBeVisible()
  await page.getByRole("link", { name: /все произведения/i }).click()
  await expect(page).toHaveURL(/\/artworks/)
  await expect(page.getByText("Явление Христа народу").first()).toBeVisible()
  await expect(page.getByText("Утро в сосновом лесу").first()).toBeVisible()
})

test("Test 3 — поиск: ввод запроса → ожидание API → результаты", async ({ page }) => {
  await page.goto("/artworks")
  await expect(page.getByText("Явление Христа народу").first()).toBeVisible()

  const search = page.getByRole("searchbox", { name: /найти картину/i })
  await search.fill("Шишкин")
  await expect(page.getByText("Утро в сосновом лесу").first()).toBeVisible()
  await expect(page.getByText("Явление Христа народу")).toHaveCount(0)
})

test("Test 4 — фильтр: открыть → выбрать → применить → результат", async ({ page }) => {
  await page.goto("/artworks")
  await expect(page.getByText("Явление Христа народу").first()).toBeVisible()

  await page.getByRole("button", { name: /открыть фильтры/i }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByText("Александр Иванов")).toBeVisible()
  await dialog.getByText("Александр Иванов").click()
  // Backend принимает только повторяющиеся параметры без скобок: ?author_id=1&author_id=2
  const apiRequest = page.waitForRequest((r) => r.url().includes("/api/v1/artworks?"))
  await page.getByRole("button", { name: /применить/i }).click()

  await expect(page).toHaveURL(/author_id=/)
  await expect(page.getByRole("button", { name: /выбрано: 1/i })).toBeVisible()
  const apiUrl = (await apiRequest).url()
  expect(apiUrl).toContain("author_id=1")
  expect(apiUrl).not.toContain("%5B")
  expect(apiUrl).not.toContain("%5D")
})
