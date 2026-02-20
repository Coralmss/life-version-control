"use client"

import { Timer, ClipboardList, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

export type TabId = "focus" | "history" | "summary"

interface TabNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "focus", label: "时间管理", icon: Timer },
  { id: "history", label: "今日记录", icon: ClipboardList },
  { id: "summary", label: "时间汇总", icon: BarChart3 },
]

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <>
      {/* 移动端：底部 Tab */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors",
                activeTab === id
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", activeTab === id && "text-primary")} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* PC 端：顶部 Tab */}
      <nav className="hidden md:flex items-center gap-1 border-b border-border bg-background -mx-4 px-4 -mt-2 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === id
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}
