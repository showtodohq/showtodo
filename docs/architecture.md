# Public Todo — 后端架构与开发指南 (MVP)

本文档面向后端开发者、运维及架构评审人员，全面介绍 Public Todo 的系统架构设计、数据建模、业务设计模式、测试矩阵及开发运维指南。

---

## 1. 架构总览

### 1.1 技术选型

| 维度 | 选型 | 版本/方案 | 说明 |
|---|---|---|---|
| 框架 | SvelteKit (API Endpoints) | ^2.63.0 | 统一前后端全栈，采用 `+server.ts` 承接 API |
| 运行时语言 | TypeScript | ^6.0.3 | 严格类型检查 (`strict: true`) |
| ORM | Drizzle ORM | ^0.45.2 | 轻量类型安全，SQL 友好 |
| 数据库 | Neon Serverless PostgreSQL | PostgreSQL 16+ | 远程云端 Serverless 数据库 |
| 数据库驱动 | `@neondatabase/serverless` | ^1.1.0 | neon-http 无连接池限制查询 |
| 单元/集成测试 | Vitest | ^4.1.8 | Node.js 环境，单进程串行隔离 |

---

### 1.2 分层架构

```
┌────────────────────────────────────────────────────────┐
│                   Client (Frontend / API Caller)        │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON Request
                            ▼
┌────────────────────────────────────────────────────────┐
│          SvelteKit Route Handlers (src/routes/api)      │
│  - 参数解析 & 数据校验 (src/lib/server/validation.ts)      │
│  - 统一异常捕获与响应 (src/lib/server/errors.ts)          │
└───────────────────────────┬────────────────────────────┘
                            │ DTO / Typed Parameters
                            ▼
┌────────────────────────────────────────────────────────┐
│             Service Layer (src/lib/server/services)    │
│  - user.service.ts     : 账号解析、自动建号、资料维护        │
│  - todo.service.ts     : 状态流转、Note隐私脱敏、游标分页  │
│  - reaction.service.ts : 表情防重、分组聚合、批量计数      │
└───────────────────────────┬────────────────────────────┘
                            │ Drizzle DB Instance (DI)
                            ▼
┌────────────────────────────────────────────────────────┐
│           Data Layer (src/lib/server/db/schema.ts)     │
│  - Drizzle Schema / Enums / Relations                  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP SQL Pipeline
                            ▼
┌────────────────────────────────────────────────────────┐
│             Neon Serverless PostgreSQL DB              │
└────────────────────────────────────────────────────────┘
```

**设计要点**：
1. **依赖注入 (DI)**：Service 函数均显式接收 `db: Database` 参数，便于在单元测试与集成测试中注入特定客户端或事务实例。
2. **轻量校验**：自建校验模块 `validation.ts`，零外部依赖，极速冷启动。
3. **统一错误流**：自定义 `AppError` 显式承载业务错误码与 HTTP Status，Route Handler 仅需包裹 `handleError(e)`。

---

## 2. 数据建模与实体设计

### 2.1 ER 关系图

```
┌──────────────────────┐         1:N         ┌──────────────────────┐
│        users         │────────────────────<│        todos         │
├──────────────────────┤                     ├──────────────────────┤
│ id (PK, UUID)        │                     │ id (PK, UUID)        │
│ email (UK, text)     │                     │ author_id (FK->users)│
│ nickname (text)      │                     │ content (text)       │
│ avatar (text, null)  │                     │ note (text, null)    │
│ created_at (tz)      │                     │ is_note_public (bool)│
│ updated_at (tz)      │                     │ category (text, null)│
└──────────────────────┘                     │ status (todo_status) │
           │                                 │ start_date (date)    │
           │ 1:N                             │ due_date (date, null)│
           │                                 │ created_at (tz)      │
           ▼                                 │ updated_at (tz)      │
┌──────────────────────┐                     └──────────────────────┘
│      reactions       │                                │
├──────────────────────┤                                │ 1:N (Cascade Delete)
│ id (PK, UUID)        │                                │
│ todo_id (FK->todos)  │<───────────────────────────────┘
│ user_id (FK->users)  │
│ emoji (text)         │
│ created_at (tz)      │
│ [UK: todo,user,emoji]│
└──────────────────────┘
```

---

### 2.2 表结构定义 (`schema.ts`)

#### 1. `users` (用户表)
| 字段 | Drizzle 类型 | PostgreSQL 类型 | 约束 / 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `uuid` | `uuid` | PK, `gen_random_uuid()` | 用户主键 |
| `email` | `text` | `text` | NOT NULL, UNIQUE | 邮箱（唯一业务标识） |
| `nickname` | `text` | `text` | NOT NULL | 昵称（默认邮箱前缀） |
| `avatar` | `text` | `text` | NULL | 自定义头像 URL |
| `created_at` | `timestamp` | `timestamptz` | NOT NULL, `now()` | 创建时间 |
| `updated_at` | `timestamp` | `timestamptz` | NOT NULL, `now()`, auto-update | 更新时间 |
| `last_todo_updated_at` | `timestamp` | `timestamptz` | NULL | 最近一次 Todo 更新时间 |

#### 2. `todos` (待办表)
| 字段 | Drizzle 类型 | PostgreSQL 类型 | 约束 / 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `uuid` | `uuid` | PK, `gen_random_uuid()` | Todo 主键 |
| `content` | `text` | `text` | NOT NULL | Todo 主题内容 (<=1000) |
| `note` | `text` | `text` | NULL | 备注/描述 (<=5000) |
| `is_note_public` | `boolean` | `boolean` | NOT NULL, `true` | 备注是否对他人公开 |
| `category` | `text` | `text` | NULL | 静态分类标签 ID |
| `author_id` | `uuid` | `uuid` | NOT NULL, FK(`users.id`) | 关联作者 |
| `status` | `todo_status` | `enum` | NOT NULL, `'pending'` | 状态机字段 |
| `start_date` | `date` | `date` | NOT NULL, `now()` | 开始日期 |
| `due_date` | `date` | `date` | NULL | 截止日期 |
| `created_at` | `timestamp` | `timestamptz` | NOT NULL, `now()` | 创建时间 |
| `updated_at` | `timestamp` | `timestamptz` | NOT NULL, `now()`, auto-update | 更新时间 |

#### 3. `reactions` (表情反应表)
| 字段 | Drizzle 类型 | PostgreSQL 类型 | 约束 / 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `uuid` | `uuid` | PK, `gen_random_uuid()` | 主键 |
| `todo_id` | `uuid` | `uuid` | NOT NULL, FK(`todos.id` ON DELETE CASCADE) | 关联 Todo |
| `user_id` | `uuid` | `uuid` | NOT NULL, FK(`users.id`) | 反应人 |
| `emoji` | `text` | `text` | NOT NULL | Emoji 内容 (`👀`,`🔥`,`💪`,`👏`) |
| `created_at` | `timestamp` | `timestamptz` | NOT NULL, `now()` | 创建时间 |

**联合唯一索引**: `UNIQUE("todo_id", "user_id", "emoji")` 保证同一用户对同一 Todo 的同种表情不能重复添加。

---

## 3. 核心机制与业务设计

### 3.1 WordPress 评论模式（自动注册与关联）
```
Client Request (传入 email)
         │
         ▼
[userService.findOrCreate(db, email)]
         │
    email 存在?
   ├── 是 ──> 返回已有 user 实体
   └── 否 ──> 提取 nickname = email.split('@')[0]
              写入 users 表并返回新 user 实体
         │
         ▼
执行 Todo / Reaction 业务操作
```

### 3.2 Todo 状态机模型 (Status Transition)
```
          ┌─────────────┐
          │   pending   │
          └──────┬──────┘
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
┌────────────┐ ┌────┐ ┌───────────┐
│in_progress │ │done│ │ abandoned │
└──────┬─────┘ └────┘ └───────────┘
       │
   ┌───┴───┐
   ▼       ▼
┌────┐ ┌───────────┐
│done│ │ abandoned │
└────┘ └───────────┘
```
- 终态规则：`done` 与 `abandoned` 为不可逆终态，禁止反向迁移回 `pending` 或 `in_progress`。
- `in_progress` 不允许倒退回 `pending`。
- 校验由 `validateStatusTransition(from, to)` 在 Service 更新时拦截并抛出 `400 INVALID_STATUS_TRANSITION`。

### 3.3 Note 隐私脱敏机制
- 数据持久化时完整存储用户提交的 `note` 与 `is_note_public`。
- 数据对外读取时（`findById` 与 `list`）：
  ```ts
  function sanitizeNote<T extends { note: string | null; isNotePublic: boolean }>(todo: T): T {
    if (!todo.isNotePublic) {
      return { ...todo, note: null };
    }
    return todo;
  }
  ```
  保证前端列表页及详情页在不暴露敏感信息的同时，结构保持一致。

### 3.4 游标分页 (Cursor-based Pagination)
- 放弃性能随偏移量增长衰退的 `OFFSET` 分页，采用基于 `created_at` 降序的游标分页机制。
- 客户端传入上一页最后一条记录的 `cursor: todo.id`。
- 后端查询时取出 `cursor` 对应记录的 `createdAt`，追加 `WHERE created_at < cursor.created_at`。
- 通过查询 `limit + 1` 条数据判定是否存在下一页并派发 `nextCursor`。

### 3.5 Reaction 高效聚合与批量计数
- 列表场景通过 `inArray(reactions.todoId, todoIds)` 批量 `GROUP BY todo_id, emoji` 获取各卡片点赞统计，消除 N+1 查询。
- 单卡详情场景通过聚合查询分组并带出参与点赞的用户昵称列表。

---

## 4. 测试体系与测试矩阵

项目使用 **Vitest** 作为测试驱动引擎，目前后端覆盖了 **138 个全场景自动化测试用例**。

### 4.1 测试分布明细

```
src/lib/server/__tests__/
├── setup.ts                 # 数据库初始化、环境变量注入、cleanDatabase 工具
├── validation.test.ts       # [77 用例] 所有输入边界、枚举校验、状态机流转矩阵
├── user.service.test.ts     # [12 用例] 用户创建、查重、资料修改、权限防御
├── todo.service.test.ts     # [27 用例] Todo CRUD、隐私脱敏、多条件筛选、分页流转
└── reaction.service.test.ts # [15 用例] 表情反应、去重、反选取消、多用户聚合统计
```

### 4.2 核心覆盖场景一览

| 模块 | 测试场景 | 预期断言 |
|---|---|---|
| **输入校验** | 邮箱/内容/备注/分类/表情/日期/UUID/Limit | 严格正则与边界限制，非法输入抛出 `AppError('VALIDATION_ERROR')` |
| **状态机流转** | 16 种完整状态迁移组合 | 合法路径放行；所有倒退与非法路径抛出 `INVALID_STATUS_TRANSITION` |
| **用户体系** | 新老邮箱建号、更新头像/昵称 | 幂等建号；非本人修改抛出 `FORBIDDEN` |
| **Todo 核心** | 创建/详情/修改/删除 | 默认字段填充；非作者修改拦截；时间戳自动维护 |
| **列表与分页** | 状态/分类/作者混合筛选、游标连续分页 | 过滤准确无遗漏；`nextCursor` 准确切页；全局 `created_at DESC` 稳定排序 |
| **隐私保护** | `isNotePublic: false` | 列表和详情均强制脱敏为 `note: null` |
| **Reaction 互动** | 添加/取消/防重复/批量计数 | 唯一键冲突拦截抛出 `DUPLICATE_REACTION`；批量统计无 N+1 |

---

## 5. 本地开发与运维指南

### 5.1 环境变量配置
在项目根目录创建 `.env`：
```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
```

### 5.2 常用命令清单

```bash
# 1. 启动本地开发服务 (默认端口 3003)
npm run dev

# 2. 推送 Drizzle Schema 到数据库
npm run db:push

# 3. 启动 Drizzle Studio 可视化管理界面
npm run db:studio

# 4. 执行后端全部测试套件
npx vitest run --project server

# 5. 执行特定测试文件
npx vitest run src/lib/server/__tests__/todo.service.test.ts

# 6. 全量类型与代码规范检查
npm run check
```
