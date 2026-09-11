import { Home, QrCode, Search } from "lucide-react"
import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"

const ITEMS = [
  { to: "/", label: "Главная", icon: Home, end: true },
  { to: "/artworks", label: "Каталог", icon: Search, end: false },
  { to: "/scan", label: "QR", icon: QrCode, end: true },
]

/** Нижняя навигация mobile (§14). На desktop скрыта — там header. */
export function BottomNavigation() {
  return (
    <nav
      aria-label="Мобильная навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-3">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground",
                isActive && "text-foreground",
              )
            }
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
