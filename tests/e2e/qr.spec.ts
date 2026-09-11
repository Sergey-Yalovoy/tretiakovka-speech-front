import { expect, test } from "@playwright/test"

import { mockCatalogApi } from "./mocks"

test.beforeEach(async ({ page }) => {
  await mockCatalogApi(page)
})

test("Test 5 — QR: результат сканера → API → navigate в detail (без камеры)", async ({ page }) => {
  await page.goto("/scan")
  await expect(page.getByText(/разрешите доступ к камере/i)).toBeVisible()

  // Камера в CI недоступна — используем ручной ввод URL (§28 fallback).
  await page
    .getByLabel(/вставить ссылку с qr-кода вручную/i)
    .fill("https://my.tretyakov.ru/app/masterpiece/8395")
  await page.getByRole("button", { name: /открыть/i }).click()

  await expect(page).toHaveURL("/artworks/8395")
  await expect(page.getByRole("heading", { name: "Явление Христа народу" })).toBeVisible()
})

test("Test 5b — QR: неподдерживаемый код показывает ошибку", async ({ page }) => {
  await page.goto("/scan")
  await page.getByLabel(/вставить ссылку с qr-кода вручную/i).fill("not-a-tretyakov-qr")
  await page.getByRole("button", { name: /открыть/i }).click()
  await expect(page.getByText(/не содержит ссылки на произведение/i)).toBeVisible()
})
