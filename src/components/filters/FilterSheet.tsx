import { useQuery } from "@tanstack/react-query"
import { ChevronDown, Search } from "lucide-react"
import { useState } from "react"

import type { ArtworkListParams } from "@/api/types"
import { getFilters } from "@/api/filters"
import { userMessageForError } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

interface FilterSheetProps {
  params: ArtworkListParams
  onApply: (next: ArtworkListParams) => void
  activeCount: number
}

interface FilterOption {
  /** Значение для query param (id ссылки или строка периода). */
  value: string
  label: string
  hint?: string | null
}

interface GroupDef {
  key: "author_id" | "style_id" | "material_id" | "technique_id" | "period"
  title: string
  options: FilterOption[]
}

function MultiGroup({
  title,
  options,
  selected,
  onToggle,
  groupKey,
  expanded,
  onToggleExpanded,
  search,
  onSearch,
}: {
  title: string
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
  groupKey: string
  expanded: boolean
  onToggleExpanded: () => void
  search: string
  onSearch: (value: string) => void
}) {
  const normalized = search.trim().toLowerCase()
  const visible =
    normalized.length === 0
      ? options
      : options.filter(
          (o) =>
            o.label.toLowerCase().includes(normalized) ||
            (o.hint ?? "").toLowerCase().includes(normalized),
        )
  const selectedCount = selected.length
  const searchId = `${groupKey}-search`
  if (options.length === 0) return null
  return (
    <div role="group" aria-label={title}>
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-label={`${title}${selectedCount > 0 ? `, выбрано: ${selectedCount}` : ""}`}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-left text-sm font-semibold hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span>
          {title}
          {selectedCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {selectedCount}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="space-y-1">
          {options.length > 10 && (
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id={searchId}
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={`Найти: ${title.toLowerCase()}`}
                aria-label={`Поиск по группе «${title}»`}
                type="search"
                className="pl-9"
              />
            </div>
          )}
          {visible.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted-foreground">Ничего не найдено.</p>
          ) : (
            visible.map((opt) => {
              const id = `${groupKey}-${opt.value}`
              const checked = selected.includes(opt.value)
              return (
                <label
                  key={opt.value}
                  htmlFor={id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 py-1 text-sm hover:bg-accent"
                >
                  <Checkbox id={id} checked={checked} onCheckedChange={() => onToggle(opt.value)} />
                  <span className="flex-1">
                    {opt.label}
                    {opt.hint && (
                      <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                    )}
                  </span>
                </label>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/** Группы сворачиваются, чтобы длинные списки (951 автор) не занимали весь экран. */
const COLLAPSE_THRESHOLD = 30

/** Фильтры через Sheet/Drawer (§17) с кнопками Сбросить/Применить. */
export function FilterSheet({ params, onApply, activeCount }: FilterSheetProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ArtworkListParams>(params)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [searches, setSearches] = useState<Record<string, string>>({})

  const filtersQuery = useQuery({
    queryKey: ["filters"],
    queryFn: ({ signal }) => getFilters(signal),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: open,
  })

  const openSheet = (o: boolean) => {
    if (o) setDraft(params)
    setOpen(o)
  }

  const toggleIn = (key: GroupDef["key"], value: string) => {
    setDraft((d) => {
      const list = [...(d[key] ?? [])]
      const i = list.indexOf(value)
      if (i >= 0) list.splice(i, 1)
      else list.push(value)
      return { ...d, [key]: list }
    })
  }

  const groups: GroupDef[] = [
    {
      key: "author_id",
      title: "Авторы",
      options: (filtersQuery.data?.authors ?? []).map((a) => ({
        value: String(a.id),
        label: a.name,
        hint: a.years,
      })),
    },
    {
      key: "style_id",
      title: "Стили",
      options: (filtersQuery.data?.styles ?? []).map((s) => ({
        value: String(s.id),
        label: s.name,
      })),
    },
    {
      key: "material_id",
      title: "Материалы",
      options: (filtersQuery.data?.materials ?? []).map((m) => ({
        value: String(m.id),
        label: m.name,
      })),
    },
    {
      key: "technique_id",
      title: "Техники",
      options: (filtersQuery.data?.techniques ?? []).map((t) => ({
        value: String(t.id),
        label: t.name,
      })),
    },
    {
      key: "period",
      title: "Период",
      options: (filtersQuery.data?.periods ?? []).map((p) => ({ value: p, label: p })),
    },
  ]

  return (
    <Sheet open={open} onOpenChange={openSheet}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Открыть фильтры${activeCount > 0 ? `, выбрано: ${activeCount}` : ""}`}
        >
          Фильтры{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[85svh] w-full max-w-2xl overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle>Фильтры</SheetTitle>
          <SheetDescription>Выберите параметры и нажмите «Применить».</SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[50svh] pr-4">
          {filtersQuery.isPending ? (
            <div className="space-y-2" role="status" aria-label="Загрузка фильтров">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : filtersQuery.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {userMessageForError(filtersQuery.error)}
            </p>
          ) : (
            <div className="space-y-4">
              {groups.map((g, i) => (
                <div key={g.key}>
                  {i > 0 && <Separator className="mb-4" />}
                  <MultiGroup
                    title={g.title}
                    options={g.options}
                    selected={draft[g.key] ?? []}
                    onToggle={(v) => toggleIn(g.key, v)}
                    groupKey={g.key}
                    expanded={expanded[g.key] ?? g.options.length <= COLLAPSE_THRESHOLD}
                    onToggleExpanded={() =>
                      setExpanded((e) => ({
                        ...e,
                        [g.key]: !(e[g.key] ?? g.options.length <= COLLAPSE_THRESHOLD),
                      }))
                    }
                    search={searches[g.key] ?? ""}
                    onSearch={(v) => setSearches((s) => ({ ...s, [g.key]: v }))}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <SheetFooter className="mt-4 flex-row justify-between gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() =>
              setDraft({
                ...draft,
                author_id: [],
                style_id: [],
                material_id: [],
                technique_id: [],
                period: [],
              })
            }
          >
            Сбросить
          </Button>
          <Button
            onClick={() => {
              onApply({ ...draft, page: 1 })
              setOpen(false)
            }}
          >
            Применить
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
