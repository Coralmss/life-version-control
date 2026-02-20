"use client"

import { useEffect } from "react"

export function ServiceWorker() {
  useEffect(() => {
    // PWA Service Worker 注册
    // 暂时禁用，保留 manifest.json 即可支持添加到主屏幕
    // 如需离线功能，后续可重新添加
  }, [])

  return null
}
