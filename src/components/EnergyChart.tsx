"use client"

import { useState } from "react"
import type { TimeRecord } from "@/types"
import { ENERGY_EMOJI, ENERGY_LABELS } from "@/types"

interface EnergyChartProps {
  records: TimeRecord[]
  className?: string
}

const CHART_W = 320
const CHART_H = 160
const PAD_L = 40
const PAD_R = 16
const PAD_T = 24
const PAD_B = 30

const PLOT_W = CHART_W - PAD_L - PAD_R
const PLOT_H = CHART_H - PAD_T - PAD_B

interface DataPoint {
  record: TimeRecord
  midHour: number
  energy: number
  x: number
  y: number
}

export function EnergyChart({ records, className }: EnergyChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const points: DataPoint[] = records
    .map((r) => {
      const s = new Date(r.startTime)
      const e = new Date(r.endTime)
      const sMin = s.getHours() * 60 + s.getMinutes()
      const eMin = e.getHours() * 60 + e.getMinutes()
      const midMin = (sMin + eMin) / 2
      return { record: r, midHour: midMin / 60, energy: r.energyLevel, x: 0, y: 0 }
    })
    .sort((a, b) => a.midHour - b.midHour)

  if (points.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        暂无精力数据
      </div>
    )
  }

  const minHour = Math.floor(Math.min(...points.map((p) => p.midHour)))
  const maxHour = Math.ceil(Math.max(...points.map((p) => p.midHour)))
  const xRange = Math.max(maxHour - minHour, 1)

  for (const p of points) {
    p.x = PAD_L + ((p.midHour - minHour) / xRange) * PLOT_W
    // +1 -> top, -1 -> bottom
    p.y = PAD_T + ((1 - p.energy) / 2) * PLOT_H
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ")

  const yLevels = [1, 0, -1].map((level) => ({
    level,
    y: PAD_T + ((1 - level) / 2) * PLOT_H,
    label: ENERGY_EMOJI[level as -1 | 0 | 1],
  }))

  const xLabels: { hour: number; x: number }[] = []
  const step = xRange <= 6 ? 1 : xRange <= 12 ? 2 : 3
  for (let h = minHour; h <= maxHour; h += step) {
    xLabels.push({
      hour: h,
      x: PAD_L + ((h - minHour) / xRange) * PLOT_W,
    })
  }

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full"
        style={{ maxWidth: CHART_W }}
      >
        {/* Y 轴网格线 + 标签 */}
        {yLevels.map(({ level, y, label }) => (
          <g key={level}>
            <line
              x1={PAD_L}
              y1={y}
              x2={CHART_W - PAD_R}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
            <text
              x={PAD_L - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: 11 }}
            >
              {label}
            </text>
          </g>
        ))}

        {/* X 轴标签 */}
        {xLabels.map(({ hour, x }) => (
          <text
            key={hour}
            x={x}
            y={CHART_H - 8}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 9 }}
          >
            {hour}:00
          </text>
        ))}

        {/* 折线 */}
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          strokeOpacity={0.6}
          strokeLinejoin="round"
        />

        {/* 数据点 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? 6 : 4}
            fill="hsl(var(--primary))"
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
          />
        ))}

        {/* 悬浮提示 */}
        {hoveredIdx !== null && points[hoveredIdx] && (() => {
          const p = points[hoveredIdx]
          const label = `${p.record.taskName} · ${ENERGY_LABELS[p.energy as -1 | 0 | 1]}`
          const tooltipY = p.y > PAD_T + 20 ? p.y - 14 : p.y + 20
          // 防止文字溢出左右边界
          const tooltipX = Math.max(PAD_L + 10, Math.min(p.x, CHART_W - PAD_R - 10))
          return (
            <text
              x={tooltipX}
              y={tooltipY}
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: 10, fontWeight: 500 }}
            >
              {label}
            </text>
          )
        })()}
      </svg>
    </div>
  )
}
