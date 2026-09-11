import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-4xl font-bold">404</p>
      <p className="text-base font-medium">Страница не найдена</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Возможно, ссылка устарела или введена с ошибкой.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/">На главную</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/artworks">В каталог</Link>
        </Button>
      </div>
    </div>
  )
}
