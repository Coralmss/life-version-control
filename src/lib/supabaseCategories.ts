"use client"

import { supabase } from './supabase'
import { getCurrentUser } from './supabaseStorage'

export interface CategoryInfo {
  name: string
  bg: string
  text: string
}

const DEFAULTS: CategoryInfo[] = [
  { name: "深度工作", bg: "#a7f3d0", text: "#065f46" },
  { name: "浅层处理", bg: "#fde68a", text: "#92400e" },
  { name: "休息放松", bg: "#bae6fd", text: "#0369a1" },
  { name: "无意识摸鱼", bg: "#e2e8f0", text: "#475569" },
]

const COLOR_POOL: { bg: string; text: string }[] = [
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#f3e8ff", text: "#6b21a8" },
  { bg: "#fff7ed", text: "#9a3412" },
  { bg: "#ccfbf1", text: "#115e59" },
  { bg: "#fef9c3", text: "#854d0e" },
  { bg: "#e0e7ff", text: "#3730a3" },
  { bg: "#ffe4e6", text: "#9f1239" },
  { bg: "#d1fae5", text: "#064e3b" },
  { bg: "#dbeafe", text: "#1e3a8a" },
  { bg: "#fde68a", text: "#78350f" },
]

const FALLBACK = { bg: "#f1f5f9", text: "#475569" }

// 获取所有颜色选项
export function getAllColors(): { bg: string; text: string }[] {
  const fromDefaults = DEFAULTS.map((c) => ({ bg: c.bg, text: c.text }))
  return [...fromDefaults, ...COLOR_POOL]
}

// 确保用户有默认分类
async function ensureDefaultCategories(userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing && existing.length > 0) return

  // 插入默认分类
  const defaultCategories = DEFAULTS.map(cat => ({
    user_id: userId,
    name: cat.name,
    bg_color: cat.bg,
    text_color: cat.text,
    is_default: true,
  }))

  await supabase.from('categories').insert(defaultCategories)
}

// 从数据库行转换为 CategoryInfo
function fromDbRow(row: { name: string; bg_color: string; text_color: string }): CategoryInfo {
  return {
    name: row.name,
    bg: row.bg_color,
    text: row.text_color,
  }
}

// 获取用户分类
export async function getCategories(): Promise<CategoryInfo[]> {
  const user = await getCurrentUser()
  if (!user) return DEFAULTS

  await ensureDefaultCategories(user.id)

  const { data, error } = await supabase
    .from('categories')
    .select('name, bg_color, text_color')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch categories:', error)
    return DEFAULTS
  }

  return (data || []).map(fromDbRow)
}

// 获取分类颜色
export async function getCategoryColor(name: string): Promise<{ bg: string; text: string }> {
  const user = await getCurrentUser()
  if (!user) return FALLBACK

  const { data, error } = await supabase
    .from('categories')
    .select('bg_color, text_color')
    .eq('user_id', user.id)
    .eq('name', name)
    .single()

  if (error || !data) {
    // 尝试从默认值中找
    const fromDefault = DEFAULTS.find(c => c.name === name)
    return fromDefault || FALLBACK
  }

  return { bg: data.bg_color, text: data.text_color }
}

// 添加分类
export async function addCategory(name: string): Promise<CategoryInfo[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // 检查是否已存在
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', name)
    .single()

  if (existing) return getCategories()

  // 选择一个颜色
  const currentCats = await getCategories()
  const usedColors = new Set(currentCats.map((c) => c.bg))
  const nextColor = COLOR_POOL.find((c) => !usedColors.has(c.bg)) ?? FALLBACK

  const { error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      bg_color: nextColor.bg,
      text_color: nextColor.text,
      is_default: false,
    })

  if (error) {
    console.error('Failed to add category:', error)
    throw error
  }

  return getCategories()
}

// 删除分类
export async function removeCategory(name: string): Promise<CategoryInfo[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', user.id)
    .eq('name', name)

  if (error) {
    console.error('Failed to remove category:', error)
    throw error
  }

  return getCategories()
}

// 更新分类颜色
export async function updateCategoryColor(name: string, bg: string, text: string): Promise<CategoryInfo[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('categories')
    .update({ bg_color: bg, text_color: text })
    .eq('user_id', user.id)
    .eq('name', name)

  if (error) {
    console.error('Failed to update category color:', error)
    throw error
  }

  return getCategories()
}
