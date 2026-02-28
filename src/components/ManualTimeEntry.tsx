"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { TaskCategory, EnergyLevel, TimeRecord } from "@/types"
import { ENERGY_EMOJI, ENERGY_LABELS } from "@/types"
import { saveRecord, updateRecord, getDateKey } from "@/lib/supabaseStorage"
import {
  getCategories, addCategory, removeCategory, updateCategoryColor, getAllColors,
  type CategoryInfo,
} from "@/lib/supabaseCategories"
import { cn } from "@/lib/utils"

const ENERGY_OPTIONS: EnergyLevel[] = [-1, 0, 1]

interface ManualTimeEntryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate: Date
  editRecord?: TimeRecord
  onSaved?: () => void
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function timeStr(iso: string) {
  const d = new Date(iso)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function ManualTimeEntry({
  open,
  onOpenChange,
  defaultDate,
  editRecord,
  onSaved,
}: ManualTimeEntryProps) {
  const [taskName, setTaskName] = useState("")
  const [date, setDate] = useState(() => getDateKey(defaultDate))
  const defaultDateRef = useRef(defaultDate)
  defaultDateRef.current = defaultDate

  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [category, setCategory] = useState<TaskCategory | null>(null)
  const [energy, setEnergy] = useState<EnergyLevel | null>(null)

  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [manageMode, setManageMode] = useState(false)
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const loadCategories = async () => {
        try {
          const cats = await getCategories()
          setCategories(cats)
        } catch (e) {
          console.error("Failed to load categories:", e)
        }
      }
      loadCategories()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (editRecord) {
      setTaskName(editRecord.taskName)
      setDate(getDateKey(new Date(editRecord.startTime)))
      setStartTime(timeStr(editRecord.startTime))
      setEndTime(timeStr(editRecord.endTime))
      setCategory(editRecord.category)
      setEnergy(editRecord.energyLevel)
    } else {
      setDate(getDateKey(defaultDateRef.current))
      setTaskName("")
      setStartTime("09:00")
      setEndTime("10:00")
      setCategory(null)
      setEnergy(null)
    }
    setShowAddCategory(false)
    setManageMode(false)
  }, [open, editRecord])

  const handleAddCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    try {
      const updated = await addCategory(name)
      setCategories(updated)
      setCategory(name)
      setNewCategoryName("")
      setShowAddCategory(false)
    } catch (e) {
      console.error("Failed to add category:", e)
      alert("添加分类失败")
    }
  }

  const handleRemoveCategory = async (name: string) => {
    try {
      const updated = await removeCategory(name)
      setCategories(updated)
      if (category === name) setCategory(null)
      if (colorPickerFor === name) setColorPickerFor(null)
    } catch (e) {
      console.error("Failed to remove category:", e)
      alert("删除分类失败")
    }
  }

  const handleChangeColor = async (name: string, bg: string, text: string) => {
    try {
      const updated = await updateCategoryColor(name, bg, text)
      setCategories(updated)
      setColorPickerFor(null)
    } catch (e) {
      console.error("Failed to update category color:", e)
      alert("更新颜色失败")
    }
  }

  const handleSave = async () => {
    if (!taskName.trim() || !category || energy === null) return

    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    const start = new Date(`${date}T${pad2(sh)}:${pad2(sm)}:00`)
    const end = new Date(`${date}T${pad2(eh)}:${pad2(em)}:00`)

    if (end <= start) {
      alert("结束时间必须晚于开始时间")
      return
    }

    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)

    const record: TimeRecord = {
      id: editRecord?.id ?? crypto.randomUUID(),
      taskName: taskName.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration,
      category,
      energyLevel: energy,
      subtasks: editRecord?.subtasks,
    }

    setLoading(true)
    try {
      if (editRecord) {
        const oldDateStr = getDateKey(new Date(editRecord.startTime))
        await updateRecord(oldDateStr, record)
      } else {
        await saveRecord(record)
      }

      onSaved?.()
      onOpenChange(false)
    } catch (e) {
      console.error("Failed to save:", e)
      alert("保存失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const canSave = taskName.trim() && category !== null && energy !== null && !loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editRecord ? "编辑记录" : "手动添加时间"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1 block">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">开始时间</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">结束时间</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">做了什么</label>
            <Input
              placeholder="例如：睡觉、通勤、吃饭..."
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">状态分类</label>
              <button
                type="button"
                onClick={() => setManageMode(!manageMode)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {manageMode ? "完成" : "管理"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const isSelected = category === c.name
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      if (manageMode) {
                        setColorPickerFor(colorPickerFor === c.name ? null : c.name)
                      } else {
                        setCategory(c.name)
                      }
                    }}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-medium transition-all relative",
                      isSelected && !manageMode && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{
                      backgroundColor: c.bg,
                      color: c.text,
                    }}
                  >
                    {c.name}
                    {manageMode && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveCategory(c.name)
                        }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer"
                      >
                        <X className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                )
              })}

              {!manageMode && !showAddCategory && (
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="rounded-xl px-3 py-2 text-sm font-medium bg-muted hover:bg-muted/80 transition-colors text-muted-foreground flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  自定义
                </button>
              )}
            </div>

            {/* Color picker */}
            {manageMode && colorPickerFor && (
              <div className="mt-2 p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">
                  选择「{colorPickerFor}」的颜色
                </p>
                <div className="flex flex-wrap gap-2">
                  {getAllColors().map((color, i) => {
                    const current = categories.find((c) => c.name === colorPickerFor)
                    const isActive = current?.bg === color.bg
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleChangeColor(colorPickerFor, color.bg, color.text)}
                        className={cn(
                          "w-7 h-7 rounded-lg transition-all",
                          isActive && "ring-2 ring-primary ring-offset-1"
                        )}
                        style={{ backgroundColor: color.bg }}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {showAddCategory && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="输入新分类名称"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  className="h-9 text-sm"
                  autoFocus
                />
                <Button size="sm" className="h-9 shrink-0" onClick={handleAddCategory}>
                  添加
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 shrink-0"
                  onClick={() => {
                    setShowAddCategory(false)
                    setNewCategoryName("")
                  }}
                >
                  取消
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">精力标记</label>
            <div className="flex gap-2">
              {ENERGY_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEnergy(e)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-sm transition-colors flex-1",
                    energy === e ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span className="text-lg">{ENERGY_EMOJI[e]}</span>
                  <span className="text-xs">{ENERGY_LABELS[e]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={handleSave} disabled={!canSave}>
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                保存中...
              </>
            ) : editRecord ? (
              "保存修改"
            ) : (
              "保存"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
