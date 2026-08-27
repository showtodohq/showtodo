# ptdl-alpha (公开可围观的 Todo 协同应用)

一个任何人都可以发布、任何人都公开可见、支持多视图协同展现与互动的轻量公开 Todo 应用。

---

## 📖 核心文档索引

- 💡 **需求与产品设计**: [`idea/0826.md`](./idea/0826.md)
- 🔌 **REST API 规范文档**: [`docs/api.md`](./docs/api.md)
- 💻 **前端架构与组件指南**: [`docs/frontend.md`](./docs/frontend.md)
- 🏗️ **后端架构与开发指南**: [`docs/architecture.md`](./docs/architecture.md)

---

## 🛠️ 技术栈

- **全栈框架**: [SvelteKit 2](https://kit.svelte.dev/) + [Svelte 5 Runes](https://svelte.dev/) (`$state`, `$derived`, `$props`, `$effect`)
- **类型系统**: TypeScript 6
- **样式方案**: Tailwind CSS v4 + `@tailwindcss/forms`
- **图标方案**: `@iconify/svelte` (Lucide)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **数据库**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **测试框架**: [Vitest](https://vitest.dev/)

---

## ✨ 核心特性

1. **多用户协同周日历矩阵 (Week Calendar Matrix)**：
   - **横向时间轴**：以当前自然周（周一至周日 Mon~Sun）为视窗，自动高亮今日；
   - **纵向创作者泳道**：仅精准展示本周有待办的活跃创作者，无多余空行；当前登录用户泳道始终置顶在第 1 行；
   - **左侧用户列 Sticky 固定**：桌面端展示完整头像与名称（180px），移动端仅保留头像（56px），最大化移动端可用可视宽度。
2. **纯文本彩色待办胶囊 (Todo Pill)**：
   - 根据 6 大分类分配柔和色彩体系；
   - **`in_progress`（进行中）**：带有呼吸灯发光边框动效 (`animate-pulse-glow`) 并置顶；
   - **`done`（已完成）/ `abandoned`（已放弃）**：文字带有删除线；
   - 单元格单天超过 3 条自动折叠显示 `+N more`。
3. **一体化周导航与快速日期选择**：
   - `‹` 上一周、`Today` 回到今天、`›` 下一周；
   - 日期胶囊指示器支持直接点击调出 DatePicker 选择任意日期并平滑跳转到对应周。
4. **免密码 WordPress 评论模式**：输入邮箱即可发布与表态，自动建号关联；右下角悬浮按钮 FAB `+` 与格子内悬停快速创建。

---

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
在项目根目录创建或编辑 `.env` 文件：
```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
```

### 3. 同步数据库结构
```bash
npm run db:push
```

### 4. 启动本地开发服务
```bash
npm run dev
```
服务将在 `http://localhost:3003` 启动。

---

## 🧪 常用测试与质量命令

```bash
# 运行日历工具函数测试
npx vitest run src/lib/utils/__tests__/calendar.test.ts

# 运行全量类型与 Svelte 5 检查
npm run check

# 生产构建打包
npm run build
```

---

## 📁 目录结构概览

```
├── docs/                       # 项目设计与架构文档
│   ├── api.md                  # RESTful API 接口规范
│   ├── frontend.md             # 前端日历架构与组件规范
│   └── architecture.md         # 后端架构设计与开发指南
├── src/
│   ├── lib/
│   │   ├── components/         # Svelte 5 原子与业务组件
│   │   │   ├── calendar/       # 日历核心组件 (Matrix, Toolbar, UserRow, Cell, Pill)
│   │   │   ├── common/         # Avatar, Badge, Modal, Toast
│   │   │   ├── todo/           # 待办详情、Reaction、新建弹窗
│   │   │   └── user/           # UserIdentityBar, UserProfileModal
│   │   ├── constants/          # 分类、状态机与表情配置
│   │   ├── utils/              # calendar.ts 周计算与排序工具
│   │   ├── services/           # REST API Client 与 DiceBear Avatar
│   │   ├── stores/             # Svelte 5 全局 Runes 状态 (User/Toast)
│   │   └── server/             # 后端业务核心代码
│   │       ├── db/             # Drizzle Schema 与数据库连接
│   │       ├── services/       # 业务服务层 (User/Todo/Reaction)
│   │       ├── errors.ts       # 统一错误处理
│   │       └── validation.ts   # 请求参数校验
│   └── routes/
│       ├── +layout.svelte      # 全局宽幅 Header、Footer 与 Toast 容器
│       ├── +page.svelte        # 周日历协同看板首页 (/)
│       ├── +error.svelte       # 友好错误拦截页
│       └── api/                # API 路由 (+server.ts)
└── drizzle.config.ts           # Drizzle 配置文件
```
