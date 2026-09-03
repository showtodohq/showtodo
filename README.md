# ptdl-alpha (公开可围观的 Todo 协同应用)

一个任何人都可以发布、任何人都公开可见、支持多视图协同展现与互动的轻量公开 Todo 应用。

---

## 📖 核心文档索引

- 💡 **需求与产品设计**: [`idea/0826.md`](./idea/0826.md)
- 🔌 **REST API 规范文档**: [`docs/api.md`](./docs/api.md)
- 🏗️ **后端架构与开发指南**: [`docs/architecture.md`](./docs/architecture.md)
- 🎨 **前端架构与开发规范**: [`docs/frontend-architecture.md`](./docs/frontend-architecture.md)

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

1. **公开透明协同**：所有待办全网公开可见，不可隐藏，支持多创作者公开见证与协同；
2. **免密码极简模式**：输入邮箱即可发布与表态，系统自动建号并关联身份凭证；
3. **四态自由流转与重开机制**：支持 `pending`（待办中）、`in_progress`（推进中）、`done`（已达成）、`abandoned`（已放弃）全向双向流转，支持二元快捷打卡与悬停四态直达；
4. **分类即时流筛选与创作闭环**：点击分类徽标即时过滤动态流并同步 URL 参数，同时联动顶部快速发布框自动预选；
5. **多人同行聚合 (Topic Hash)**：基于内容寻址哈希机制，自动聚合相同目标的待办事项，实现平权协同与精准参与状态互斥；
6. **社交互动与围观表态**：支持轻量表情反应（Reactions），提供即时互动与同伴激励。

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
# 运行校验与单元测试
npx vitest run src/lib/server/__tests__/validation.test.ts

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
│   ├── architecture.md         # 后端架构设计与开发指南
│   └── frontend-architecture.md# 前端架构设计与组件规范
├── src/
│   ├── lib/
│   │   ├── components/         # Svelte 5 领域与基础组件
│   │   │   ├── todo/           # 待办领域组件 (TodoItem, TodoCheckbox, TodoContent, TodoComposer, CategoryBadge, ReactionButton)
│   │   │   ├── user/           # 用户领域组件 (UserAvatarTooltip, UserPopover)
│   │   │   ├── widgets/        # 侧边栏微件 (MyTodayWidget, TrendingTopicsWidget)
│   │   │   └── ui/             # 通用原子 UI (Avatar, Button, Input, Modal, Spinner, Toast)
│   │   ├── constants/          # 分类、状态机与流转规则配置
│   │   ├── utils/              # format.ts 格式化、mutation.ts 乐观更新、confetti.ts 彩屑
│   │   ├── services/           # REST API Client 与 HTTP 请求封装
│   │   ├── stores/             # Svelte 5 全局 Runes 状态 (user, theme, toast)
│   │   └── server/             # 后端业务核心代码
│   │       ├── db/             # Drizzle Schema 与数据库连接
│   │       ├── services/       # 业务服务层 (user, todo, reaction)
│   │       ├── errors.ts       # 统一错误处理与 AppError
│   │       └── validation.ts   # 请求参数与状态流转校验
│   └── routes/
│       ├── +layout.svelte      # 全局 App Shell、Header、Footer 与 Toast 容器
│       ├── +page.svelte        # 极简公开待办动态流与协同工作区 (/)
│       ├── +error.svelte       # 友好错误拦截页
│       └── api/                # RESTful API 路由 (+server.ts)
└── drizzle.config.ts           # Drizzle 配置文件
```
