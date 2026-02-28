import { createClient } from '@supabase/supabase-js'
import type { TimeRecord } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表类型定义（供参考）
export interface Database {
  public: {
    Tables: {
      time_records: {
        Row: {
          id: string
          user_id: string
          task_name: string
          start_time: string
          end_time: string
          duration: number
          category: string
          energy_level: number
          subtasks: any | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['time_records']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['time_records']['Insert']>
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          bg_color: string
          text_color: string
          is_default: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
    }
  }
}

// 辅助函数：将 TimeRecord 转换为数据库格式
export function toDbRecord(record: TimeRecord, userId: string): Database['public']['Tables']['time_records']['Insert'] {
  return {
    id: record.id,
    user_id: userId,
    task_name: record.taskName,
    start_time: record.startTime,
    end_time: record.endTime,
    duration: record.duration,
    category: record.category,
    energy_level: record.energyLevel,
    subtasks: record.subtasks && record.subtasks.length > 0 ? record.subtasks : null,
  }
}

// 辅助函数：将数据库记录转换为 TimeRecord
export function fromDbRecord(row: Database['public']['Tables']['time_records']['Row']): TimeRecord {
  return {
    id: row.id,
    taskName: row.task_name,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    category: row.category,
    energyLevel: row.energy_level as -1 | 0 | 1,
    subtasks: row.subtasks
      ? (typeof row.subtasks === 'string' ? JSON.parse(row.subtasks) : row.subtasks)
      : undefined,
  }
}
