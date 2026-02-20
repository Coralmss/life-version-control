"use client"

import { useState, useEffect } from "react"
import { Play, Square, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { TaskCategory, EnergyLevel, TimeRecord } from "@/types"
import { ENERGY_EMOJI, ENERGY_LABELS } from "@/types"
import { saveRecord } from "@/lib/supabaseStorage"
import { getCategories, type CategoryInfo } from "@/lib/supabaseCategories"
import { ManualTimeEntry } from "@/components/ManualTimeEntry"
import { cn } from "@/lib/utils"
const ENERGY_OPTIONS: EnergyLevel[] = [-1, 0, 1]

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":")
}

interface FocusTabProps {
  onRecordSaved?: () => void
}

export function FocusTab({ onRecordSaved }: FocusTabProps) {
  const [taskName, setTaskName] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null)
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel | null>(null)
  const [currentFeeling, setCurrentFeeling] = useState<EnergyLevel | null>(null)
  const [manualEntryOpen, setManualEntryOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // 加载分类
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true)
      try {
        const cats = await getCategories()
        setCategories(cats)
      } catch (e) {
        console.error("Failed to load categories:", e)
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [manualEntryOpen])

  useEffect(() => {
    if (!isRunning || !startTime) return
    const tick = () => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isRunning, startTime])

  const handlePlay = () => {
    if (!taskName.trim()) return
    setStartTime(new Date())
    setIsRunning(true)
    setElapsed(0)
  }

  const handleStop = () => {
    setIsRunning(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const energy = selectedEnergy ?? currentFeeling ?? 0
    if (!startTime || selectedCategory === null) return

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    const record: TimeRecord = {
      id: crypto.randomUUID(),
      taskName: taskName.trim(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      category: selectedCategory,
      energyLevel: energy,
    }

    try {
      await saveRecord(record)
      onRecordSaved?.()

      setModalOpen(false)
      setTaskName("")
      setStartTime(null)
      setElapsed(0)
      setSelectedCategory(null)
      setSelectedEnergy(null)
      setCurrentFeeling(null)
    } catch (e) {
      console.error("Failed to save record:", e)
      alert("保存失败，请重试")
    }
  }

  const canSave = selectedCategory !== null && selectedEnergy !== null

  useEffect(() => {
    if (modalOpen && currentFeeling !== null && selectedEnergy === null) {
      setSelectedEnergy(currentFeeling)
    }
  }, [modalOpen, currentFeeling, selectedEnergy])

  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <Input
          placeholder="现在开始做什么？"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          disabled={isRunning}
          className="flex-1 text-base"
        />
        <Button
          size="icon"
          variant={isRunning ? "destructive" : "default"}
          onClick={isRunning ? handleStop : handlePlay}
          disabled={!taskName.trim() && !isRunning}
          className={cn(
            "shrink-0 h-12 w-12",
            !isRunning && "bg-emerald-500 hover:bg-emerald-600"
          )}
        >
          {isRunning ? (
            <Square className="h-6 w-6 fill-current" />
          ) : (
            <Play className="h-6 w-6 fill-current ml-0.5" />
          )}
        </Button>
      </div>

      {isRunning && startTime && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">开始时间</span>
            <span className="font-mono">{formatTime(startTime)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">正在做</span>
            <span className="font-medium">{taskName}</span>
          </div>
          <div className="text-center py-4">
            <p className="text-4xl font-mono font-medium tabular-nums text-foreground">
              {formatDuration(elapsed)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">专注中</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">当前感受（可选）</p>
            <div className="flex gap-2">
              {ENERGY_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setCurrentFeeling(e)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm transition-colors",
                    currentFeeling === e ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span>{ENERGY_EMOJI[e]}</span>
                  <span className="text-xs">{ENERGY_LABELS[e]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isRunning && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            输入任务后点击开始，专注完成后点击结束
          </p>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setManualEntryOpen(true)}
          >
            <Plus className="h-4 w-4" />
            手动添加时间
          </Button>
        </div>
      )}

      <ManualTimeEntry
        open={manualEntryOpen}
        onOpenChange={setManualEntryOpen}
        defaultDate={new Date()}
        onSaved={onRecordSaved}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent onClose={() => setModalOpen(false)} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>记录本次专注</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {taskName && (
              <div>
                <p className="text-sm text-muted-foreground">任务</p>
                <p className="font-medium mt-1">{taskName}</p>
                {startTime && (
                  <p className="text-sm text-muted-foreground mt-1">
                    时长 {formatDuration(elapsed)}
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-3">状态分类</p>
              {loadingCategories ? (
                <p className="text-sm text-muted-foreground">加载中...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedCategory(c.name)}
                      className={cn(
                        "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                        selectedCategory === c.name
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-3">精力标记</p>
              <div className="flex gap-3">
                {ENERGY_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setSelectedEnergy(e)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl px-6 py-3 text-sm transition-colors flex-1",
                      selectedEnergy === e
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <span className="text-2xl">{ENERGY_EMOJI[e]}</span>
                    <span className="text-xs">{ENERGY_LABELS[e]}</span>
                  </button>
                ))}
              </div>
              {currentFeeling !== null && (
                <p className="text-xs text-muted-foreground mt-1">已预填专注时的感受</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full" onClick={handleSave} disabled={!canSave}>
              保存记录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
