# Public Todo (公开可围观的 Todo List)

一个任何人都可以发布、任何人都公开可见、可围观互动的轻量公开 Todo 应用。

---

## 📖 核心文档索引

- 💡 **需求与产品设计**: [`idea/0826.md`](./idea/0826.md)
- 🔌 **REST API 规范文档**: [`docs/api.md`](./docs/api.md)
- 💻 **前端架构与对接指南**: [`docs/frontend.md`](./docs/frontend.md)
- 🏗️ **后端架构与开发指南**: [`docs/architecture.md`](./docs/architecture.md)

---

## 🛠️ 技术栈

- **全栈框架**: [SvelteKit 2](https://kit.svelte.dev/) + [Svelte 5 Runes](https://svelte.dev/)
- **类型系统**: TypeScript 6
- **样式方案**: Tailwind CSS v4 + `@tailwindcss/forms`
- **图标方案**: `@iconify/svelte`
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **数据库**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **测试框架**: [Vitest](https://vitest.dev/) (Unit/Integration) + [Playwright](https://playwright.dev/) (E2E)

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

## 🧪 测试命令

```bash
# 运行后端所有单元/集成测试 (138 个测试用例)
npx vitest run --project server

# 运行特定测试模块
npx vitest run src/lib/server/__tests__/validation.test.ts
npx vitest run src/lib/server/__tests__/user.service.test.ts
npx vitest run src/lib/server/__tests__/todo.service.test.ts
npx vitest run src/lib/server/__tests__/reaction.service.test.ts

# 运行类型与 Svelte 检查
npm run check

# 运行生产打包验证
npm run build
```

---

## 📁 目录结构概览

```
├── docs/                       # 项目架构与前后端对接文档
│   ├── api.md                  # RESTful API 接口规范
│   ├── frontend.md             # 前端架构、Svelte 5 组件与路由规范
│   └── architecture.md         # 后端架构设计与开发指南
├── idea/                       # 原始需求与产品原型设计
│   └── 0826.md                 # 0826 MVP 数据模型与流转规范
├── src/
│   ├── lib/
│   │   ├── components/         # 前端 Svelte 5 原子与业务组件
│   │   │   ├── common/         # Avatar、Badge、Modal、Toast
│   │   │   ├── todo/           # CreateCard、TodoCard、TodoList、Filter
│   │   │   └── user/           # UserIdentityBar、UserProfileModal
│   │   ├── constants/          # 分类、状态机与表情配置
│   │   ├── services/           # REST API Client 与 DiceBear Avatar
│   │   ├── stores/             # Svelte 5 全局 Runes 状态 (User/Toast)
│   │   ├── types/              # 前端 TypeScript 类型定义
│   │   └── server/             # 后端业务核心代码
│   │       ├── db/             # Drizzle Schema 与数据库连接
│   │       ├── services/       # 业务逻辑服务层 (User/Todo/Reaction)
│   │       ├── errors.ts       # 统一错误处理与标准响应
│   │       ├── validation.ts   # 请求参数校验与状态流转机
│   │       └── __tests__/      # 全场景覆盖自动化测试用例
│   └── routes/
│       ├── +layout.svelte      # 全局 Header、Footer 与 Toast 容器
│       ├── +page.svelte        # 公开待办广场主页 (/)
│       ├── [userId]/
│       │   ├── +page.svelte    # 用户个人公开主页 (/[userId])
│       │   └── [todoId]/
│       │       └── +page.svelte# 单条 Todo 独立详情与围观页 (/[userId]/[todoId])
│       └── api/                # SvelteKit API 路由端点 (+server.ts)
│           ├── todos/          # Todo CRUD 与 Reaction 路由
│           ├── users/          # 用户信息查询与维护
│           └── health/         # 服务健康检测
└── drizzle.config.ts           # Drizzle 配置文件
```
