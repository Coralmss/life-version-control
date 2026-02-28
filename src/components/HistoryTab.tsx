"use client"

import { useState, useCallback, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRecordsByDate, getDateKey, deleteRecord } from "@/lib/supabaseStorage"
import type { TimeRecord } from "@/types"
import { DateSelector } from "@/components/DateSelector"
import { ManualTimeEntry } from "@/components/ManualTimeEntry"
import { cn } from "@/lib/utils"
import { getCategoryColor } from "@/lib/supabaseCategories"

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}m`
}

interface ColorInfo {
  bg: string
  text: string
}

interface HistoryTabProps {
  refreshKey?: number
}

export function HistoryTab({ refreshKey = 0 }: HistoryTabProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [manualOpen, setManualOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TimeRecord | undefined>()
  const [version, setVersion] = useState(0)
  const [records, setRecords] = useState<TimeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [categoryColors, setCategoryColors] = useState<Record<string, ColorInfo>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 加载记录
  useEffect(() => {
    if (!mounted) return
    const loadRecords = async () => {
      setLoading(true)
      try {
        const key = getDateKey(selectedDate)
        const data = await getRecordsByDate(key)
        setRecords(data)

        // 加载分类颜色
        const colors: Record<string, ColorInfo> = {}
        for (const r of data) {
          if (!colors[r.category]) {
            colors[r.category] = await getCategoryColor(r.category)
          }
        }
        setCategoryColors(colors)
      } catch (e) {
        console.error("Failed to load records:", e)
      } finally {
        setLoading(false)
      }
    }
    loadRecords()
  }, [mounted, selectedDate, version, refreshKey])

  const totalSeconds = records.reduce((sum, r) => sum + r.duration, 0)
  const avgSeconds = records.length > 0 ? Math.round(totalSeconds / records.length) : 0

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const handleDelete = async (record: TimeRecord) => {
    if (!confirm(`确定删除「${record.taskName}」？`)) return
    try {
      const dateStr = getDateKey(new Date(record.startTime))
      await deleteRecord(dateStr, record.id)
      refresh()
    } catch (e) {
      console.error("Failed to delete:", e)
      alert("删除失败，请重试")
    }
  }

  const handleEdit = (record: TimeRecord) => {
    setEditingRecord(record)
    setManualOpen(true)
  }

  const handleAdd = () => {
    setEditingRecord(undefined)
    setManualOpen(true)
  }

  const handleSaved = () => {
    setEditingRecord(undefined)
    refresh()
  }

  const getColor = (category: string): ColorInfo => {
    return categoryColors[category] ?? { bg: "#f1f5f9", text: "#475569" }
  }

  return (
    <div className="space-y-4">
      <DateSelector
        viewMode="day"
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-3 text-center border border-border">
          <div className="text-xl font-bold text-primary">{records.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">任务数</div>
        </div>
        <div className="bg-card rounded-xl p-3 text-center border border-border">
          <div className="text-xl font-bold text-blue-500">
            {fmtDuration(totalSeconds)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">总时长</div>
        </div>
        <div className="bg-card rounded-xl p-3 text-center border border-border">
          <div className="text-xl font-bold text-amber-500">
            {records.length > 0 ? fmtDuration(avgSeconds) : "-"}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">平均时长</div>
        </div>
      </div>

      {/* Header + add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          今日记录（{records.length}）
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          添加
        </Button>
      </div>

      {/* Record cards */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">加载中...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm">暂无记录</p>
          <p className="text-xs mt-1">通过专注模式或手动添加来记录时间</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const color = getColor(r.category)
            const hasSubtasks = r.subtasks && r.subtasks.length > 0
            const isExpanded = expandedId === r.id
            return (
              <div key={r.id}>
                <div
                  className={cn(
                    "bg-card rounded-xl border border-border p-3 flex items-center gap-3",
                    hasSubtasks && "cursor-pointer"
                  )}
                  onClick={() => hasSubtasks && setExpandedId(isExpanded ? null : r.id)}
                >
                  {/* Color bar */}
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: color.bg }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {r.taskName}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>
                        {fmtTime(r.startTime)} - {fmtTime(r.endTime)}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: color.bg,
                          color: color.text,
                        }}
                      >
                        {r.category}
                      </span>
                    </div>
                  </div>

                  {/* Subtask indicator */}
                  {hasSubtasks && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {r.subtasks!.length}子任务 {isExpanded ? "▲" : "▼"}
                    </span>
                  )}

                  {/* Duration */}
                  <div className="text-sm font-semibold shrink-0">
                    {fmtDuration(r.duration)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleEdit(r)}
                      className={cn(
                        "h-7 w-7 rounded-md flex items-center justify-center",
                        "bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                      )}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      className={cn(
                        "h-7 w-7 rounded-md flex items-center justify-center",
                        "bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* 展开的子任务列表 */}
                {isExpanded && r.subtasks && (
                  <div className="ml-6 mt-1 mb-2 space-y-1 pl-3 border-l-2 border-border">
                    {r.subtasks.map((st, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-muted-foreground py-1">
                        <span>{st.name}</span>
                        <div className="flex items-center gap-2">
                          <span>{fmtTime(st.startTime)} - {fmtTime(st.endTime)}</span>
                          <span className="font-mono">{fmtDuration(st.duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ManualTimeEntry
        open={manualOpen}
        onOpenChange={(open) => {
          setManualOpen(open)
          if (!open) setEditingRecord(undefined)
        }}
        defaultDate={selectedDate}
        editRecord={editingRecord}
        onSaved={handleSaved}
      />
    </div>
  )
}
