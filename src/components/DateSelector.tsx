"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalendarPicker } from "@/components/CalendarPicker"
import { cn } from "@/lib/utils"

export type ViewMode = "day" | "week"

function getWeekStart(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

interface DateSelectorProps {
  viewMode: ViewMode
  selectedDate: Date
  onDateChange: (d: Date) => void
}

function formatDayLabel(d: Date) {
  const m = d.getMonth() + 1
  const day = d.getDate()
  const w = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()]
  return `${m}月${day}日 周${w}`
}

function formatWeekLabel(start: Date) {
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
}

function isToday(d: Date) {
  const t = new Date()
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  )
}

export function DateSelector({
  viewMode,
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCalendarOpen(false)
      }
    }
    if (calendarOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [calendarOpen])

  const goPrev = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() - (viewMode === "week" ? 7 : 1))
    onDateChange(next)
  }

  const goNext = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + (viewMode === "week" ? 7 : 1))
    onDateChange(next)
  }

  const goToday = () => {
    onDateChange(new Date())
    setCalendarOpen(false)
  }

  const label =
    viewMode === "day"
      ? formatDayLabel(selectedDate)
      : formatWeekLabel(getWeekStart(selectedDate))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={goPrev} className="h-9 w-9 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goNext} className="h-9 w-9 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 text-center relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setCalendarOpen(!calendarOpen)}
            className={cn(
              "inline-flex items-center gap-2 font-medium text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            )}
          >
            <Calendar className="h-4 w-4" />
            {label}
          </button>
          {calendarOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-background border rounded-xl shadow-lg mx-auto w-[280px]">
              <CalendarPicker
                selectedDate={selectedDate}
                onSelect={onDateChange}
                onClose={() => setCalendarOpen(false)}
              />
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToday}
          className={cn(
            "text-xs",
            viewMode === "day" && isToday(selectedDate) && "bg-primary/10"
          )}
        >
          今天
        </Button>
      </div>
    </div>
  )
}
