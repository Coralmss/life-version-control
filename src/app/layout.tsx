import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { ServiceWorker } from "@/components/ServiceWorker"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Life Version Control - 个人生命版本管理",
  description: "记录你的时间与精力，掌控每一天",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <AuthProvider>
          <main className="min-h-screen max-w-lg mx-auto px-4 py-6">
            {children}
          </main>
        </AuthProvider>
        <ServiceWorker />
      </body>
    </html>
  )
}
