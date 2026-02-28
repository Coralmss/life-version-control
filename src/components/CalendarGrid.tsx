"use client"

import type { TimeRecord } from "@/types"
import { CATEGORY_COLORS } from "@/lib/categoryColors"
import { getDateKey } from "@/lib/storage"
import { cn } from "@/lib/utils"

const DEFAULT_RANGE_START = 8
const DEFAULT_RANGE_END = 23

const ACTIVE_PX = 80
const PASS_PX = 24
const EMPTY_PX = 16
const DEFAULT_PX = 28
const MIN_PX = 20
const GAP = 2
const SCROLL_HEIGHT = "60vh"

interface DayColumn {
  date: Date
  records: TimeRecord[]
}

interface CalendarGridProps {
  columns: DayColumn[]
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

// ── Dynamic range computation ──

function computeRange(records: TimeRecord[]): { rangeStart: number; rangeEnd: number } {
  if (records.length === 0) {
    return { rangeStart: DEFAULT_RANGE_START, rangeEnd: DEFAULT_RANGE_END }
  }

  let earliestHour = 24
  let latestHour = 0

  for (const r of records) {
    const s = new Date(r.startTime)
    const e = new Date(r.endTime)
    earliestHour = Math.min(earliestHour, s.getHours())
    const eH = e.getHours()
    const eM = e.getMinutes()
    latestHour = Math.max(latestHour, eM > 0 ? eH + 1 : eH)
  }

  const rangeStart = Math.max(0, Math.min(earliestHour, DEFAULT_RANGE_START))
  const rangeEnd = Math.min(24, Math.max(latestHour, DEFAULT_RANGE_END))

  return { rangeStart, rangeEnd }
}

// ── Variable-height time axis ──

type HourKind = "active" | "pass" | "empty"
interface Seg {
  hour: number
  y: number
  h: number
  kind: HourKind
}

function buildAxis(records: TimeRecord[], rangeStart: number, rangeEnd: number): { segs: Seg[]; total: number } {
  if (records.length === 0) {
    const segs: Seg[] = []
    let y = 0
    for (let h = rangeStart; h < rangeEnd; h++) {
      segs.push({ hour: h, y, h: DEFAULT_PX, kind: "empty" })
      y += DEFAULT_PX
    }
    return { segs, total: y }
  }

  const startEnd = new Set<number>()
  const passThru = new Set<number>()

  for (const r of records) {
    const s = new Date(r.startTime)
    const e = new Date(r.endTime)
    const sMin = s.getHours() * 60 + s.getMinutes()
    const eMin = Math.max(e.getHours() * 60 + e.getMinutes(), sMin + 1)
    const sH = Math.floor(sMin / 60)
    const eH = Math.floor((eMin - 1) / 60)

    startEnd.add(sH)
    if (eH !== sH) startEnd.add(eH)
    for (let h = sH + 1; h < eH; h++) passThru.add(h)
  }

  const padded = new Set<number>()
  Array.from(startEnd).forEach((h) => {
    padded.add(h - 1)
    padded.add(h)
    padded.add(h + 1)
  })

  const segs: Seg[] = []
  let y = 0
  for (let h = rangeStart; h < rangeEnd; h++) {
    const kind: HourKind = padded.has(h) ? "active" : passThru.has(h) ? "pass" : "empty"
    const height = kind === "active" ? ACTIVE_PX : kind === "pass" ? PASS_PX : EMPTY_PX
    segs.push({ hour: h, y, h: height, kind })
    y += height
  }
  return { segs, total: y }
}

function toY(min: number, segs: Seg[], rangeStart: number, rangeEnd: number): number {
  const c = Math.max(rangeStart * 60, Math.min(min, rangeEnd * 60))
  for (const s of segs) {
    const end = (s.hour + 1) * 60
    if (c < end) return s.y + ((c - s.hour * 60) / 60) * s.h
  }
  const last = segs[segs.length - 1]
  return last.y + last.h
}

// ── Lane assignment ──

function assignLanes(blocks: { s: number; e: number }[]) {
  if (!blocks.length) return [] as { lane: number; total: number }[]
  const order = blocks.map((_, i) => i).sort((a, b) => blocks[a].s - blocks[b].s)
  const ends: number[] = []
  const laneOf = new Array<number>(blocks.length).fill(0)

  for (const i of order) {
    const b = blocks[i]
    let l = 0
    while (l < ends.length && ends[l] > b.s + 1) l++
    if (l === ends.length) ends.push(0)
    ends[l] = b.e
    laneOf[i] = l
  }
  const total = Math.max(1, ends.length)
  return blocks.map((_, i) => ({ lane: laneOf[i], total }))
}

// ── Layout ──

interface Placed {
  rec: TimeRecord
  top: number
  h: number
  lane: number
  total: number
  color: string
}

function doLayout(records: TimeRecord[], segs: Seg[], totalH: number, rangeStart: number, rangeEnd: number): Placed[] {
  const parsed = records
    .map((r) => {
      const s = new Date(r.startTime)
      const e = new Date(r.endTime)
      return {
        rec: r,
        sMin: s.getHours() * 60 + s.getMinutes(),
        eMin: Math.max(e.getHours() * 60 + e.getMinutes(), s.getHours() * 60 + s.getMinutes() + 1),
      }
    })
    .filter((b) => b.sMin < rangeEnd * 60 && b.eMin > rangeStart * 60)
    .sort((a, b) => a.sMin - b.sMin)

  if (!parsed.length) return []

  const withY = parsed.map((b) => {
    const sy = toY(b.sMin, segs, rangeStart, rangeEnd)
    const ey = Math.max(toY(b.eMin, segs, rangeStart, rangeEnd), sy + MIN_PX)
    return { ...b, sy, ey }
  })

  const lanes = assignLanes(withY.map((b) => ({ s: b.sy, e: b.ey })))
  const maxL = lanes[0]?.total ?? 1
  const bottoms = new Array(maxL).fill(-Infinity)
  const out: Placed[] = []

  for (let i = 0; i < withY.length; i++) {
    const b = withY[i]
    const { lane, total } = lanes[i]
    const idealTop = b.sy
    const rawH = Math.max(b.ey - b.sy, MIN_PX)
    const top = Math.max(idealTop, bottoms[lane] + GAP)
    if (top >= totalH) continue
    const h = Math.min(rawH, totalH - top)
    out.push({
      rec: b.rec,
      top,
      h: Math.max(h, MIN_PX),
      lane,
      total,
      color: CATEGORY_COLORS[b.rec.category]?.bg ?? "#94a3b8",
    })
    bottoms[lane] = top + Math.max(h, MIN_PX)
  }
  return out
}

// ── Block element ──

function Block({ p }: { p: Placed }) {
  const w = 100 / p.total
  const l = p.lane * w
  const startTime = fmtTime(p.rec.startTime)
  const endTime = fmtTime(p.rec.endTime)

  return (
    <div
      className="absolute rounded-[4px] border-l-[3px] border-black/15 overflow-hidden"
      style={{
        top: p.top,
        height: p.h,
        left: `${l}%`,
        width: `${w}%`,
        backgroundColor: p.color,
        zIndex: p.lane + 1,
        padding: "1px 4px 0",
      }}
      title={`${p.rec.taskName}\n${p.rec.category}\n${startTime}-${endTime}`}
    >
      {p.total >= 3 && p.h >= 30 ? (
        <>
          <div className="font-medium text-[10px] leading-tight truncate">
            {p.rec.taskName}
          </div>
          <div className="text-[8px] opacity-60 leading-tight truncate">
            {startTime}-{endTime}
          </div>
        </>
      ) : (
        <div className="flex items-baseline gap-1 leading-tight min-w-0">
          <span className="font-medium text-[11px] truncate min-w-0">
            {p.rec.taskName}
          </span>
          <span className="text-[9px] opacity-60 shrink-0 whitespace-nowrap">
            {startTime}-{endTime}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main component (day view only) ──

export function CalendarGrid({ columns }: CalendarGridProps) {
  const col = columns[0]
  if (!col) return null

  const { rangeStart, rangeEnd } = computeRange(col.records)
  const { segs, total } = buildAxis(col.records, rangeStart, rangeEnd)
  const blocks = doLayout(col.records, segs, total, rangeStart, rangeEnd)
  const isToday = getDateKey(col.date) === getDateKey(new Date())
  const wk = ["日", "一", "二", "三", "四", "五", "六"][col.date.getDay()]

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-muted/20">
      {/* Header - stays visible */}
      <div
        className={cn(
          "h-11 flex items-center justify-center border-b border-border text-xs font-medium",
          isToday && "text-primary"
        )}
      >
        <span className="text-[10px] text-muted-foreground mr-1">{wk}</span>
        <span>{col.date.getDate()}</span>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto" style={{ maxHeight: SCROLL_HEIGHT }}>
        <div className="flex">
          {/* Time labels */}
          <div
            className="w-14 shrink-0 bg-muted/50 border-r border-border relative"
            style={{ height: total }}
          >
            {segs.map((s) => (
              <div
                key={s.hour}
                className={cn(
                  "absolute right-0 pr-2 leading-none",
                  s.kind === "empty"
                    ? "text-[8px] text-muted-foreground/40"
                    : "text-[10px] text-muted-foreground"
                )}
                style={{ top: s.y }}
              >
                {s.hour}:00
              </div>
            ))}
          </div>

          {/* Grid + blocks */}
          <div
            className={cn("flex-1 relative", isToday && "bg-primary/5")}
            style={{ height: total }}
          >
            {/* Grid lines */}
            {segs.map((s) => (
              <div
                key={s.hour}
                className="absolute left-0 right-0"
                style={{ top: s.y, height: s.h }}
              >
                <div className="absolute inset-x-0 top-0 border-t border-border/40" />
                {s.kind === "active" &&
                  [1, 2, 3].map((q) => (
                    <div
                      key={q}
                      className="absolute inset-x-0 border-t border-dashed border-border/20"
                      style={{ top: `${q * 25}%` }}
                    />
                  ))}
              </div>
            ))}

            {/* Blocks or empty state */}
            {blocks.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                暂无记录
              </div>
            ) : (
              blocks.map((b) => <Block key={b.rec.id} p={b} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
