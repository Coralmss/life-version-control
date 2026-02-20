# Life Version Control - 个人生命版本管理

响应式 Web 应用，支持跨设备同步。首发阶段重点适配移动端 (H5)，兼容 PC 端。

## 技术栈

- **前端**: Next.js 14 (App Router) + React + TypeScript
- **样式**: Tailwind CSS + shadcn/ui 风格组件
- **图标**: Lucide React
- **后端**: Supabase (PostgreSQL + Auth)
- **部署**: Vercel
- **PWA**: 支持离线访问和添加到主屏幕

## 功能特性

1. **时间管理**
   - 计时器模式：输入任务 → 点击开始 → 结束计时
   - 手动添加：补充历史记录或计划未来时间

2. **分类标记**
   - 状态分类：深度工作 / 浅层处理 / 休息放松 / 无意识摸鱼
   - 精力标记：极度耗能(-1) / 感觉平平(0) / 满血复活(+1)
   - 自定义分类：支持添加个性化分类并配置颜色

3. **数据可视化**
   - 时间占比饼图（日/周视图）
   - 时间花费柱状图
   - 时间块日历视图

4. **跨设备同步**
   - Supabase 数据库存储
   - 邮箱 Magic Link 登录
   - 无需密码，简单安全

5. **PWA 支持**
   - 可添加到手机主屏幕
   - 离线缓存支持
   - 类原生应用体验

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 Supabase 配置

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 部署

详见 [DEPLOY.md](./DEPLOY.md)

快速步骤：
1. 创建 Supabase 项目并执行 SQL 初始化
2. 推送代码到 GitHub
3. 在 Vercel 导入项目并配置环境变量
4. 部署完成！

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 根布局（含 AuthProvider）
│   ├── page.tsx            # 主页面
│   ├── login/page.tsx      # 登录页面
│   └── globals.css
├── components/             # React 组件
│   ├── AuthProvider.tsx    # 认证状态管理
│   ├── ServiceWorker.tsx   # PWA 注册
│   ├── FocusTab.tsx        # 计时器功能
│   ├── HistoryTab.tsx      # 历史记录
│   ├── SummaryTab.tsx      # 数据汇总
│   └── ...
├── lib/                    # 工具函数
│   ├── supabase.ts         # Supabase 客户端
│   ├── supabaseStorage.ts  # 数据存储 API
│   └── supabaseCategories.ts # 分类管理 API
└── types/
    └── index.ts            # TypeScript 类型
```

## 数据库 Schema

### time_records
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID (外键) |
| task_name | TEXT | 任务名称 |
| start_time | TIMESTAMPTZ | 开始时间 |
| end_time | TIMESTAMPTZ | 结束时间 |
| duration | INTEGER | 时长（秒）|
| category | TEXT | 分类 |
| energy_level | SMALLINT | 精力标记 (-1/0/1) |

### categories
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID (外键) |
| name | TEXT | 分类名称 |
| bg_color | TEXT | 背景色 |
| text_color | TEXT | 文字色 |
| is_default | BOOLEAN | 是否默认分类 |

## 许可证

MIT License
