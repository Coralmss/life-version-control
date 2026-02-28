"use client"

import type { TimeRecord } from "@/types"
import { CATEGORY_COLORS } from "@/lib/categoryColors"
import { getDateKey } from "@/lib/storage"
import { cn } from "@/lib/utils"

const DEFAULT_HOURS = 15
const DEFAULT_START_HOUR = 8
const SLOT_HEIGHT = 28

function getWeekStart(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function computeWeekRange(weekRecords: Record<string, TimeRecord[]>): { startHour: number; hours: number } {
  let earliestHour = 24
  let latestHour = 0
  let hasRecords = false

  for (const records of Object.values(weekRecords)) {
    for (const r of records) {
      hasRecords = true
      const s = new Date(r.startTime)
      const e = new Date(r.endTime)
      earliestHour = Math.min(earliestHour, s.getHours())
      const eH = e.getHours()
      const eM = e.getMinutes()
      latestHour = Math.max(latestHour, eM > 0 ? eH + 1 : eH)
    }
  }

  if (!hasRecords) {
    return { startHour: DEFAULT_START_HOUR, hours: DEFAULT_HOURS }
  }

  const startHour = Math.max(0, Math.min(earliestHour, DEFAULT_START_HOUR))
  const endHour = Math.min(24, Math.max(latestHour, DEFAULT_START_HOUR + DEFAULT_HOURS))
  return { startHour, hours: endHour - startHour }
}

interface WeekCalendarGridProps {
  weekRecords: Record<string, TimeRecord[]>
  weekStart: Date
}

export function WeekCalendarGrid({ weekRecords, weekStart }: WeekCalendarGridProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const { startHour, hours } = computeWeekRange(weekRecords)
  const totalHeight = hours * SLOT_HEIGHT

  const renderBlocks = (dateKey: string) => {
    const records = weekRecords[dateKey] ?? []
    return records.map((r) => {
      const start = new Date(r.startTime)
      const end = new Date(r.endTime)
      const startMinutes = start.getHours() * 60 + start.getMinutes()
      const endMinutes = end.getHours() * 60 + end.getMinutes()
      const top = ((startMinutes - startHour * 60) / 60) * SLOT_HEIGHT
      const height = ((endMinutes - startMinutes) / 60) * SLOT_HEIGHT
      const color = CATEGORY_COLORS[r.category]?.bg ?? "#94a3b8"
      if (top < 0 || top + height > totalHeight) return null
      return (
        <div
          key={r.id}
          className="absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-[10px] truncate border-l-2 border-black/10"
          style={{
            top: `${top}px`,
            height: `${Math.max(height, 16)}px`,
            backgroundColor: color,
          }}
          title={`${r.taskName} · ${r.category}`}
        >
          {r.taskName}
        </div>
      )
    })
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[500px] flex">
          <div className="w-10 shrink-0 bg-muted/50 border-r border-border flex flex-col">
            <div className="h-10 shrink-0" />
            {Array.from({ length: hours }).map((_, i) => (
              <div
                key={i}
                className="flex items-start justify-end pr-1.5 pt-0.5 text-[10px] text-muted-foreground"
                style={{ height: SLOT_HEIGHT }}
              >
                {startHour + i}:00
              </div>
            ))}
          </div>
          {days.map((d) => {
            const key = getDateKey(d)
            const isToday =
              key === getDateKey(new Date())
            return (
              <div
                key={key}
                className={cn(
                  "flex-1 min-w-[60px] relative border-r border-border last:border-r-0",
                  isToday && "bg-primary/5"
                )}
              >
                <div
                  className={cn(
                    "h-10 shrink-0 flex flex-col items-center justify-center border-b border-border text-xs font-medium",
                    isToday && "text-primary"
                  )}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {["日", "一", "二", "三", "四", "五", "六"][d.getDay()]}
                  </span>
                  <span>{d.getDate()}</span>
                </div>
                <div
                  className="relative"
                  style={{ height: totalHeight }}
                >
                  {renderBlocks(key)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

