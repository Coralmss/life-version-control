/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 原生支持 Next.js，无需特殊输出配置
  // 保留默认的 SSR 行为以支持 Supabase Auth

  // 环境变量将在 Vercel 控制台中配置
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

module.exports = nextConfig
