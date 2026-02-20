export type TaskCategory = string
export type EnergyLevel = -1 | 0 | 1

export interface TimeRecord {
  id: string
  taskName: string
  startTime: string // ISO string
  endTime: string
  duration: number // seconds
  category: TaskCategory
  energyLevel: EnergyLevel
}

export const ENERGY_EMOJI: Record<EnergyLevel, string> = {
  [-1]: "🔋",
  [0]: "⚪",
  [1]: "⚡",
}

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  [-1]: "极度耗能",
  [0]: "感觉平平",
  [1]: "满血复活",
}
