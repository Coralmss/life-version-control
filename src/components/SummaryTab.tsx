"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRecordsByDate, getRecordsForWeek, getDateKey } from "@/lib/supabaseStorage"
import type { TimeRecord } from "@/types"
import { DateSelector, type ViewMode } from "@/components/DateSelector"
import { CalendarGrid } from "@/components/CalendarGrid"
import { PieChart, type PieSlice } from "@/components/PieChart"
import { TimeSpendChart } from "@/components/TimeSpendChart"
import { ManualTimeEntry } from "@/components/ManualTimeEntry"
import { cn } from "@/lib/utils"

const SECONDS_PER_DAY = 24 * 60 * 60

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":")
}

function getWeekStart(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function computePieSlices(
  records: TimeRecord[],
  totalSeconds: number
): { slices: PieSlice[]; totalRecorded: number } {
  const byCategory: Record<string, number> = {}
  let totalRecorded = 0
  for (const r of records) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + r.duration
    totalRecorded += r.duration
  }

  const unrecorded = Math.max(0, totalSeconds - totalRecorded)
  if (unrecorded > 0) {
    byCategory["未设置"] = unrecorded
  }

  const slices: PieSlice[] = Object.entries(byCategory).map(([category, duration]) => ({
    category: category as PieSlice["category"],
    duration,
    percent: (duration / totalSeconds) * 100,
  }))

  return { slices, totalRecorded }
}

export function SummaryTab() {
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("day")
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [manualEntryOpen, setManualEntryOpen] = useState(false)
  const [dayRecords, setDayRecords] = useState<TimeRecord[]>([])
  const [weekRecords, setWeekRecords] = useState<Record<string, TimeRecord[]>>({})
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 加载数据
  useEffect(() => {
    if (!mounted) return
    const loadData = async () => {
      setLoading(true)
      try {
        const key = getDateKey(selectedDate)
        const dayData = await getRecordsByDate(key)
        setDayRecords(dayData)

        const weekStart = getWeekStart(selectedDate)
        const weekData = await getRecordsForWeek(weekStart)
        setWeekRecords(weekData)
      } catch (e) {
        console.error("Failed to load summary data:", e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [mounted, selectedDate, refreshKey])

  const recordsForPie = useMemo(() => {
    if (viewMode === "day") return dayRecords
    const weekStart = getWeekStart(selectedDate)
    const all: TimeRecord[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      all.push(...(weekRecords[getDateKey(d)] ?? []))
    }
    return all
  }, [viewMode, selectedDate, dayRecords, weekRecords])

  const totalSeconds = viewMode === "day" ? SECONDS_PER_DAY : SECONDS_PER_DAY * 7
  const { slices, totalRecorded } = useMemo(
    () => computePieSlices(recordsForPie, totalSeconds),
    [recordsForPie, totalSeconds]
  )

  const refreshRecords = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate])

  const calendarColumns = useMemo(() => {
    if (viewMode === "day") {
      return [{ date: selectedDate, records: dayRecords }]
    }
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return {
        date: d,
        records: weekRecords[getDateKey(d)] ?? [],
      }
    })
  }, [viewMode, selectedDate, weekStart, dayRecords, weekRecords])

  return (
    <div className="space-y-6">
      <DateSelector
        viewMode={viewMode}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* 日/周 切换 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setViewMode("day")}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
            viewMode === "day"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          日
        </button>
        <button
          type="button"
          onClick={() => setViewMode("week")}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
            viewMode === "week"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          周
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">加载中...</p>
        </div>
      ) : (
        <>
          {/* 1. 饼图 */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              时间占比（{viewMode === "day" ? "24h" : "本周"}）
            </h3>
            <PieChart
              slices={slices}
              totalDuration={totalSeconds}
              className="w-[200px]"
            />
            {totalRecorded > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                已记录 {formatDuration(totalRecorded)}
                {viewMode === "day" ? " / 24h" : ""}
              </p>
            )}
          </div>

          {/* 2. 时间花费（小时）- 日=横向条，周=堆叠柱 */}
          <TimeSpendChart
            viewMode={viewMode}
            dayRecords={dayRecords}
            weekRecords={weekRecords}
            weekStart={weekStart}
            getDateKey={getDateKey}
          />

          {/* 3. 时间块（仅日视图） */}
          {viewMode === "day" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">时间块</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManualEntryOpen(true)}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  手动添加
                </Button>
              </div>
              <CalendarGrid columns={calendarColumns} />
            </div>
          )}
        </>
      )}

      <ManualTimeEntry
        open={manualEntryOpen}
        onOpenChange={setManualEntryOpen}
        defaultDate={selectedDate}
        onSaved={refreshRecords}
      />
    </div>
  )
}
