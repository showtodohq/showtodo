# Public Todo — REST API 文档 (v1 MVP)

本文档面向前端开发、测试以及第三方对接人员，详细说明 Public Todo 后端 API 的交互规范、端点定义、参数格式与错误响应。

---

## 1. 基础规范

### 1.1 基础路径
所有业务 API 统一挂载在 `/api` 路径下：
- Base URL: `http://localhost:3003/api`（开发环境）/ `/api`（相对路径）

### 1.2 认证与账号模式 (MVP 简易模式)
- **免密码发布**：用户发布 Todo 或添加 Reaction 时，通过请求体中的 `email` 字段标识身份。
- **自动建号**：若 `email` 不存在，系统自动注册账号，默认 `nickname` 为邮箱 `@` 前缀。
- **权限校验**：修改 Todo / 修改 User 需传入对应作者的 `email`，否则返回 `403 Forbidden`。

### 1.3 数据交互格式
- **Content-Type**: `application/json`
- **时间格式**: ISO 8601 字符串（如 `2026-08-25T16:00:00.000Z`）
- **日期格式**: `YYYY-MM-DD`（如 `2026-08-26`）

---

## 2. 统一响应与错误格式

### 2.1 成功响应
根据 HTTP 语义返回对应状态码（200 OK, 201 Created），返回 JSON 格式数据实体。

### 2.2 统一错误响应结构
当请求出错时，返回标准错误 JSON 结构：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format"
  }
}
```

### 2.3 错误码汇总表

| 错误码 (`code`) | HTTP 状态码 | 触发场景说明 |
|---|---|---|
| `VALIDATION_ERROR` | 400 Bad Request | 字段缺失、格式错误、超长、超出白名单等 |
| `INVALID_STATUS_TRANSITION` | 400 Bad Request | 状态流转不合规（如已完成不可回退到待办） |
| `FORBIDDEN` | 403 Forbidden | 非 Todo/User 拥有者尝试修改资源 |
| `NOT_FOUND` | 404 Not Found | 请求的资源（Todo、User、Reaction）不存在 |
| `DUPLICATE_REACTION` | 409 Conflict | 同一用户对同一 Todo 重复添加同种 Emoji |
| `INTERNAL_ERROR` | 500 Internal Server Error | 服务器内部未捕获异常 |

---

## 3. 常量定义

### 3.1 Todo 状态 (`status`)
- `pending`: 待办
- `in_progress`: 进行中
- `done`: 已完成
- `abandoned`: 已放弃

### 3.2 静态分类 (`category`)
- `study`: 学习
- `fitness`: 健身
- `finance`: 理财
- `dev`: 开发
- `life`: 生活
- `other`: 其他

### 3.3 反应 Emoji (`emoji`)
- `👀`: 围观
- `🔥`: 赞/冲
- `💪`: 加油/给力
- `👏`: 鼓掌

---

## 4. API 端点详情

### 4.1 Todos 相关接口

---

#### 4.1.1 创建 Todo
- **URL**: `POST /api/todos`
- **描述**: 创建一条公开 Todo。如果邮箱未注册，将自动创建用户。

**请求体 (JSON)**:
| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `email` | `string` | 是 | - | 用户邮箱（用于关联/创建作者） |
| `content` | `string` | 是 | - | Todo 主题内容（1-1000 字符） |
| `note` | `string \| null` | 否 | `null` | 备注详情（最多 5000 字符） |
| `isNotePublic` | `boolean` | 否 | `true` | 备注是否公开。隐藏时其他人无法查看到具体备注 |
| `category` | `string \| null` | 否 | `null` | 分类 ID，见常量定义 |
| `startDate` | `string` | 否 | 当天日期 | 计划开始日期（格式 `YYYY-MM-DD`） |
| `dueDate` | `string \| null` | 否 | `null` | 计划截止日期（格式 `YYYY-MM-DD`） |

**请求示例**:
```json
{
  "email": "exc@example.com",
  "content": "完成 SvelteKit Todo 后端文档",
  "note": "包含架构图与测试报告",
  "isNotePublic": true,
  "category": "dev",
  "startDate": "2026-08-26",
  "dueDate": "2026-08-28"
}
```

**响应示例 (201 Created)**:
```json
{
  "todo": {
    "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "content": "完成 SvelteKit Todo 后端文档",
    "note": "包含架构图与测试报告",
    "isNotePublic": true,
    "category": "dev",
    "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "status": "pending",
    "startDate": "2026-08-26",
    "dueDate": "2026-08-28",
    "createdAt": "2026-08-25T16:00:00.000Z",
    "updatedAt": "2026-08-25T16:00:00.000Z"
  },
  "author": {
    "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "email": "exc@example.com",
    "nickname": "exc",
    "avatar": null,
    "createdAt": "2026-08-25T16:00:00.000Z",
    "updatedAt": "2026-08-25T16:00:00.000Z"
  }
}
```

---

#### 4.1.2 获取 Todo 列表
- **URL**: `GET /api/todos`
- **描述**: 分页获取公开 Todo 列表，支持按状态、分类、作者筛选。聚合返回作者信息及 Reaction 计数。
- **隐私逻辑**: 当 `isNotePublic = false` 时，返回的 `note` 字段一律脱敏为 `null`。

**查询参数 (Query Params)**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `status` | `string` | 否 | - | 按状态筛选 (`pending`, `in_progress`, `done`, `abandoned`) |
| `category` | `string` | 否 | - | 按分类 ID 筛选 |
| `authorId` | `string` | 否 | - | 按作者 UUID 筛选 |
| `cursor` | `string` | 否 | - | 游标分页：上一页最后一条 Todo 的 `id` |
| `limit` | `number` | 否 | `20` | 每页数量 (1 - 100) |

**响应示例 (200 OK)**:
```json
{
  "todos": [
    {
      "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
      "content": "完成 SvelteKit Todo 后端文档",
      "note": "包含架构图与测试报告",
      "isNotePublic": true,
      "category": "dev",
      "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
      "status": "pending",
      "startDate": "2026-08-26",
      "dueDate": "2026-08-28",
      "createdAt": "2026-08-25T16:00:00.000Z",
      "updatedAt": "2026-08-25T16:00:00.000Z",
      "author": {
        "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
        "nickname": "exc",
        "avatar": null
      },
      "reactions": {
        "👀": 5,
        "🔥": 2,
        "💪": 1,
        "👏": 0
      }
    }
  ],
  "nextCursor": "78c946e3-f661-4fa3-9f5b-1662991ddf31"
}
```

---

#### 4.1.3 获取单个 Todo 详情
- **URL**: `GET /api/todos/:id`
- **描述**: 根据 Todo UUID 获取详情（含作者与 Reaction 计数）。
- **隐私逻辑**: 若 `isNotePublic = false`，返回的 `note` 字段脱敏为 `null`。

**响应示例 (200 OK)**:
```json
{
  "todo": {
    "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "content": "完成 SvelteKit Todo 后端文档",
    "note": "包含架构图与测试报告",
    "isNotePublic": true,
    "category": "dev",
    "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "status": "pending",
    "startDate": "2026-08-26",
    "dueDate": "2026-08-28",
    "createdAt": "2026-08-25T16:00:00.000Z",
    "updatedAt": "2026-08-25T16:00:00.000Z",
    "author": {
      "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
      "nickname": "exc",
      "avatar": null
    },
    "reactions": {
      "👀": 5,
      "🔥": 2,
      "💪": 1,
      "👏": 0
    }
  }
}
```

---

#### 4.1.4 更新 Todo
- **URL**: `PATCH /api/todos/:id`
- **描述**: 更新 Todo 字段。仅创建者（需提供匹配的 `email`）可操作。支持状态流转校验。

**请求体 (JSON)**:
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `email` | `string` | 是 | 用于权限验证的作者邮箱 |
| `content` | `string` | 否 | 更新 Todo 内容（1-1000 字符） |
| `note` | `string \| null` | 否 | 更新备注 |
| `isNotePublic` | `boolean` | 否 | 更新备注公开性 |
| `category` | `string \| null` | 否 | 更新分类 |
| `status` | `string` | 否 | 更新状态（需满足状态机规则） |
| `startDate` | `string` | 否 | 更新开始日期 (`YYYY-MM-DD`) |
| `dueDate` | `string \| null` | 否 | 更新截止日期 (`YYYY-MM-DD` 或 `null`) |

**状态流转约束规则**:
- `pending` ➔ `in_progress`, `done`, `abandoned`
- `in_progress` ➔ `done`, `abandoned`
- `done` ➔ 不可变更
- `abandoned` ➔ 不可变更

**请求示例**:
```json
{
  "email": "exc@example.com",
  "status": "in_progress",
  "note": "正在撰写架构文档"
}
```

**响应示例 (200 OK)**:
```json
{
  "todo": {
    "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "content": "完成 SvelteKit Todo 后端文档",
    "note": "正在撰写架构文档",
    "isNotePublic": true,
    "category": "dev",
    "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "status": "in_progress",
    "startDate": "2026-08-26",
    "dueDate": "2026-08-28",
    "createdAt": "2026-08-25T16:00:00.000Z",
    "updatedAt": "2026-08-25T16:30:00.000Z"
  }
}
```

---

### 4.2 Reactions 互动相关接口

---

#### 4.2.1 添加 Reaction 表情反应
- **URL**: `POST /api/todos/:id/reactions`
- **描述**: 为指定的 Todo 添加一条 Emoji 反应。如果邮箱未注册，自动创建用户。同一用户不可对同条 Todo 重复添加同种 Emoji。

**请求体 (JSON)**:
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `email` | `string` | 是 | 反应人邮箱 |
| `emoji` | `string` | 是 | 白名单：`👀`, `🔥`, `💪`, `👏` |

**响应示例 (201 Created)**:
```json
{
  "reaction": {
    "id": "3bb62c64-41d6-444a-992a-8cf8feccefa7",
    "todoId": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "userId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "emoji": "🔥",
    "createdAt": "2026-08-25T16:40:00.000Z"
  }
}
```

---

#### 4.2.2 取消 Reaction 表情反应
- **URL**: `DELETE /api/todos/:id/reactions`
- **描述**: 取消用户对指定 Todo 的某个 Emoji 反应。

**请求体 (JSON)**:
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `email` | `string` | 是 | 反应人邮箱 |
| `emoji` | `string` | 是 | 要取消的 Emoji |

**响应示例 (200 OK)**:
```json
{
  "success": true
}
```

---

#### 4.2.3 获取 Todo 的所有 Reaction 详情
- **URL**: `GET /api/todos/:id/reactions`
- **描述**: 获取指定 Todo 下所有 Emoji 的汇总计数与点赞用户列表。

**响应示例 (200 OK)**:
```json
{
  "reactions": [
    {
      "emoji": "🔥",
      "count": 2,
      "users": [
        { "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64", "nickname": "exc" },
        { "id": "f290d165-8b9f-4eb8-b996-2d10339d226a", "nickname": "alice" }
      ]
    },
    {
      "emoji": "👀",
      "count": 1,
      "users": [
        { "id": "c76be737-1423-41bb-98a0-0cb2910c2e39", "nickname": "bob" }
      ]
    }
  ]
}
```

---

### 4.3 Users 用户相关接口

---

#### 4.3.1 获取用户信息
- **URL**: `GET /api/users/:id`
- **描述**: 查询公开用户信息。

**响应示例 (200 OK)**:
```json
{
  "user": {
    "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "email": "exc@example.com",
    "nickname": "exc",
    "avatar": null,
    "createdAt": "2026-08-25T16:00:00.000Z",
    "updatedAt": "2026-08-25T16:00:00.000Z"
  }
}
```

---

#### 4.3.2 更新用户资料
- **URL**: `PATCH /api/users/:id`
- **描述**: 更新用户昵称或自定义头像 URL。需提供匹配的 `email`。

**请求体 (JSON)**:
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `email` | `string` | 是 | 验证归属的邮箱 |
| `nickname` | `string` | 否 | 新昵称（非空字符串） |
| `avatar` | `string \| null` | 否 | 头像图片 URL 或 `null`（清空） |

**响应示例 (200 OK)**:
```json
{
  "user": {
    "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "email": "exc@example.com",
    "nickname": "Antigravity",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2026-08-25T16:00:00.000Z",
    "updatedAt": "2026-08-25T16:45:00.000Z"
  }
}
```

---

### 4.4 系统健康检查

#### 4.4.1 健康状态
- **URL**: `GET /api/health`
- **描述**: 服务健康检查接口。

**响应示例 (200 OK)**:
```json
{
  "status": "ok",
  "timestamp": "2026-08-25T16:00:00.000Z"
}
```
