"use client"

import { supabase, fromDbRecord, toDbRecord } from './supabase'
import type { TimeRecord } from '@/types'
import { getDateKey as getLocalDateKey } from './storage'

// 获取当前登录用户
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// 辅助函数：获取日期 key（YYYY-MM-DD）
export function getDateKey(d: Date): string {
  return getLocalDateKey(d)
}

// 获取所有记录（按日期分组）
export async function getAllRecords(): Promise<Record<string, TimeRecord[]>> {
  const user = await getCurrentUser()
  if (!user) return {}

  const { data, error } = await supabase
    .from('time_records')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Failed to fetch records:', error)
    return {}
  }

  // 按日期分组
  const grouped: Record<string, TimeRecord[]> = {}
  for (const row of data || []) {
    const record = fromDbRecord(row)
    const dateKey = getDateKey(new Date(record.startTime))
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(record)
  }

  // 每天内部按开始时间排序
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }

  return grouped
}

// 获取今日记录
export async function getTodayRecords(): Promise<TimeRecord[]> {
  const today = getDateKey(new Date())
  return getRecordsByDate(today)
}

// 获取指定日期的记录
export async function getRecordsByDate(dateStr: string): Promise<TimeRecord[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const startOfDay = new Date(dateStr)
  const endOfDay = new Date(dateStr)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const { data, error } = await supabase
    .from('time_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_time', startOfDay.toISOString())
    .lt('start_time', endOfDay.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Failed to fetch records by date:', error)
    return []
  }

  return (data || []).map(fromDbRecord)
}

// 获取一周的记录
export async function getRecordsForWeek(weekStart: Date): Promise<Record<string, TimeRecord[]>> {
  const user = await getCurrentUser()
  if (!user) return {}

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const { data, error } = await supabase
    .from('time_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_time', weekStart.toISOString())
    .lt('start_time', weekEnd.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Failed to fetch week records:', error)
    return {}
  }

  const result: Record<string, TimeRecord[]> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    result[getDateKey(d)] = []
  }

  for (const row of data || []) {
    const record = fromDbRecord(row)
    const key = getDateKey(new Date(record.startTime))
    if (result[key]) result[key].push(record)
  }

  return result
}

// 获取日期范围的记录
export async function getRecordsByDateRange(startStr: string, endStr: string): Promise<TimeRecord[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('time_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_time', new Date(startStr).toISOString())
    .lte('start_time', new Date(endStr + 'T23:59:59.999Z').toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Failed to fetch records by range:', error)
    return []
  }

  return (data || []).map(fromDbRecord)
}

// 保存记录
export async function saveRecord(record: TimeRecord): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const dbRecord = toDbRecord(record, user.id)
  const { error } = await supabase
    .from('time_records')
    .upsert(dbRecord)

  if (error) {
    console.error('Failed to save record:', error)
    throw error
  }
}

// 删除记录
export async function deleteRecord(dateStr: string, recordId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('time_records')
    .delete()
    .eq('id', recordId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to delete record:', error)
    throw error
  }
}

// 更新记录
export async function updateRecord(oldDateStr: string, record: TimeRecord): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const dbRecord = toDbRecord(record, user.id)
  const { error } = await supabase
    .from('time_records')
    .update({
      task_name: dbRecord.task_name,
      start_time: dbRecord.start_time,
      end_time: dbRecord.end_time,
      duration: dbRecord.duration,
      category: dbRecord.category,
      energy_level: dbRecord.energy_level,
    })
    .eq('id', record.id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to update record:', error)
    throw error
  }
}
