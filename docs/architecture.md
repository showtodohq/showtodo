# ptdl-alpha — 生产级后端架构与工程开发指南

> **文档状态**: 生产就绪 (Production Ready)  
> **适用对象**: 全栈/后端工程师、系统架构师、DBA、DevOps/SRE 工程师  
> **文档目标**: 提供 ptdl-alpha 系统的全景技术架构、物理数据模型字典、核心业务服务契约、并发安全机制、测试矩阵及 Serverless 数据库运维标准。

---

## 1. 系统架构总览

### 1.1 技术选型矩阵

| 模块 / 维度 | 选用技术 / 工具 | 版本 | 架构选型理由 |
|---|---|---|---|
| **全栈框架** | SvelteKit (Node.js/Edge) | ^2.63.0 | API Route 与 SSR 深度整合，原生端点路由 (+server.ts) |
| **编程语言** | TypeScript | ^6.0.3 | 严格类型检查 (`strict: true`)，端到端类型共享 |
| **ORM 框架** | Drizzle ORM | ^0.45.2 | 零运行时开销、类型安全、原生 SQL 友好、极速冷启动 |
| **数据库** | Neon Serverless PostgreSQL | PostgreSQL 16+ | 弹性扩缩容、计算存储分离、支持 HTTP Pipeline 查询 |
| **数据库驱动** | `@neondatabase/serverless` | ^1.1.0 | `neon-http` 模式，无传统连接池耗尽限制，适配 Serverless |
| **测试框架** | Vitest | ^4.1.8 | 多项目并发隔离测试、秒级执行 |

---

### 1.2 分层架构与数据流转

系统严格采用 **Controller-Service-Repository (Drizzle)** 三层解耦架构：

```
┌────────────────────────────────────────────────────────┐
│                   Client Request                        │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON / Query Params
                            ▼
┌────────────────────────────────────────────────────────┐
│      1. Controller Layer (src/routes/api)              │
│  - calendar/+server.ts : 周日历矩阵聚合入口 (User-First)│
│  - todos/+server.ts    : 待办增删改查 & 状态流转       │
│  - users/+server.ts    : 免密同步与资料维护             │
│  - validation.ts       : 纯函数参数校验与白名单过滤     │
│  - errors.ts           : 统一业务异常封装 (AppError)    │
└───────────────────────────┬────────────────────────────┘
                            │ DTO / Typed Arguments
                            ▼
┌────────────────────────────────────────────────────────┐
│      2. Service Layer (src/lib/server/services)        │
│  - user.service.ts     : 账号解析、按周活跃度去重检索  │
│  - todo.service.ts     : 范围查询、shortId防碰撞、脱敏 │
│  - reaction.service.ts : 表情防重、分组聚合、无N+1统计 │
└───────────────────────────┬────────────────────────────┘
                            │ Database Instance (DI)
                            ▼
┌────────────────────────────────────────────────────────┐
│      3. Data Access Layer (src/lib/server/db)          │
│  - schema.ts           : 物理表模型、枚举、Relations    │
│  - index.ts            : Drizzle 客户端连接实例初始化   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP SQL Pipeline
                            ▼
┌────────────────────────────────────────────────────────┐
│      4. Storage: Neon Serverless PostgreSQL            │
└────────────────────────────────────────────────────────┘
```

**关键设计原则**：
- **依赖注入 (Dependency Injection)**：所有 Service 函数均显式接收 `db: Database`，便于测试时注入 Mock 数据库或独立隔离的测试事务。
- **纯函数校验 (Zero-Dependency Validation)**：自建 `validation.ts`，基于原生 TypeScript 严格断言，避免引入重量级 schema 库带来的冷启动开销。
- **统一异常流 (Centralized Error Flow)**：自定义 `AppError` 显式承载业务错误码与 HTTP Status，Controller 统一通过 `handleError(e)` 输出标准 JSON 报文。

---

## 2. 物理数据模型与数据字典

### 2.1 ER 实体关系图

```
┌──────────────────────────────┐                1:N                 ┌──────────────────────────────┐
│            users             │───────────────────────────────────<│            todos             │
├──────────────────────────────┤                                    ├──────────────────────────────┤
│ id: uuid (PK)                │                                    │ id: uuid (PK)                │
│ email: text (UK)             │                                    │ short_id: text (UK)          │
│ handle: text (UK)            │                                    │ author_id: uuid (FK->users)  │
│ nickname: text               │                                    │ content: text                │
│ avatar: text (nullable)      │                                    │ note: text (nullable)        │
│ created_at: timestamptz      │                                    │ is_note_public: boolean      │
│ updated_at: timestamptz      │                                    │ category: text (nullable)    │
│ last_todo_updated_at: tz     │                                    │ status: todo_status (enum)   │
└──────────────────────────────┘                                    │ start_date: date             │
               │                                                    │ due_date: date (nullable)    │
               │ 1:N                                                │ created_at: timestamptz      │
               │                                                    │ updated_at: timestamptz      │
               ▼                                                    └──────────────────────────────┘
┌──────────────────────────────┐                                                   │
│          reactions           │                                                   │ 1:N (Cascade Delete)
├──────────────────────────────┤                                                   │
│ id: uuid (PK)                │                                                   │
│ todo_id: uuid (FK->todos)    │<──────────────────────────────────────────────────┘
│ user_id: uuid (FK->users)    │
│ emoji: text                  │
│ created_at: timestamptz      │
├──────────────────────────────┤
│ UK: (todo_id,user_id,emoji)  │
└──────────────────────────────┘
```

---

### 2.2 物理表结构字典 (`src/lib/server/db/schema.ts`)

#### 1. `users` (用户账号表)
| 字段名 | SQL 类型 | Drizzle 类型 | 约束与默认值 | 业务含义说明 |
|---|---|---|---|---|
| `id` | `uuid` | `uuid` | `PRIMARY KEY`, `defaultRandom()` | 用户全局唯一主键 |
| `email` | `text` | `text` | `NOT NULL`, `UNIQUE` | 邮箱（唯一身份与登录标识） |
| `handle` | `text` | `text` | `NOT NULL`, `UNIQUE` | 唯一英文用户名 (例如 alexchen) |
| `nickname` | `text` | `text` | `NOT NULL` | 用户展示昵称（默认邮箱前缀） |
| `avatar` | `text` | `text` | `NULL` | 自定义头像 URL（null 时前端用 DiceBear） |
| `created_at` | `timestamptz` | `timestamp` | `NOT NULL`, `defaultNow()` | 账号创建时间 |
| `updated_at` | `timestamptz` | `timestamp` | `NOT NULL`, `defaultNow()` | 账号资料最后修改时间 |
| `last_todo_updated_at` | `timestamptz` | `timestamp` | `NULL` | 最近一次发待办或打卡时间（用于活跃排序） |

#### 2. `todos` (公开待办事项表)
| 字段名 | SQL 类型 | Drizzle 类型 | 约束与默认值 | 业务含义说明 |
|---|---|---|---|---|
| `id` | `uuid` | `uuid` | `PRIMARY KEY`, `defaultRandom()` | 待办唯一主键 |
| `short_id` | `text` | `text` | `NOT NULL`, `UNIQUE` | 6~12 位短标识（用于短链接分享） |
| `content` | `text` | `text` | `NOT NULL` | 待办正文内容（1-1000 字符） |
| `note` | `text` | `text` | `NULL` | 详细规划/备注（<=5000 字符） |
| `is_note_public`| `boolean` | `boolean` | `NOT NULL`, `default(true)` | 备注是否全网公开（false 时脱敏） |
| `category` | `text` | `text` | `NULL` | 分类 ID (`study`,`fitness`,`dev`等) |
| `author_id` | `uuid` | `uuid` | `NOT NULL`, `REFERENCES users(id)` | 关联发布人外键 |
| `status` | `todo_status` | `pgEnum` | `NOT NULL`, `default('pending')` | 状态机字段 (`pending`,`in_progress`等) |
| `start_date` | `date` | `date` | `NOT NULL`, `defaultNow()` | 计划开始日期（日历矩阵 X 轴索引） |
| `due_date` | `date` | `date` | `NULL` | 计划截止日期 |
| `created_at` | `timestamptz` | `timestamp` | `NOT NULL`, `defaultNow()` | 记录创建时间 |
| `updated_at` | `timestamptz` | `timestamp` | `NOT NULL`, `defaultNow()` | 状态或内容最后更新时间 |

#### 3. `reactions` (围观表情反应表)
| 字段名 | SQL 类型 | Drizzle 类型 | 约束与默认值 | 业务含义说明 |
|---|---|---|---|---|
| `id` | `uuid` | `uuid` | `PRIMARY KEY`, `defaultRandom()` | 主键 |
| `todo_id` | `uuid` | `uuid` | `NOT NULL`, `FK(todos.id ON DELETE CASCADE)` | 关联 Todo（主待办删除时级联删除） |
| `user_id` | `uuid` | `uuid` | `NOT NULL`, `REFERENCES users(id)` | 表态人用户 ID |
| `emoji` | `text` | `text` | `NOT NULL` | 表情符号 (`👀`, `🔥`, `💪`, `👏`) |
| `created_at` | `timestamptz` | `timestamp` | `NOT NULL`, `defaultNow()` | 表态时间 |

##### 关键约束清单:
1. `UNIQUE("todo_id", "user_id", "emoji")`: 数据库级强保证同一用户对同一 Todo 的同款表情绝对不重复。
2. `CASCADE DELETE`: 删除待办时，自动在数据库底层清除其关联的所有 reactions，无孤儿数据。

---

## 3. 核心业务服务契约 (Service Layer Contracts)

---

### 3.1 用户服务 (`user.service.ts`)

#### 1. `findOrCreate(db, email): Promise<User>`
- **业务职责**: WordPress 评论免密模式核心。根据传入的 `email` 检索用户，若存在直接返回；若不存在，提取 `email.split('@')[0]` 作为昵称，生成唯一 handle，写入数据库并返回新实体。
- **并发防御**: 邮箱建有唯一索引，遇瞬时并发冲突时依赖 DB 唯一键报错或重试。

#### 2. `listUsersWithTodosInWeek(db, options): Promise<{ users: User[], hasMore: boolean }>`
- **业务职责**: 周日历矩阵用户检索核心。
- **实现机制**:
  ```sql
  SELECT DISTINCT users.*
  FROM users
  INNER JOIN todos ON users.id = todos.author_id
  WHERE todos.start_date >= :startDateFrom 
    AND todos.start_date <= :startDateTo
    [AND todos.category = :category]
  ORDER BY users.last_todo_updated_at DESC, users.created_at DESC
  LIMIT :limit + 1 OFFSET :offset;
  ```
- **价值**: 彻底杜绝全周 7 天皆为空白的无意义用户行，保证矩阵中每一行创作者都有当周待办。

---

### 3.2 待办服务 (`todo.service.ts`)

#### 1. `listForCalendar(db, options): Promise<Todo[]>`
- **业务职责**: 批量提取指定用户群体在本周区间内的全部待办，并聚合 Reaction 点赞统计。
- **消除 N+1 查询**:
  1. 一次性批量查出 `inArray(todos.authorId, authorIds)` 且日期在 `[startDateFrom, startDateTo]` 内的 Todo；
  2. 收集所有 `todoIds`，调用 `reactionService.getCountsByTodoIds(db, todoIds)` 执行一次 `GROUP BY todo_id, emoji` 聚合，拼装后返回。

#### 2. `generateUniqueShortId(db): Promise<string>`
- **业务职责**: 生成短链标识符。
- **碰撞防护**:
  - 先尝试生成 8 位短随机字符；
  - 若遇碰撞循环重试最多 10 次；
  - 10 次均碰撞则追加时间戳进制后缀兜底保证 100% 唯一。

#### 3. `sanitizeNote(todo): Todo`
- **隐私脱敏规范**: 若 `is_note_public === false`，强制将 `note` 字段重置为 `null`，保护用户未公开的敏感规划。

---

### 3.3 表情反应服务 (`reaction.service.ts`)

#### 1. `getCountsByTodoIds(db, todoIds): Promise<Record<string, Record<string, number>>>`
- **聚合统计 SQL 原理**:
  ```sql
  SELECT todo_id, emoji, COUNT(*)::int AS count
  FROM reactions
  WHERE todo_id IN (:...todoIds)
  GROUP BY todo_id, emoji;
  ```
- **输出格式**: Map 映射字典，例如 `{ "todo-1": { "🔥": 3, "👀": 1 } }`。

---

## 4. 关键防御与业务逻辑规范

### 4.1 状态机单向流转法则 (Status State Machine)

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

- **不可逆法则**: `done` (已完成) 与 `abandoned` (已放弃) 为绝对终态，不可逆向倒退回 `pending` 或 `in_progress`。
- **执行层防御**: 由 `validateStatusTransition(currentStatus, nextStatus)` 在服务层变更前强行拦截，非法时抛出 `AppError('INVALID_STATUS_TRANSITION')`。

### 4.2 活跃时间戳维护机制
每当用户**发布新待办**或**更新待办状态**时，后台自动触发更新该用户的 `users.last_todo_updated_at = NOW()`，使活跃打卡创作者在日历矩阵首屏保持优先展示。

---

## 5. 测试矩阵与质量保障体系

后端采用 **Vitest** 驱动自动化回归测试，测试文件位于 `src/lib/server/__tests__/` 与 `src/lib/utils/__tests__/`：

| 测试模块 | 包含用例数 | 关键断言点与测试范围 |
|---|---|---|
| `validation.test.ts` | 77 Cases | 所有字段正则边界、XSS 特殊字符、16 种状态机迁移组合全覆盖 |
| `user.service.test.ts`| 12 Cases | 免密首次建号、幂等查询、Handle 重名加随机后缀机制、越权修改防御 |
| `todo.service.test.ts`| 27 Cases | CRUD 操作、shortId 碰撞重试、Note 私有脱敏断言、时间戳自增 |
| `reaction.service.test.ts` | 15 Cases | 表情点赞、取消反选、重复点赞 409 拦截、批量 GROUP BY 无 N+1 计数 |
| `calendar.test.ts` | 6 Cases | 周一至周日计算、跨年跨月日期区间格式化、状态优先级与时间排序 |

---

## 6. 本地开发与数据库运维 SOP

### 6.1 环境变量配置 (`.env`)
```env
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/<db_name>?sslmode=require"
```

### 6.2 常用工程与运维命令

```bash
# 1. 启动本地全栈热重载服务
npm run dev

# 2. 将 Drizzle Schema 变动直接推送到开发/测试库
npm run db:push

# 3. 生产环境标准迁移生成与执行
npm run db:generate
npm run db:migrate

# 4. 启动 Drizzle Studio 可视化数据管理后台
npm run db:studio

# 5. 执行全量类型与语法校验
npm run check

# 6. 执行全量测试套件
npx vitest run

# 7. 生产环境打包构建
npm run build
```
