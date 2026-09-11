import { createBrowserRouter } from "react-router-dom"

import { RootLayout } from "@/app/layout"
import { ArtworkDetailPage } from "@/pages/ArtworkDetailPage"
import { ArtworkListPage } from "@/pages/ArtworkListPage"
import { HomePage } from "@/pages/HomePage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { QRScannerPage } from "@/pages/QRScannerPage"

/** Маршруты (§12): / • /artworks • /artworks/:id • /scan. Поиск — часть /artworks (?q=). */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "artworks", element: <ArtworkListPage /> },
      { path: "artworks/:id", element: <ArtworkDetailPage /> },
      { path: "scan", element: <QRScannerPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
