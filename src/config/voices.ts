import type { SpeakerId } from "@/api/types"

/** Маппинг голосов backend → понятные названия (§51–§52). */
export const SPEAKERS: ReadonlyArray<{ id: SpeakerId; label: string }> = [
  { id: "baya", label: "Бая" },
  { id: "aidar", label: "Айдар" },
  { id: "kseniya", label: "Ксения" },
  { id: "xenia", label: "Ксения (2)" },
  { id: "eugene", label: "Евгений" },
]

export const DEFAULT_SPEAKER: SpeakerId = "baya"

export function speakerLabel(id: string): string {
  return SPEAKERS.find((s) => s.id === id)?.label ?? id
}
