"use client"

import { useState, useEffect } from "react"
import { Play, Square, Plus, ArrowRightLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { TaskCategory, EnergyLevel, TimeRecord, SubtaskRecord } from "@/types"
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

  // 子任务状态
  const [subtasks, setSubtasks] = useState<SubtaskRecord[]>([])
  const [currentSubtask, setCurrentSubtask] = useState("")
  const [activeSubtaskName, setActiveSubtaskName] = useState<string | null>(null)
  const [subtaskStartTime, setSubtaskStartTime] = useState<Date | null>(null)

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
    setSubtasks([])
    setActiveSubtaskName(null)
    setSubtaskStartTime(null)
    setCurrentSubtask("")
  }

  const handleStartSubtask = () => {
    const name = currentSubtask.trim()
    if (!name || !isRunning) return

    const now = new Date()

    // 结束当前活跃的子任务
    if (activeSubtaskName && subtaskStartTime) {
      const duration = Math.floor((now.getTime() - subtaskStartTime.getTime()) / 1000)
      setSubtasks((prev) => [
        ...prev,
        {
          name: activeSubtaskName,
          startTime: subtaskStartTime.toISOString(),
          endTime: now.toISOString(),
          duration,
        },
      ])
    }

    // 开始新的子任务
    setActiveSubtaskName(name)
    setSubtaskStartTime(now)
    setCurrentSubtask("")
  }

  const handleStop = () => {
    const now = new Date()

    // 结束当前活跃的子任务
    if (activeSubtaskName && subtaskStartTime) {
      const duration = Math.floor((now.getTime() - subtaskStartTime.getTime()) / 1000)
      setSubtasks((prev) => [
        ...prev,
        {
          name: activeSubtaskName,
          startTime: subtaskStartTime.toISOString(),
          endTime: now.toISOString(),
          duration,
        },
      ])
      setActiveSubtaskName(null)
      setSubtaskStartTime(null)
    }

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
      subtasks: subtasks.length > 0 ? subtasks : undefined,
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
      setSubtasks([])
      setActiveSubtaskName(null)
      setSubtaskStartTime(null)
      setCurrentSubtask("")
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

          {/* 子任务区域 */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-2">子任务（可选）</p>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="子任务名称，如：查资料"
                value={currentSubtask}
                onChange={(e) => setCurrentSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartSubtask()}
                className="flex-1 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartSubtask}
                disabled={!currentSubtask.trim()}
                className="gap-1 shrink-0"
              >
                {activeSubtaskName ? (
                  <>
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    切换
                  </>
                ) : (
                  "开始"
                )}
              </Button>
            </div>

            {/* 当前活跃子任务 */}
            {activeSubtaskName && subtaskStartTime && (
              <div className="bg-primary/10 rounded-lg px-3 py-2 text-sm flex items-center justify-between">
                <span>
                  <span className="text-muted-foreground">当前：</span>
                  <span className="font-medium">{activeSubtaskName}</span>
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatDuration(
                    Math.floor((Date.now() - subtaskStartTime.getTime()) / 1000)
                  )}
                </span>
              </div>
            )}

            {/* 已完成的子任务列表 */}
            {subtasks.length > 0 && (
              <div className="mt-2 space-y-1">
                {subtasks.map((st, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>{st.name}</span>
                    <span className="font-mono">{formatDuration(st.duration)}</span>
                  </div>
                ))}
              </div>
            )}
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
                {subtasks.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      子任务（{subtasks.length}）
                    </p>
                    <div className="space-y-1">
                      {subtasks.map((st, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span>{st.name}</span>
                          <span className="text-muted-foreground font-mono">
                            {formatDuration(st.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
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
