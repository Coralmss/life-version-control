"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // 检查是否已登录
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/")
      } else {
        setCheckingAuth(false)
      }
    })
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    })

    setLoading(false)

    if (error) {
      setMessage("发送失败: " + error.message)
    } else {
      setMessage("登录链接已发送至邮箱，请查收")
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Life Version Control</h1>
          <p className="text-sm text-muted-foreground">记录时间，掌控精力</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-center">登录</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发送中...
                </>
              ) : (
                "发送登录链接"
              )}
            </Button>
          </form>

          {message && (
            <p className={`text-sm text-center ${message.includes("失败") ? "text-red-500" : "text-green-600"}`}>
              {message}
            </p>
          )}

          <p className="text-xs text-muted-foreground text-center">
            输入邮箱后，我们会发送一个登录链接到您的邮箱
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-lg mb-1">⏱️</div>
            <div>时间追踪</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-lg mb-1">📊</div>
            <div>数据分析</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-lg mb-1">☁️</div>
            <div>云端同步</div>
          </div>
        </div>
      </div>
    </div>
  )
}
