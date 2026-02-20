import type { TimeRecord } from "@/types"

const STORAGE_KEY = "life-version-control-records"

export function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function getAllRecords(): Record<string, TimeRecord[]> {
  if (typeof window === "undefined") return {}
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function sortByStartTime(records: TimeRecord[]): TimeRecord[] {
  return [...records].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
}

export function getTodayRecords(): TimeRecord[] {
  const today = getDateKey(new Date())
  return getRecordsByDate(today)
}

export function getRecordsByDate(dateStr: string): TimeRecord[] {
  const all = getAllRecords()
  return sortByStartTime(all[dateStr] ?? [])
}

export function getRecordsForWeek(weekStart: Date): Record<string, TimeRecord[]> {
  const result: Record<string, TimeRecord[]> = {}
  const all = getAllRecords()
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const key = getDateKey(d)
    result[key] = sortByStartTime(all[key] ?? [])
  }
  return result
}

export function getRecordsByDateRange(startStr: string, endStr: string): TimeRecord[] {
  const all = getAllRecords()
  const result: TimeRecord[] = []
  const start = new Date(startStr)
  const end = new Date(endStr)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = getDateKey(d)
    result.push(...(all[key] ?? []))
  }
  return sortByStartTime(result)
}

export function saveRecord(record: TimeRecord): void {
  if (typeof window === "undefined") return
  try {
    const all = getAllRecords()
    const dateKey = getDateKey(new Date(record.startTime))
    const dayRecords = all[dateKey] ?? []
    dayRecords.unshift(record)
    all[dateKey] = dayRecords
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch (e) {
    console.error("Failed to save record:", e)
  }
}

export function deleteRecord(dateStr: string, recordId: string): void {
  if (typeof window === "undefined") return
  try {
    const all = getAllRecords()
    const dayRecords = all[dateStr] ?? []
    all[dateStr] = dayRecords.filter((r) => r.id !== recordId)
    if (all[dateStr].length === 0) delete all[dateStr]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch (e) {
    console.error("Failed to delete record:", e)
  }
}

export function updateRecord(oldDateStr: string, record: TimeRecord): void {
  if (typeof window === "undefined") return
  try {
    const all = getAllRecords()
    const newDateStr = getDateKey(new Date(record.startTime))

    // Remove from old date
    const oldDayRecords = all[oldDateStr] ?? []
    all[oldDateStr] = oldDayRecords.filter((r) => r.id !== record.id)
    if (all[oldDateStr].length === 0) delete all[oldDateStr]

    // Add to new date
    const newDayRecords = all[newDateStr] ?? []
    newDayRecords.push(record)
    all[newDateStr] = newDayRecords

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch (e) {
    console.error("Failed to update record:", e)
  }
}
