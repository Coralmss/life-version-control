"use client"

import type { TimeRecord } from "@/types"

// 同步获取默认颜色
function getDefaultColor(category: string): string {
  if (category === "未设置") return "#f1f5f9"
  const defaults: Record<string, string> = {
    "深度工作": "#a7f3d0",
    "浅层处理": "#fde68a",
    "休息放松": "#bae6fd",
    "无意识摸鱼": "#e2e8f0",
  }
  return defaults[category] ?? "#94a3b8"
}

function aggregateByCategory(records: TimeRecord[]): Record<string, number> {
  const by: Record<string, number> = {}
  let totalRecorded = 0
  for (const r of records) {
    const h = r.duration / 3600
    by[r.category] = (by[r.category] ?? 0) + h
    totalRecorded += h
  }
  const unset = Math.max(0, 24 - totalRecorded)
  if (unset > 0) by["未设置"] = unset
  return by
}

function formatHours(h: number): string {
  if (h >= 1) return `${h.toFixed(1)}h`
  const m = Math.round(h * 60)
  return m > 0 ? `${m}min` : "0"
}

function getBarColor(cat: string): string {
  return getDefaultColor(cat)
}

interface TimeSpendChartProps {
  viewMode: "day" | "week"
  dayRecords: TimeRecord[]
  weekRecords: Record<string, TimeRecord[]>
  weekStart: Date
  getDateKey: (d: Date) => string
}

export function TimeSpendChart({
  viewMode,
  dayRecords,
  weekRecords,
  weekStart,
  getDateKey,
}: TimeSpendChartProps) {
  if (viewMode === "day") {
    const by = aggregateByCategory(dayRecords)
    const totalRecorded = dayRecords.reduce((s, r) => s + r.duration / 3600, 0)
    const cats = Object.keys(by).sort((a, b) => {
      if (a === "未设置") return 1
      if (b === "未设置") return -1
      return (by[b] ?? 0) - (by[a] ?? 0)
    })

    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          时间花费（小时）
        </h3>
        <div className="space-y-2.5">
          {cats.map((cat) => {
            const h = by[cat] ?? 0
            const pct = (h / 24) * 100
            const color = getBarColor(cat)
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-[0.8rem] text-muted-foreground min-w-[80px] truncate">
                  {cat}
                </span>
                <div className="flex-1 max-w-[220px] h-7 bg-muted rounded-lg overflow-hidden flex">
                  <div
                    className="h-full flex items-center justify-between px-2.5 text-xs font-medium transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: color,
                    }}
                  >
                    {h > 0 && <span>{formatHours(h)}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {totalRecorded > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            已记录 {formatHours(totalRecorded)} / 24h
          </p>
        )}
      </div>
    )
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        时间花费（小时）
      </h3>
      <div className="flex items-end gap-1.5 min-h-[100px]">
        {days.map((d) => {
          const key = getDateKey(d)
          const records = weekRecords[key] ?? []
          const by = aggregateByCategory(records)
          const totalRecorded = records.reduce((s, r) => s + r.duration / 3600, 0)

          const segments = Object.keys(by).filter((c) => (by[c] ?? 0) > 0)
          if (segments.length === 0) {
            return (
              <div key={key} className="flex-1 flex flex-col items-center min-w-0">
                <div className="w-full max-w-[44px] h-[90px] rounded-md bg-muted/50 border border-dashed border-border" />
                <span className="text-[0.65rem] text-muted-foreground mt-1.5">
                  {d.getMonth() + 1}/{d.getDate()}
                </span>
                <span className="text-[0.6rem] text-muted-foreground">0h</span>
              </div>
            )
          }

          return (
            <div key={key} className="flex-1 flex flex-col items-center min-w-0">
              <div className="w-full max-w-[44px] h-[90px] flex flex-col-reverse rounded-md overflow-hidden">
                {segments.map((cat) => {
                  const h = by[cat] ?? 0
                  const flexVal = Math.max(h, 0.05)
                  const color = getBarColor(cat)
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-center min-h-[12px] px-1 py-0.5 text-[9px] font-semibold"
                      style={{ flex: flexVal, backgroundColor: color }}
                    >
                      {h >= 0.05 ? formatHours(h) : ""}
                    </div>
                  )
                })}
              </div>
              <span className="text-[0.65rem] text-muted-foreground mt-1.5">
                {d.getMonth() + 1}/{d.getDate()}
              </span>
              <span className="text-[0.6rem] text-muted-foreground">
                {formatHours(totalRecorded)}h
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
