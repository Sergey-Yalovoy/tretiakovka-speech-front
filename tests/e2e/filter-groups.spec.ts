import { expect, test } from "@playwright/test"

import { MOCK_FILTERS, mockCatalogApi } from "./mocks"

test.beforeEach(async ({ page }) => {
  await mockCatalogApi(page)
})

test("Фильтры сворачиваются и ищутся: 40 авторов → collapsed → expand → поиск", async ({
  page,
}) => {
  const authors = Array.from({ length: 40 }, (_, i) => ({
    id: 1000 + i,
    name: `Тестовый Автор ${i + 1}`,
    years: null as string | null,
  }))
  await page.route("**/api/v1/filters", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...MOCK_FILTERS, authors }),
    }),
  )

  await page.goto("/artworks")
  await expect(page.getByText("Явление Христа народу").first()).toBeVisible()
  await page.getByRole("button", { name: /открыть фильтры/i }).click()
  const dialog = page.getByRole("dialog")

  // Большая группа по умолчанию свернута.
  await expect(dialog.getByText("Тестовый Автор 1", { exact: true })).toHaveCount(0)
  await dialog.getByRole("button", { name: /авторы/i }).click()
  await expect(dialog.getByText("Тестовый Автор 1", { exact: true })).toBeVisible()

  // Поиск внутри группы.
  await dialog.getByLabel(/поиск по группе «авторы»/i).fill("Автор 2")
  await expect(dialog.getByText("Тестовый Автор 1", { exact: true })).toHaveCount(0)
  await expect(dialog.getByText("Тестовый Автор 2", { exact: true })).toBeVisible()

  // Выбор отфильтрованного значения применяется.
  await dialog.getByText("Тестовый Автор 2", { exact: true }).click()
  await page.getByRole("button", { name: /применить/i }).click()
  await expect(page).toHaveURL(/author_id=1001/)
})
