"use client"

import type { TimeRecord } from "@/types"
import { CATEGORY_COLORS } from "@/lib/categoryColors"
import { cn } from "@/lib/utils"

const HOURS = 24
const MINUTES_PER_SLOT = 15
const SLOTS_PER_HOUR = 60 / MINUTES_PER_SLOT
const TOTAL_SLOTS = HOURS * SLOTS_PER_HOUR

function timeToSlot(h: number, m: number): number {
  return h * SLOTS_PER_HOUR + Math.floor(m / MINUTES_PER_SLOT)
}

function slotToPercent(slot: number): number {
  return (slot / TOTAL_SLOTS) * 100
}

interface DayTimeBlockProps {
  records: TimeRecord[]
  onRecordClick?: (r: TimeRecord) => void
}

function assignLanes(
  blocks: { startSlot: number; endSlot: number; record: TimeRecord }[]
): { lane: number; maxLanes: number }[] {
  const sorted = blocks.map((b, i) => ({ ...b, origIndex: i })).sort((a, b) => a.startSlot - b.startSlot)
  const laneEnds: number[] = []
  const laneByOrig: number[] = new Array(blocks.length)

  for (const b of sorted) {
    let lane = 0
    while (lane < laneEnds.length && laneEnds[lane] > b.startSlot) {
      lane++
    }
    if (lane === laneEnds.length) laneEnds.push(0)
    laneEnds[lane] = b.endSlot
    laneByOrig[b.origIndex] = lane
  }

  const maxLanes = laneEnds.length
  return blocks.map((_, i) => ({ lane: laneByOrig[i], maxLanes }))
}

export function DayTimeBlock({ records, onRecordClick }: DayTimeBlockProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground text-sm">
        该日暂无记录
      </div>
    )
  }

  const blocks = records.map((r) => {
    const start = new Date(r.startTime)
    const end = new Date(r.endTime)
    const startSlot = timeToSlot(start.getHours(), start.getMinutes())
    const endSlot = timeToSlot(end.getHours(), end.getMinutes())
    const top = slotToPercent(startSlot)
    const height = slotToPercent(Math.max(endSlot - startSlot, 1))
    const color = CATEGORY_COLORS[r.category]?.bg ?? "#94a3b8"
    return { record: r, startSlot, endSlot, top, height, color }
  })

  const laneInfo = assignLanes(blocks)

  return (
    <div className="relative rounded-xl border border-border overflow-hidden bg-muted/30 min-h-[320px]">
      {/* 时间刻度 */}
      <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col text-xs text-muted-foreground bg-background/50 border-r border-border z-10">
        {Array.from({ length: HOURS }).map((_, i) => (
          <div
            key={i}
            className="flex-1 flex items-start justify-end pr-2 pt-0.5"
            style={{ minHeight: `${100 / HOURS}%` }}
          >
            {i > 0 && `${i}:00`}
          </div>
        ))}
      </div>
      {/* 时间块 - 分车道避免重叠 */}
      <div className="ml-12 relative" style={{ minHeight: 480 }}>
        {blocks.map((b, i) => {
          const { lane, maxLanes } = laneInfo[i]
          const gap = 2
          const widthPercent = (100 - gap * (maxLanes - 1)) / maxLanes
          const leftPercent = lane * (widthPercent + gap)
          return (
            <button
              key={b.record.id}
              type="button"
              onClick={() => onRecordClick?.(b.record)}
              className={cn(
                "absolute rounded-lg px-2 py-1 text-left text-xs font-medium truncate transition-opacity hover:opacity-90",
                "border border-black/5"
              )}
              style={{
                top: `${b.top}%`,
                height: `${Math.max(b.height, 2)}%`,
                left: `calc(${leftPercent}% + 4px)`,
                width: `calc(${widthPercent}% - 8px)`,
                backgroundColor: b.color,
              }}
              title={`${b.record.taskName} · ${b.record.category}`}
            >
              {b.record.taskName}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface WeekTimeBlockProps {
  weekRecords: Record<string, TimeRecord[]>
  weekStart: Date
  onRecordClick?: (r: TimeRecord) => void
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

export function WeekTimeBlock({ weekRecords, weekStart, onRecordClick }: WeekTimeBlockProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="grid grid-cols-7 gap-1 p-2 bg-muted/30">
        {days.map((d) => {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          const records = weekRecords[key] ?? []
          const isToday =
            key ===
            `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`

          return (
            <div
              key={key}
              className={cn(
                "flex flex-col rounded-lg p-2 min-h-[200px]",
                isToday && "ring-2 ring-primary bg-primary/5"
              )}
            >
              <div className="text-center text-xs font-medium mb-2 shrink-0">
                <div className="text-muted-foreground">{WEEKDAY_LABELS[d.getDay()]}</div>
                <div className={isToday ? "text-primary font-semibold" : ""}>
                  {d.getDate()}
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {records.length === 0 ? (
                  <div className="text-xs text-muted-foreground/60 text-center py-4">
                    -
                  </div>
                ) : (
                  records.map((r) => {
                    const color = CATEGORY_COLORS[r.category]?.bg ?? "#94a3b8"
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onRecordClick?.(r)}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] truncate text-left hover:opacity-90",
                          "border border-black/5"
                        )}
                        style={{ backgroundColor: color }}
                        title={`${r.taskName} · ${r.category}`}
                      >
                        {r.taskName}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
