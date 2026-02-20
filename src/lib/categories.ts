export interface CategoryInfo {
  name: string
  bg: string
  text: string
}

const STORAGE_KEY = "life-vc-categories"

const DEFAULTS: CategoryInfo[] = [
  { name: "深度工作", bg: "#a7f3d0", text: "#065f46" },
  { name: "浅层处理", bg: "#fde68a", text: "#92400e" },
  { name: "休息放松", bg: "#bae6fd", text: "#0369a1" },
  { name: "无意识摸鱼", bg: "#e2e8f0", text: "#475569" },
]

const COLOR_POOL: { bg: string; text: string }[] = [
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#f3e8ff", text: "#6b21a8" },
  { bg: "#fff7ed", text: "#9a3412" },
  { bg: "#ccfbf1", text: "#115e59" },
  { bg: "#fef9c3", text: "#854d0e" },
  { bg: "#e0e7ff", text: "#3730a3" },
  { bg: "#ffe4e6", text: "#9f1239" },
  { bg: "#d1fae5", text: "#064e3b" },
  { bg: "#dbeafe", text: "#1e3a8a" },
  { bg: "#fde68a", text: "#78350f" },
]

const FALLBACK = { bg: "#f1f5f9", text: "#475569" }

function load(): CategoryInfo[] {
  if (typeof window === "undefined") return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as CategoryInfo[]
    return parsed.length > 0 ? parsed : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function save(list: CategoryInfo[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getCategories(): CategoryInfo[] {
  return load()
}

export function getCategoryColor(name: string): { bg: string; text: string } {
  const list = load()
  const found = list.find((c) => c.name === name)
  if (found) return { bg: found.bg, text: found.text }
  return FALLBACK
}

export function addCategory(name: string): CategoryInfo[] {
  const list = load()
  if (list.some((c) => c.name === name)) return list

  const usedColors = new Set(list.map((c) => c.bg))
  const nextColor = COLOR_POOL.find((c) => !usedColors.has(c.bg)) ?? FALLBACK

  const updated = [...list, { name, ...nextColor }]
  save(updated)
  return updated
}

export function removeCategory(name: string): CategoryInfo[] {
  const list = load()
  const updated = list.filter((c) => c.name !== name)
  save(updated)
  return updated
}

export function updateCategoryColor(name: string, bg: string, text: string): CategoryInfo[] {
  const list = load()
  const updated = list.map((c) => (c.name === name ? { ...c, bg, text } : c))
  save(updated)
  return updated
}

export function getAllColors(): { bg: string; text: string }[] {
  const fromDefaults = DEFAULTS.map((c) => ({ bg: c.bg, text: c.text }))
  return [...fromDefaults, ...COLOR_POOL]
}
