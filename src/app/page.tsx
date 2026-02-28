"use client"

import { useState, useCallback } from "react"
import { LogOut } from "lucide-react"
import { TabNav, type TabId } from "@/components/TabNav"
import { FocusTab } from "@/components/FocusTab"
import { HistoryTab } from "@/components/HistoryTab"
import { SummaryTab } from "@/components/SummaryTab"
import { useAuth } from "@/components/AuthProvider"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("focus")
  const [refreshKey, setRefreshKey] = useState(0)
  const { signOut } = useAuth()

  const handleRecordSaved = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="pt-2 pb-2 md:pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Life Version Control</h1>
            <p className="text-sm text-muted-foreground mt-0.5">记录时间，掌控精力</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 pb-20 md:pb-8">
        {/* FocusTab 始终挂载，用 CSS 隐藏，防止切换Tab丢失计时状态 */}
        <div style={{ display: activeTab === "focus" ? "block" : "none" }}>
          <FocusTab onRecordSaved={handleRecordSaved} />
        </div>
        {activeTab === "history" && <HistoryTab refreshKey={refreshKey} />}
        {activeTab === "summary" && <SummaryTab refreshKey={refreshKey} />}
      </div>
    </div>
  )
}
