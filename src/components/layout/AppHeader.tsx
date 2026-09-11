import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, NavLink } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV = [
  { to: "/", label: "Главная", end: true },
  { to: "/artworks", label: "Каталог", end: false },
  { to: "/scan", label: "Сканировать QR", end: true },
]
function useTheme(): { dark: boolean; toggle: () => void } {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false
    try {
      const saved = localStorage.getItem("tretyakov-theme")
      if (saved === "dark") return true
      if (saved === "light") return false
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    } catch {
      return document.documentElement.classList.contains("dark")
    }
  })
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    try {
      localStorage.setItem("tretyakov-theme", dark ? "dark" : "light")
    } catch {
      /* ignore */
    }
  }, [dark])
  return { dark, toggle: () => setDark((v) => !v) }
}
export function AppHeader() {
  const { dark, toggle } = useTheme()
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-2 px-4">
        <Link
          to="/"
          className="text-base font-semibold tracking-tight"
          aria-label="Tretyakov Audio — на главную"
        >
          Tretyakov&nbsp;Audio
        </Link>
        <nav aria-label="Основная навигация" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
        >
          {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </Button>
      </div>
    </header>
  )
}
