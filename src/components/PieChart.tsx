"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getCategoryColor } from "@/lib/supabaseCategories"

export interface PieSlice {
  category: string
  duration: number
  percent: number
}

interface PieChartProps {
  slices: PieSlice[]
  totalDuration: number
  className?: string
}

// 同步获取默认颜色
function getDefaultColor(category: string): string {
  if (category === "未设置") return "#f1f5f9"
  // 默认颜色映射
  const defaults: Record<string, string> = {
    "深度工作": "#a7f3d0",
    "浅层处理": "#fde68a",
    "休息放松": "#bae6fd",
    "无意识摸鱼": "#e2e8f0",
  }
  return defaults[category] ?? "#94a3b8"
}

export function PieChart({ slices, totalDuration, className }: PieChartProps) {
  const [colors, setColors] = useState<Record<string, string>>({})

  // 异步加载分类颜色
  useEffect(() => {
    const loadColors = async () => {
      const colorMap: Record<string, string> = {}
      for (const slice of slices) {
        if (slice.category === "未设置") {
          colorMap[slice.category] = "#f1f5f9"
        } else {
          try {
            const color = await getCategoryColor(slice.category)
            colorMap[slice.category] = color.bg
          } catch {
            colorMap[slice.category] = getDefaultColor(slice.category)
          }
        }
      }
      setColors(colorMap)
    }
    loadColors()
  }, [slices])

  if (slices.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground text-sm",
          className
        )}
      >
        暂无数据
      </div>
    )
  }

  let current = 0
  const gradientParts = slices.map((s) => {
    const start = current
    const end = current + (s.percent / 100) * 360
    current = end
    const color = colors[s.category] ?? getDefaultColor(s.category)
    return `${color} ${start}deg ${end}deg`
  })
  const conicValue = gradientParts.join(", ")

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className="rounded-full shrink-0"
        style={{
          width: 140,
          height: 140,
          background: `conic-gradient(${conicValue})`,
        }}
      />
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {slices.map((s) => (
          <div key={s.category} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded shrink-0"
              style={{ backgroundColor: colors[s.category] ?? getDefaultColor(s.category) }}
            />
            <span className="text-muted-foreground">
              {s.category} {s.percent.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
