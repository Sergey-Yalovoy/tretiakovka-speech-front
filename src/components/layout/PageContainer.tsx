import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function PageContainer({
  children,
  className,
  narrow = false,
}: {
  children: ReactNode
  className?: string
  narrow?: boolean
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pb-28 md:pb-12",
        narrow ? "max-w-3xl" : "max-w-[1200px]",
        className,
      )}
    >
      {children}
    </div>
  )
}
