import type { ArtworkListItem } from "@/api/types"
import { ArtworkCard } from "@/components/artwork/ArtworkCard"

/** Сетка каталога (§40): 1 → 2 → 4 колонки. */
export function ArtworkGrid({ items }: { items: ArtworkListItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((a) => (
        <li key={a.id}>
          <ArtworkCard artwork={a} />
        </li>
      ))}
    </ul>
  )
}
