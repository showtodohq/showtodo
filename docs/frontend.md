# Public Todo — 前端架构与开发对接指南 (v1 MVP)

本文档面向全栈开发人员、前端协作开发及第三方对接人员，全面说明 Public Todo 前端应用的架构设计、页面路由规范、Svelte 5 组件结构、状态流转与本地持久化规范，以及后续功能扩展指南。

---

## 1. 技术栈与核心选型

- **全栈框架**: [SvelteKit 2](https://kit.svelte.dev/) + [Svelte 5 Runes](https://svelte.dev/) (`$state`, `$derived`, `$props`, `$effect`)
- **样式系统**: Tailwind CSS v4 + `@tailwindcss/forms`
- **图标体系**: `@iconify/svelte` (Lucide 矢量图标集)
- **类型安全**: TypeScript 6
- **头像方案**: 动态 [DiceBear](https://www.dicebear.com/) (未配置自定义头像时，以用户昵称为 seed 自动生成矢量头像)

---

## 2. 页面路由体系 (Page Routes)

采用 **命名空间隔离的语义化层级 URL 体系**：

| 路由路径 | 对应文件 | 页面定位 | 核心功能与交互 |
|---|---|---|---|
| `/` | `src/routes/+page.svelte` | **公开待办广场 (Public Feed)** | 全站 Todo 动态流、极简发布卡片、多维状态与分类筛选器（**URL Query 参数双向同步**，如 `?status=in_progress&category=dev`，支持刷新保持与链接分享）、游标分页加载 |
| `/@[user]` | `src/routes/@[user]/+page.svelte` | **用户公开主页 (User Profile & Wall)** | 用户个人目标墙：展示用户头像、昵称、`@handle`、个人 Todo 统计（全部、进行中、已达成、总获赞数）以及该作者发布的所有公开 Todo 列表 |
| `/@[user]/todo/[shortId]` | `src/routes/@[user]/todo/[shortId]/+page.svelte` | **Todo 独立详情页 (Detail & Share)** | 单条 Todo 专属围观/分享页（带语义化短链接），展示完整规划内容、起止日期时间线、点赞人完整名单与 Emoji 互动区，作者在此页亦可直接流转状态与编辑 |
| `+error.svelte` | `src/routes/+error.svelte` | **通用错误页 (404/500)** | 极简友好的资源未找到或系统异常展示，支持一键返回广场 |

---

## 3. 代码目录与模块架构

```
src/
├── lib/
│   ├── types/
│   │   ├── todo.ts               # 前端 Todo (shortId)、Reaction、Author (handle) 等 TypeScript 接口
│   │   └── user.ts               # 用户资料 (handle) 与本地会话类型
│   ├── constants/
│   │   ├── categories.ts         # 6 个静态分类配置（学习、健身、理财、开发、生活、其他）
│   │   ├── reactions.ts          # 4 种 Emoji 互动定义（👀、🔥、💪、👏）与样式
│   │   └── status.ts             # 4 种 Todo 状态定义与状态机转移规则
│   ├── services/
│   │   ├── api.ts                # RESTful API 客户端统一封装（含错误转换）
│   │   └── avatar.ts             # DiceBear 动态头像生成工具函数
│   ├── stores/
│   │   ├── user.svelte.ts        # 基于 Svelte 5 的当前用户身份持久化 Store (localStorage，含 handle)
│   │   └── toast.svelte.ts       # 全局 Toast 消息提示 Store
│   └── components/
│       ├── common/               # 原子基础 UI 组件
│       │   ├── Avatar.svelte         # 智能头像组件
│       │   ├── StatusBadge.svelte    # 状态胶囊徽章
│       │   ├── CategoryBadge.svelte  # 分类色彩标签
│       │   ├── ToastContainer.svelte # 全局浮动提示容器
│       │   └── Modal.svelte          # 极简模态弹窗（带 Portal 传送至 body）
│       ├── todo/                 # Todo 业务组件
│       │   ├── CreateTodoCard.svelte # 极简发布卡片（单行收起/聚焦展开，起止日期配置）
│       │   ├── TodoCard.svelte       # 单条 Todo 卡片（链接为 /@[handle]/todo/[shortId]）
│       │   ├── TodoList.svelte       # Todo 列表、骨架屏与游标分页容器
│       │   ├── TodoFilter.svelte     # 状态 Tabs + 分类胶囊 + “只看我的”切换
│       │   ├── ReactionBar.svelte    # 4 种 Emoji 互动按钮组（乐观更新）
│       │   └── EditTodoModal.svelte  # Todo 编辑与状态流转弹窗
│       └── user/                 # 用户相关组件
│           ├── UserIdentityBar.svelte# 顶部导航右侧身份展示与切换（含 @handle）
│           └── UserProfileModal.svelte# 用户资料（昵称、@handle、头像）修改弹窗
└── routes/
    ├── +layout.svelte            # 全局布局基座（毛玻璃 Header、Footer、Toast 挂载）
    ├── +error.svelte             # 全局友好错误拦截页
    ├── +page.svelte              # 待办广场主页
    ├── @[user]/
    │   ├── +page.svelte          # 用户公开主页 (/@handle)
    │   └── todo/
    │       └── [shortId]/
    │           └── +page.svelte  # Todo 详情与围观页 (/@handle/todo/[shortId])
    └── layout.css                # Tailwind CSS v4 与平滑滚动/滚动条配置
```

---

## 4. 核心交互与业务流转设计

### 4.1 免密码身份认证流 (WordPress 评论模式)
- **机制**：用户无需繁琐的密码注册。在发布 Todo、参与点赞或点击右上角身份时，输入 `email` 即可。
- **本地持久化**：
  - 存储在浏览器的 `localStorage` 的 `public_todo_user_session` 中。
  - 记录字段：`{ email, id, nickname, avatar }`。
- **自动建号与关联**：后端若发现该 `email` 不存在会自动创建用户，前端 `userStore` 会自动更新并保持会话。
- **身份切换与资料管理**：随时在顶部导航下拉菜单中切换邮箱，或修改昵称与自定义头像 URL。

### 4.2 极简渐进式发布流程 (Progressive Disclosure)
- **默认收起态**：仅显示一个清爽的单行输入框 `“有什么公开目标或待办想要分享？”`。
- **聚焦展开态**：平滑展示高级选项：
  - **内容**：多行输入，支持 `Cmd/Ctrl + Enter` 快捷发布。
  - **分类选择**：彩色胶囊单选（无分类、学习、健身、理财、开发、生活、其他）。
  - **起止日期**：支持设置计划开始日期（默认自动填充当天日期）与计划截止日期。
  - **详细备注**：多行规划输入，并可一键切换 `公开给围观者 / 私密保护` 开关。
  - **邮箱身份**：若本地未保存邮箱，自动显示邮箱输入行。

### 4.3 状态机流转与操作权限
前端严格执行状态流转校验逻辑：
- `pending` (待办) ➔ 可变更为 `in_progress` (进行中)、`done` (已完成)、`abandoned` (已放弃)
- `in_progress` (进行中) ➔ 可变更为 `done` (已完成)、`abandoned` (已放弃)
- `done` / `abandoned` ➔ 终态，不可逆向流转

**操作响应**：
- 当用户为当前卡片作者时，卡片顶部展示快速流转按钮与编辑图标；
- 非作者用户仅能围观、点赞、查看详情与复制分享链接。

### 4.4 表情围观互动 (Reaction System)
- 支持 4 款 Emoji：`👀 围观`、`🔥 冲`、`💪 给力`、`👏 鼓掌`。
- **乐观更新 (Optimistic UI)**：点击后数字与高亮状态瞬间更新，后台异步发送 API 请求；若网络或权限异常则自动回滚并 Toast 提示。
- **见证人弹窗**：点击表情计数可查看具体参与互动的用户列表与头像。

---

## 5. 前端 API 客户端规范 (`src/lib/services/api.ts`)

所有与后端的通信均统一通过 `api` 服务对象调用，且具备统一的错误处理机制：

```ts
import { api } from '$lib/services/api';

// 1. 获取 Todo 列表
const res = await api.getTodos({ status: 'in_progress', category: 'dev', limit: 15 });

// 2. 获取单条 Todo
const { todo } = await api.getTodoById('todo-uuid');

// 3. 发布 Todo
const { todo, author } = await api.createTodo({
  email: 'user@example.com',
  content: '完成前端文档',
  startDate: '2026-08-26',
  dueDate: '2026-08-28'
});

// 4. 更新 Todo
await api.updateTodo('todo-uuid', {
  email: 'user@example.com',
  status: 'done'
});

// 5. 点赞与取消点赞
await api.addReaction('todo-uuid', '🔥', 'user@example.com');
await api.removeReaction('todo-uuid', '🔥', 'user@example.com');

// 6. 获取点赞用户详情
const { reactions } = await api.getReactions('todo-uuid');

// 7. 用户资料查询与修改
const { user } = await api.getUserById('user-uuid');
await api.updateUser('user-uuid', {
  email: 'user@example.com',
  nickname: '新昵称',
  avatar: 'https://example.com/avatar.jpg'
});
```

---

## 6. 常见问题与后续扩展指南 (Roadmap)

### 6.1 Google OAuth 接入准备
当前采用简易邮箱模式。后续接入 Google 登录时：
1. 后端新增 `/api/auth/google` 路由。
2. 前端 `UserIdentityBar.svelte` 替换为一键 Google 授权按钮。
3. 登录成功后将 Google Profile (`email`, `name`, `picture`) 回传至 `userStore` 即可无缝平滑迁移。

### 6.2 实时数据推送 (SSE / WebSocket)
- 后端可在 Todo 状态流转或新增 Reaction 时广播事件。
- 前端在 `TodoList.svelte` / `ReactionBar.svelte` 挂载 `EventSource`，实现多人在线围观时的实时点赞动画与状态弹跳。

### 6.3 模态弹窗挂载规范
因顶部导航栏等组件常带有 `backdrop-blur`（CSS 规范中会产生新的包含块），所有模态弹窗组件必须使用 `use:portal` 动作提升至 `document.body` 顶层，以确保全屏层级与滚动穿透处理正常。
