import { getCategoryColor } from "@/lib/categories"

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = new Proxy(
  {} as Record<string, { bg: string; text: string }>,
  {
    get(_target, prop: string) {
      return getCategoryColor(prop)
    },
  }
)

export const UNSET_COLOR = { bg: "#f1f5f9", text: "#94a3b8" }
