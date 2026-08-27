# ptdl-alpha — 生产级 RESTful API 规格说明书

> **文档状态**: 生产就绪 (Production Ready)  
> **适用对象**: 前端开发工程师、QA 测试工程师、自动化测试脚本编写人员、第三方接入人员  
> **文档目标**: 开发者与测试人员**仅凭本文档**即可独立完成前端页面开发、Mock 数据构建、Postman/Apifox 接口测试及自动化回归脚本编写。

---

## 1. 协议与全局规范

### 1.1 Base URL 与网络协议
- **开发环境**: `http://localhost:3003/api`
- **生产环境**: `https://<your-domain>/api`
- **传输协议**: HTTPS / HTTP 1.1 / HTTP 2
- **字符编码**: `UTF-8`

### 1.2 全局请求头 (Request Headers)
所有 `POST` / `PATCH` / `DELETE` 接口必须显式携带以下 Header：
```http
Content-Type: application/json
Accept: application/json
```

### 1.3 统一时间与标识符格式
- **日期格式 (Date)**: 严格遵循 `YYYY-MM-DD`（ISO 8601 本地日历日），例如 `2026-08-26`。
- **时间戳格式 (Timestamp)**: 严格遵循 ISO 8601 带时区字符串，例如 `2026-08-26T08:30:00.000Z`。
- **实体主键 (ID)**: 标准 UUID v4 格式（36 字符），例如 `a9bf1c17-646e-4401-9f93-5c026e64ec64`。
- **短短链 ID (shortId)**: 6~12 位 URL 安全字符（仅字母与数字），用于分享与短链。

---

## 2. 统一错误响应规范

当 API 处理失败时，HTTP 状态码将返回对应的 4xx 或 5xx，且 Body 严格遵循如下标准 JSON 结构：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "startDateFrom and startDateTo are required"
  }
}
```

### 全局错误码字典 (Error Code Matrix)

| 错误码 (`code`) | HTTP Status | 触发业务场景 | 客户端建议处理 |
|---|---|---|---|
| `VALIDATION_ERROR` | `400 Bad Request` | 参数缺失、格式错误、日期非法、字符超长、枚举值不在白名单 | 高亮输入框并展示 `message` |
| `INVALID_STATUS_TRANSITION` | `400 Bad Request` | Todo 状态迁移违反状态机约束（如已完成试图倒退为待办） | 提示“当前状态不允许该变更”并刷新状态 |
| `FORBIDDEN` | `403 Forbidden` | 请求中的 `email` 与资源创建者邮箱不匹配 | 提示“无权操作该资源” |
| `NOT_FOUND` | `404 Not Found` | 请求的 Todo 或 User 资源不存在 | 提示“内容已不存在或已被删除” |
| `DUPLICATE_REACTION` | `409 Conflict` | 同一用户对同一 Todo 重复提交相同 Emoji 反应 | 忽略或提示“您已表态过该表情” |
| `INTERNAL_ERROR` | `500 Internal Error` | 数据库断连、未捕获的运行时异常 | 提示“服务开小差了，请稍后重试” |

---

## 3. 业务枚举与常量定义

### 3.1 待办状态 (`status`)
| 枚举值 | 中文名称 | 说明 | 允许迁移的下一状态 |
|---|---|---|---|
| `pending` | 待办 | 初始状态 | `in_progress`, `done`, `abandoned` |
| `in_progress` | 进行中 | 呼吸灯高亮 | `done`, `abandoned` |
| `done` | 已完成 | 划线终态 | *不可迁移 (终态)* |
| `abandoned` | 已放弃 | 划线置灰终态 | *不可迁移 (终态)* |

### 3.2 静态分类 (`category`)
| ID | 名称 | 标准色值 | 适用场景 |
|---|---|---|---|
| `study` | 学习 | `#3B82F6` (Blue) | 读书、考证、研读论文 |
| `fitness` | 健身 | `#22C55E` (Emerald) | 跑步、撸铁、减脂计划 |
| `finance` | 理财 | `#F59E0B` (Amber) | 记账、投资、预算管理 |
| `dev` | 开发 | `#8B5CF6` (Purple) | 编程、写代码、发版 |
| `life` | 生活 | `#EC4899` (Pink) | 购物、聚会、家务生活 |
| `other` | 其他 | `#6B7280` (Zinc) | 未归类的常规日常 |

### 3.3 反应表情 (`emoji`)
| Emoji | 语义说明 | 唯一性约束 |
|---|---|---|
| `👀` | 围观 / 保持关注 | 每个用户对单条 Todo 限 1 次 |
| `🔥` | 赞 / 冲 / 给力 | 每个用户对单条 Todo 限 1 次 |
| `💪` | 加油 / 强 | 每个用户对单条 Todo 限 1 次 |
| `👏` | 鼓掌 / 庆祝达成 | 每个用户对单条 Todo 限 1 次 |

---

## 4. API 详细端点规格

---

### 4.1 日历看板核心接口

#### `GET /api/calendar` — 获取周日历聚合数据看板
- **接口说明**: 核心日历矩阵接口。采用 User-First 模式，仅返回在当前指定自然周 `[startDateFrom, startDateTo]` 区间内**确实有待办**的活跃创作者列表，以及这批创作者在本周内的全部待办数据。若传入 `currentUserId` 且为第 1 页，则强制将当前访问者置顶在首位。

##### 请求参数 (Query Parameters)
| 参数名 | 类型 | 必填 | 默认值 | 边界约束 / 格式 | 描述 |
|---|---|---|---|---|---|
| `startDateFrom` | `string` | **是** | - | `YYYY-MM-DD` | 周起始日期（通常为周一） |
| `startDateTo` | `string` | **是** | - | `YYYY-MM-DD` | 周截止日期（通常为周日） |
| `limit` | `integer` | 否 | `20` | `1 <= limit <= 100` | 用户分页大小 |
| `offset` | `integer` | 否 | `0` | `>= 0` | 用户偏移量 |
| `currentUserId` | `string` | 否 | - | 标准 UUID v4 | 当前登录用户 ID，用于置顶个人泳道 |
| `category` | `string` | 否 | - | 见 3.2 分类 ID 白名单 | 按分类筛选看板数据 |

##### 响应报文 (200 OK)
```json
{
  "users": [
    {
      "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
      "email": "alex@example.com",
      "nickname": "Alex Chen",
      "handle": "alexchen",
      "avatar": "https://api.dicebear.com/7.x/identicon/svg?seed=alexchen",
      "createdAt": "2026-08-20T10:00:00.000Z",
      "updatedAt": "2026-08-26T12:00:00.000Z",
      "lastTodoUpdatedAt": "2026-08-26T12:00:00.000Z"
    }
  ],
  "todos": [
    {
      "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
      "shortId": "8x2k9a1b",
      "content": "重构多用户周日历看板",
      "note": "实现呼吸灯与移动端适配",
      "isNotePublic": true,
      "category": "dev",
      "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
      "status": "in_progress",
      "startDate": "2026-08-26",
      "dueDate": "2026-08-28",
      "createdAt": "2026-08-26T08:00:00.000Z",
      "updatedAt": "2026-08-26T08:30:00.000Z",
      "author": {
        "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
        "nickname": "Alex Chen",
        "handle": "alexchen",
        "avatar": "https://api.dicebear.com/7.x/identicon/svg?seed=alexchen"
      },
      "reactions": {
        "👀": 5,
        "🔥": 3,
        "💪": 1,
        "👏": 0
      }
    }
  ],
  "hasMoreUsers": false
}
```

##### 响应字段字典
| 字段路径 | 类型 | 是否可能为 null | 说明 |
|---|---|---|---|
| `users[]` | `Array<Object>` | 否 | 本周活跃用户列表 |
| `users[].id` | `string (UUID)` | 否 | 用户唯一标识 |
| `users[].handle` | `string` | 否 | 用户唯一英文用户名 (如 alexchen) |
| `users[].nickname` | `string` | 否 | 用户展示昵称 |
| `users[].avatar` | `string \| null` | 是 | 自定义头像 URL，若无则为 null |
| `users[].lastTodoUpdatedAt` | `string (ISO)` | 是 | 最近一次发待办或打卡时间戳 |
| `todos[]` | `Array<Object>` | 否 | 落在本周的所有待办列表 |
| `todos[].id` | `string (UUID)` | 否 | 待办唯一 ID |
| `todos[].shortId` | `string` | 否 | 待办短标识 |
| `todos[].content` | `string` | 否 | 待办文本内容 |
| `todos[].note` | `string \| null` | 是 | 备注（若 `isNotePublic: false` 且非作者读取则脱敏为 null） |
| `todos[].isNotePublic` | `boolean` | 否 | 备注是否全网公开 |
| `todos[].category` | `string \| null` | 是 | 所属分类 ID |
| `todos[].status` | `string` | 否 | `pending` \| `in_progress` \| `done` \| `abandoned` |
| `todos[].startDate` | `string (Date)` | 否 | 计划开始日期 `YYYY-MM-DD` |
| `todos[].dueDate` | `string (Date) \| null` | 是 | 计划截止日期 `YYYY-MM-DD` |
| `todos[].reactions` | `Record<string, number>` | 否 | 4 款 Emoji 各自的点赞计数字典 |
| `hasMoreUsers` | `boolean` | 否 | 是否还有更多活跃用户可供翻页 |

##### 错误响应示例
- **400 缺少必填参数**:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "startDateFrom and startDateTo are required"
    }
  }
  ```

##### cURL 示例
```bash
curl -X GET "http://localhost:3003/api/calendar?startDateFrom=2026-08-24&startDateTo=2026-08-30&limit=20&offset=0" \
  -H "Accept: application/json"
```

---

### 4.2 待办 (Todos) 操作接口

#### `POST /api/todos` — 发布待办
- **接口说明**: 采用 WordPress 评论免密码模式。传入 `email` 即可发布待办，如果邮箱未建号，后台会自动创建新用户并分配唯一 `handle`。

##### 请求体 (Request Body)
| 字段名 | 类型 | 必填 | 默认值 | 边界限制 | 描述 |
|---|---|---|---|---|---|
| `email` | `string` | **是** | - | 合法 Email 格式，最大 255 字符 | 作者邮箱标识 |
| `content` | `string` | **是** | - | `1 <= length <= 1000` 字符 | 待办内容正文 |
| `note` | `string` | 否 | `null` | 最大 5000 字符 | 详细备注或背景 |
| `isNotePublic` | `boolean` | 否 | `true` | `true` 或 `false` | 备注是否全网公开 |
| `category` | `string` | 否 | `null` | 见 3.2 分类白名单 | 分类 ID |
| `startDate` | `string` | 否 | 当天日期 | `YYYY-MM-DD` 格式 | 计划开始日期 |
| `dueDate` | `string` | 否 | `null` | `YYYY-MM-DD` 格式 | 计划截止日期 |

##### 响应报文 (201 Created)
```json
{
  "todo": {
    "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "shortId": "8x2k9a1b",
    "content": "完成 API 规格文档重构",
    "note": "严格按照工业级标准书写",
    "isNotePublic": true,
    "category": "dev",
    "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "status": "pending",
    "startDate": "2026-08-26",
    "dueDate": null,
    "createdAt": "2026-08-26T08:00:00.000Z",
    "updatedAt": "2026-08-26T08:00:00.000Z"
  },
  "author": {
    "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "email": "exc@example.com",
    "handle": "exc",
    "nickname": "exc",
    "avatar": null,
    "createdAt": "2026-08-26T08:00:00.000Z",
    "updatedAt": "2026-08-26T08:00:00.000Z"
  }
}
```

##### 错误响应示例
- **400 待办内容为空**:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Content is required and must not be empty"
    }
  }
  ```
- **400 邮箱格式非法**:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid email address"
    }
  }
  ```

##### cURL 示例
```bash
curl -X POST "http://localhost:3003/api/todos" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "exc@example.com",
    "content": "明天早起晨跑 5 公里",
    "category": "fitness",
    "startDate": "2026-08-27"
  }'
```

---

#### `PATCH /api/todos/:id` — 更新待办 / 状态流转
- **接口说明**: 修改 Todo 内容或流转状态。必须在 Body 中携带作者 `email` 进行权限验证。`:id` 既支持 36 位 UUID，也支持 8 位 `shortId`。

##### 路径参数 (Path Parameters)
| 参数名 | 类型 | 必填 | 格式 | 描述 |
|---|---|---|---|---|
| `id` | `string` | **是** | UUID 或 shortId | 待办标识符 |

##### 请求体 (Request Body)
| 字段名 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `email` | `string` | **是** | 用于身份鉴权的作者邮箱 |
| `content` | `string` | 否 | 修改待办正文（1-1000 字符） |
| `note` | `string \| null` | 否 | 修改备注 |
| `isNotePublic` | `boolean` | 否 | 修改备注公开性 |
| `category` | `string \| null` | 否 | 修改分类 |
| `status` | `string` | 否 | 流转状态：`pending` \| `in_progress` \| `done` \| `abandoned` |
| `startDate` | `string` | 否 | 修改开始日期 (`YYYY-MM-DD`) |
| `dueDate` | `string \| null` | 否 | 修改截止日期 (`YYYY-MM-DD` 或 null) |

##### 响应报文 (200 OK)
```json
{
  "todo": {
    "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "shortId": "8x2k9a1b",
    "content": "重构多用户周日历看板",
    "note": "实现呼吸灯与移动端适配",
    "isNotePublic": true,
    "category": "dev",
    "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "status": "done",
    "startDate": "2026-08-26",
    "dueDate": "2026-08-28",
    "createdAt": "2026-08-26T08:00:00.000Z",
    "updatedAt": "2026-08-26T10:15:00.000Z"
  }
}
```

##### 错误响应示例
- **403 非作者尝试修改**:
  ```json
  {
    "error": {
      "code": "FORBIDDEN",
      "message": "Only the author can update this todo"
    }
  }
  ```
- **400 非法状态流转（如已完成试图倒退回待办）**:
  ```json
  {
    "error": {
      "code": "INVALID_STATUS_TRANSITION",
      "message": "Cannot transition status from 'done' to 'pending'"
    }
  }
  ```
- **404 待办不存在**:
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Todo not found"
    }
  }
  ```

##### cURL 示例
```bash
curl -X PATCH "http://localhost:3003/api/todos/78c946e3-f661-4fa3-9f5b-1662991ddf31" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "exc@example.com",
    "status": "in_progress"
  }'
```

---

### 4.3 表情反应 (Reactions) 接口

#### `POST /api/todos/:id/reactions` — 添加表情表态
- **接口说明**: 为指定的 Todo 点赞或添加 Emoji 反应。如果邮箱未注册，系统会自动创建账号。同一用户对同一 Todo 的同款 Emoji 严禁重复添加。

##### 路径参数 (Path Parameters)
| 参数名 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `id` | `string` | **是** | 目标 Todo 的 UUID |

##### 请求体 (Request Body)
| 字段名 | 类型 | 必填 | 枚举限制 | 描述 |
|---|---|---|---|---|
| `email` | `string` | **是** | 合法 Email | 表态人邮箱 |
| `emoji` | `string` | **是** | `👀`, `🔥`, `💪`, `👏` | 反应 Emoji |

##### 响应报文 (201 Created)
```json
{
  "reaction": {
    "id": "3bb62c64-41d6-444a-992a-8cf8feccefa7",
    "todoId": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "userId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "emoji": "🔥",
    "createdAt": "2026-08-26T10:20:00.000Z"
  }
}
```

##### 错误响应示例
- **409 重复表态冲突**:
  ```json
  {
    "error": {
      "code": "DUPLICATE_REACTION",
      "message": "User already reacted with this emoji on this todo"
    }
  }
  ```

##### cURL 示例
```bash
curl -X POST "http://localhost:3003/api/todos/78c946e3-f661-4fa3-9f5b-1662991ddf31/reactions" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "friend@example.com",
    "emoji": "🔥"
  }'
```

---

#### `DELETE /api/todos/:id/reactions` — 取消表情表态
- **接口说明**: 取消当前用户对某条 Todo 的指定 Emoji 反应。

##### 请求体 (Request Body)
| 字段名 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `email` | `string` | **是** | 原表态人邮箱 |
| `emoji` | `string` | **是** | 需取消的 Emoji (`👀`, `🔥`, `💪`, `👏`) |

##### 响应报文 (200 OK)
```json
{
  "success": true
}
```

##### cURL 示例
```bash
curl -X DELETE "http://localhost:3003/api/todos/78c946e3-f661-4fa3-9f5b-1662991ddf31/reactions" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "friend@example.com",
    "emoji": "🔥"
  }'
```

---

#### `GET /api/todos/:id/reactions` — 获取 Todo 全部表态详情
- **接口说明**: 查询某条 Todo 的所有 Emoji 分组计数，并展开每款 Emoji 对应的点赞人名单。

##### 响应报文 (200 OK)
```json
{
  "reactions": [
    {
      "emoji": "🔥",
      "count": 2,
      "users": [
        {
          "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
          "nickname": "Alex Chen",
          "avatar": null
        },
        {
          "id": "b1234567-1111-2222-3333-444455556666",
          "nickname": "Sarah",
          "avatar": "https://example.com/sarah.png"
        }
      ]
    },
    {
      "emoji": "👀",
      "count": 1,
      "users": [
        {
          "id": "c76be737-1423-41bb-98a0-0cb2910c2e39",
          "nickname": "Bob",
          "avatar": null
        }
      ]
    }
  ]
}
```

---

### 4.4 用户资料 (Users) 接口

#### `POST /api/users` — 同步 / 免密登录用户
- **接口说明**: 根据邮箱同步获取用户信息。若不存在则自动注册。

##### 请求体:
```json
{
  "email": "alex@example.com"
}
```

##### 响应报文 (200 OK):
```json
{
  "user": {
    "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "email": "alex@example.com",
    "handle": "alex",
    "nickname": "alex",
    "avatar": null,
    "createdAt": "2026-08-26T08:00:00.000Z",
    "updatedAt": "2026-08-26T08:00:00.000Z"
  }
}
```

---

#### `PATCH /api/users/:id` — 更新用户个人资料
- **接口说明**: 修改用户昵称、@handle 或头像。需在 Body 中传入对应作者的 `email` 校验归属。

##### 请求体 (Request Body)
| 字段名 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `email` | `string` | **是** | 验证归属的用户邮箱 |
| `nickname` | `string` | 否 | 新昵称（1-50 字符） |
| `handle` | `string` | 否 | 新用户名（仅英文字母/数字/下划线/连字符） |
| `avatar` | `string \| null` | 否 | 自定义头像图片 URL，或 `null` 恢复默认 |

##### 响应报文 (200 OK)
```json
{
  "user": {
    "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "email": "alex@example.com",
    "handle": "alexchen",
    "nickname": "Alex Chen",
    "avatar": "https://example.com/my-photo.jpg",
    "createdAt": "2026-08-26T08:00:00.000Z",
    "updatedAt": "2026-08-26T10:30:00.000Z"
  }
}
```

---

### 4.5 系统健康检查接口

#### `GET /api/health` — 健康检查
- **接口说明**: 监控探针与系统存活检测接口。
- **响应报文 (200 OK)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-08-26T12:00:00.000Z"
  }
  ```

---

## 5. QA 测试用例与断言矩阵 (Test Scenarios Checklist)

测试工程师在执行接口自动化或黑盒测试时，建议覆盖以下测试用例：

| 用例编号 | 测试端点 | 测试场景描述 | 预期 HTTP 状态 | 预期断言点 |
|---|---|---|---|---|
| **TC-CAL-01** | `GET /api/calendar` | 正常传入当前周周一与周日日期 | `200 OK` | 返回 `users` 和 `todos` 数组，且 todos 的 `startDate` 均在指定范围内 |
| **TC-CAL-02** | `GET /api/calendar` | 缺失 `startDateFrom` 参数 | `400 Bad Request` | `error.code == "VALIDATION_ERROR"` |
| **TC-CAL-03** | `GET /api/calendar` | 传入 `currentUserId` 且该用户本周 0 任务 | `200 OK` | `users[0].id == currentUserId` (首行置顶) |
| **TC-CAL-04** | `GET /api/calendar` | 传入 `category=dev` 筛选 | `200 OK` | 返回的 todos 均为 `category == 'dev'` |
| **TC-TODO-01**| `POST /api/todos` | 首次使用全新邮箱发布待办 | `201 Created` | 成功建号，返回 Todo 且 `author.email` 一致 |
| **TC-TODO-02**| `POST /api/todos` | `content` 为纯空格或缺失 | `400 Bad Request` | `error.code == "VALIDATION_ERROR"` |
| **TC-TODO-03**| `PATCH /api/todos/:id` | 状态从 `pending` -> `in_progress` | `200 OK` | `todo.status == "in_progress"` |
| **TC-TODO-04**| `PATCH /api/todos/:id` | 状态从 `done` 试图变更为 `pending` | `400 Bad Request` | `error.code == "INVALID_STATUS_TRANSITION"` |
| **TC-TODO-05**| `PATCH /api/todos/:id` | 使用非作者邮箱尝试更新 | `403 Forbidden` | `error.code == "FORBIDDEN"` |
| **TC-REACT-01**| `POST /api/todos/:id/reactions`| 首次点赞 `🔥` | `201 Created` | 返回 reaction 实体 |
| **TC-REACT-02**| `POST /api/todos/:id/reactions`| 同一邮箱对同 Todo 重复点 `🔥` | `409 Conflict` | `error.code == "DUPLICATE_REACTION"` |
| **TC-REACT-03**| `DELETE /api/todos/:id/reactions`| 取消已点赞的 `🔥` | `200 OK` | `success == true` |
| **TC-USER-01**| `PATCH /api/users/:id`| 修改昵称与用户名 handle | `200 OK` | 返回修改后的新昵称与 handle |
| **TC-USER-02**| `PATCH /api/users/:id`| handle 包含非法特殊字符 | `400 Bad Request` | `error.code == "VALIDATION_ERROR"` |
