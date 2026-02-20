# Life Version Control - 部署指南

## 架构概述

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   用户设备      │────▶│   Vercel        │────▶│   Supabase      │
│  (浏览器/PWA)   │◄────│   (Next.js)     │◄────│   (PostgreSQL)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         └───────────────────────────────────────────────┘
                         Auth (Magic Link)
```

---

## 第一步：创建 Supabase 项目

### 1.1 注册 Supabase
1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 使用 GitHub 账号登录

### 1.2 创建新项目
1. 点击 "New project"
2. 填写信息：
   - **Organization**: 选择或创建组织
   - **Project name**: `life-version-control`
   - **Database Password**: 生成强密码（保存好！）
   - **Region**: 选择 `Southeast Asia (Singapore)` 或 `East Asia (Taiwan)`
3. 点击 "Create new project"
4. 等待数据库初始化（约 2-3 分钟）

### 1.3 创建数据表

进入项目后，点击左侧 **SQL Editor**，新建查询，执行以下 SQL：

```sql
-- 创建时间记录表
CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- 秒数
  category TEXT NOT NULL,
  energy_level SMALLINT NOT NULL CHECK (energy_level IN (-1, 0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建分类表
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 创建索引优化查询
CREATE INDEX idx_time_records_user_id ON time_records(user_id);
CREATE INDEX idx_time_records_start_time ON time_records(start_time);
CREATE INDEX idx_time_records_user_start ON time_records(user_id, start_time);
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- 启用 RLS (Row Level Security)
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能看到自己的数据
CREATE POLICY "Users can only see own time_records"
  ON time_records FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only see own categories"
  ON categories FOR ALL
  USING (auth.uid() = user_id);
```

### 1.4 配置认证（Auth）

1. 点击左侧 **Authentication** → **Providers**
2. 找到 **Email** 提供商，确保已启用
3. 配置：
   - **Confirm email**: 关闭（使用 Magic Link 无需确认）
   - **Double confirm email**: 关闭
4. 点击 **URL Configuration**：
   - **Site URL**: `https://your-app.vercel.app`（先用占位符，部署后更新）
   - **Redirect URLs**: 添加 `https://your-app.vercel.app/**`

### 1.5 获取 API 密钥

1. 点击左侧 **Project Settings** → **API**
2. 记录以下信息：
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 第二步：部署到 Vercel

### 2.1 推送代码到 GitHub

```bash
# 在项目根目录执行
git init
git add .
git commit -m "Initial commit: Supabase + Auth + PWA"

# 在 GitHub 创建新仓库（不要初始化 README）
# 然后执行：
git remote add origin https://github.com/YOUR_USERNAME/life-version-control.git
git branch -M main
git push -u origin main
```

### 2.2 在 Vercel 部署

1. 访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 **Add New Project**
4. 导入 `life-version-control` 仓库
5. 配置：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
6. 点击 **Environment Variables**，添加：
   - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 Supabase anon key
7. 点击 **Deploy**

### 2.3 更新 Supabase 回调 URL

部署成功后：

1. 复制 Vercel 分配的域名（如 `https://life-version-control.vercel.app`）
2. 回到 Supabase → Authentication → URL Configuration
3. 更新：
   - **Site URL**: `https://life-version-control.vercel.app`
   - **Redirect URLs**: `https://life-version-control.vercel.app/**`

---

## 第三步：绑定自定义域名（可选）

### 3.1 在 Vercel 添加域名

1. 进入 Vercel 项目 → **Settings** → **Domains**
2. 输入你的域名（如 `lvc.yourdomain.com`）
3. 按照提示配置 DNS 记录

### 3.2 更新 Supabase 回调 URL

如果使用自定义域名，再次更新 Supabase 的 URL Configuration。

---

## 第四步：测试应用

### 4.1 功能测试清单

- [ ] 访问登录页 `/login`
- [ ] 输入邮箱，收到 Magic Link
- [ ] 点击邮件链接，自动登录跳转
- [ ] 添加时间记录
- [ ] 查看历史记录
- [ ] 查看汇总统计
- [ ] 退出登录

### 4.2 PWA 测试

1. Chrome DevTools → **Lighthouse** → 运行 PWA 审计
2. 手机测试：
   - 访问网站
   - 点击 "添加到主屏幕"
   - 确认图标显示正常
   - 离线模式下检查缓存

---

## 项目结构

```
life-version-control/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根布局（含 AuthProvider）
│   │   ├── page.tsx            # 主页面
│   │   ├── login/
│   │   │   └── page.tsx        # 登录页面
│   │   └── globals.css
│   ├── components/
│   │   ├── AuthProvider.tsx    # 认证状态管理
│   │   ├── ServiceWorker.tsx   # PWA Service Worker 注册
│   │   ├── FocusTab.tsx        # 计时器功能
│   │   ├── HistoryTab.tsx      # 历史记录
│   │   ├── SummaryTab.tsx      # 数据汇总
│   │   ├── ManualTimeEntry.tsx # 手动添加记录
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts         # Supabase 客户端
│   │   ├── supabaseStorage.ts  # 数据存储 API
│   │   └── supabaseCategories.ts # 分类管理 API
│   └── types/
│       └── index.ts            # 类型定义
├── public/
│   └── manifest.json           # PWA 配置
└── DEPLOY.md                   # 本文件
```

---

## 环境变量参考

| 变量名 | 说明 | 获取位置 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase → Project Settings → API |

---

## 故障排查

### 登录链接无法打开
- 检查 Supabase URL Configuration 中的 Site URL 是否正确
- 确认邮件没有被拦截到垃圾邮件

### 数据不显示
- 检查浏览器控制台是否有 Supabase 连接错误
- 确认环境变量已正确设置

### PWA 无法安装
- 检查 manifest.json 是否可访问
- 确认 HTTPS 已启用（Vercel 默认启用）

---

## 费用说明

### Supabase 免费层限制
- 数据库：500 MB
- 带宽：2 GB/月
- API 请求：无限（但有速率限制）
- Auth 用户：无限

### Vercel 免费层限制
- 部署：无限
- 带宽：100 GB/月
- 构建时间：6000 分钟/月

对于个人使用，免费层完全足够。
