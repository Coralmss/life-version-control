"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarPickerProps {
  selectedDate: Date
  onSelect: (d: Date) => void
  onClose?: () => void
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"]

export function CalendarPicker({ selectedDate, onSelect, onClose }: CalendarPickerProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selectedDate)
    d.setDate(1)
    return d
  })

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const prevMonth = () => {
    setViewMonth((d) => {
      const next = new Date(d)
      next.setMonth(next.getMonth() - 1)
      return next
    })
  }

  const nextMonth = () => {
    setViewMonth((d) => {
      const next = new Date(d)
      next.setMonth(next.getMonth() + 1)
      return next
    })
  }

  const isSelected = (day: number) => {
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    )
  }

  const isToday = (day: number) => {
    const t = new Date()
    return (
      t.getFullYear() === year &&
      t.getMonth() === month &&
      t.getDate() === day
    )
  }

  const days: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-medium">
          {year}年{month + 1}月
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs text-muted-foreground py-1">
            {w}
          </div>
        ))}
        {days.map((d, i) =>
          d === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <button
              key={d}
              type="button"
              onClick={() => {
                const date = new Date(year, month, d)
                onSelect(date)
                onClose?.()
              }}
              className={cn(
                "aspect-square rounded-lg text-sm font-medium transition-colors",
                isSelected(d)
                  ? "bg-primary text-primary-foreground"
                  : isToday(d)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
              )}
            >
              {d}
            </button>
          )
        )}
      </div>
    </div>
  )
}
