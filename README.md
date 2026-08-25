# Public Todo (公开可围观的 Todo List)

一个任何人都可以发布、任何人都公开可见、可围观互动的轻量公开 Todo 应用。

---

## 📖 核心文档索引

- 💡 **需求与产品设计**: [`idea/0826.md`](./idea/0826.md)
- 🔌 **REST API 规范文档**: [`docs/api.md`](./docs/api.md)
- 🏗️ **后端架构与开发指南**: [`docs/architecture.md`](./docs/architecture.md)

---

## 🛠️ 技术栈

- **全栈框架**: [SvelteKit 2](https://kit.svelte.dev/) + [Svelte 5 Runes](https://svelte.dev/)
- **类型系统**: TypeScript 6
- **样式方案**: Tailwind CSS v4
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

# 运行前端/E2E 测试
npm run test:e2e
```

---

## 📁 目录结构概览

```
├── docs/                       # 项目架构与 API 对接文档
│   ├── api.md                  # RESTful API 接口规范
│   └── architecture.md         # 后端架构设计与开发指南
├── idea/                       # 原始需求与产品原型设计
│   └── 0826.md                 # 0826 MVP 数据模型与流转规范
├── src/
│   ├── lib/
│   │   └── server/             # 后端业务核心代码
│   │       ├── db/             # Drizzle Schema 与数据库连接
│   │       ├── services/       # 业务逻辑服务层 (User/Todo/Reaction)
│   │       ├── errors.ts       # 统一错误处理与标准响应
│   │       ├── validation.ts   # 请求参数校验与状态流转机
│   │       └── __tests__/      # 全场景覆盖自动化测试用例
│   └── routes/
│       └── api/                # SvelteKit API 路由端点 (+server.ts)
│           ├── todos/          # Todo CRUD 与 Reaction 路由
│           ├── users/          # 用户信息查询与维护
│           └── health/         # 服务健康检测
└── drizzle.config.ts           # Drizzle 配置文件
```
