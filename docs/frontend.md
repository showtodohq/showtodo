# ptdl-alpha — 前端架构与开发指南 (协同看板)

本文档面向全栈开发人员、前端开发人员及架构人员，全面说明 ptdl-alpha 前端应用的协同矩阵架构设计、组件结构、状态流转、用户交互及开发规范。

---

## 1. 技术栈与核心选型

- **全栈框架**: [SvelteKit 2](https://kit.svelte.dev/) + [Svelte 5 Runes](https://svelte.dev/) (`$state`, `$derived`, `$props`, `$effect`)
- **样式系统**: Tailwind CSS v4 + `@tailwindcss/forms`
- **图标体系**: `@iconify/svelte` (Lucide 图标集)
- **类型安全**: TypeScript 6
- **头像方案**: 动态 [DiceBear](https://www.dicebear.com/) (以用户昵称为 seed 自动生成矢量头像)

---

## 2. 页面路由体系 (Page Routes)

应用采用**极简单页 + 原生弹窗协同**的设计范式：

| 路由路径 | 对应文件 | 页面定位 | 核心功能与交互 |
|---|---|---|---|
| `/` | `src/routes/+page.svelte` | **公开待办周日历看板** | 多用户周日历协同矩阵、周导航与日期快速选择器、分类筛选图例、待办详情/Reaction 弹窗、快捷发布弹窗 |
| `+error.svelte` | `src/routes/+error.svelte` | **通用错误页 (404/500)** | 极简友好的异常拦截页，支持一键返回首页 |

---

## 3. 代码目录与组件架构

```
src/
├── lib/
│   ├── types/
│   │   ├── todo.ts               # Todo、Reaction、Author、Category 等 TypeScript 类型
│   │   └── user.ts               # UserProfile 与本地会话类型
│   ├── constants/
│   │   ├── categories.ts         # 6 大静态分类配置（学习、健身、理财、开发、生活、其他）与胶囊配色
│   │   ├── reactions.ts          # 4 种 Emoji 互动定义（👀、🔥、💪、👏）与样式
│   │   └── status.ts             # 4 种 Todo 状态定义与状态机转移规则
│   ├── utils/
│   │   └── calendar.ts           # 周区间计算、日期格式化、用户排序与待办排序算法
│   ├── services/
│   │   ├── api.ts                # RESTful API 客户端统一封装（含 getCalendarWeekData）
│   │   └── avatar.ts             # DiceBear 动态头像生成工具
│   ├── stores/
│   │   ├── user.svelte.ts        # 当前用户身份持久化 Store (localStorage)
│   │   └── toast.svelte.ts       # 全局 Toast 消息提示 Store
│   └── components/
│       ├── common/               # 通用基础 UI 组件
│       │   ├── Avatar.svelte         # 智能头像组件
│       │   ├── StatusBadge.svelte    # 状态胶囊徽章
│       │   ├── CategoryBadge.svelte  # 分类色彩标签
│       │   ├── ToastContainer.svelte # 全局浮动提示容器
│       │   └── Modal.svelte          # 模态弹窗基座（use:portal 挂载）
│       ├── calendar/             # 日历核心业务组件
│       │   ├── CalendarMatrix.svelte # 多用户周日历主网格容器（固定表头、Sticky 左侧列）
│       │   ├── CalendarToolbar.svelte# 周导航（‹ Today ›）与可点击日期快速选择器
│       │   ├── CalendarUserRow.svelte# 单个用户的横向日期泳道
│       │   ├── CalendarCell.svelte   # 单天单元格容器（状态优先级排序、+N more 折叠）
│       │   ├── TodoPill.svelte       # 纯文本彩色待办胶囊（呼吸灯边框、已完成划线）
│       │   └── CategoryLegend.svelte # 底部 6 大分类图例与点击高亮过滤器
│       ├── todo/                 # 待办交互弹窗
│       │   ├── TodoDetailModal.svelte# 待办详情、Emoji 表态与状态流转弹窗
│       │   ├── DayTodosModal.svelte  # 单天完整待办列表弹窗（+N more 触发）
│       │   ├── CreateTodoModal.svelte# 极简发布弹窗（支持预选日期）
│       │   ├── EditTodoModal.svelte  # 待办编辑弹窗
│       │   └── ReactionBar.svelte    # 4 款 Emoji 乐观更新互动栏
│       └── user/                 # 用户身份组件
│           ├── UserIdentityBar.svelte# 顶部身份信息与下拉操作菜单
│           └── UserProfileModal.svelte# 用户资料（昵称、头像）修改弹窗
└── routes/
    ├── +layout.svelte            # 全局宽幅基座（max-w-7xl、Header、Footer、Toast）
    ├── +error.svelte             # 错误拦截页
    ├── +page.svelte              # 周日历主页面
    ├── layout.css                # Tailwind CSS v4 与 @keyframes pulseGlow 呼吸灯动画
    └── api/                      # 后端接口路由
```

---

## 4. 核心功能与交互规范

### 4.1 多用户周日历矩阵 (Multi-User Calendar Matrix)
- **X 轴（列）**：当前周的周一至周日 7 天（Mon ~ Sun），当日高亮强调。
- **Y 轴（行）**：
  - 仅展示在**当前选定周内确实有待办**的创作者泳道，无待办用户不占空行；
  - 若当前访问者已登录，**“我”的泳道始终固定在第 1 行**，方便悬停直接在各日期格子上添加待办；
  - 其余用户按 `lastTodoUpdatedAt`（最近更新时间）降序排列。
- **左侧用户列响应式 Sticky 固定 (`sticky left-0 z-10`)**：
  - **桌面端**：宽度 180px，展示头像、昵称、@handle 与“我”标记；
  - **移动端**：宽度收窄至 56px，仅居中展示头像，隐藏文字，最大化右侧日历网格宽度。

### 4.2 待办胶囊卡片 (Todo Pill) 规范
- **纯文本呈现**：不加任何多余图标/徽标，仅展示任务文本，根据 6 大分类分配柔和背景与文字色；
- **`in_progress`（进行中）**：边框带有**呼吸灯动态发光效果 (`animate-pulse-glow`)**；
- **`done`（已完成）/ `abandoned`（已放弃）**：文字带有删除线（`line-through opacity-60`）；
- **单元格内排序**：`in_progress` (呼吸灯置顶) > `pending` > `done` > `abandoned`；相同状态按 `createdAt ASC`（创建时间正序）。
- **单元格空间保护**：单天超过 3 条 Todo 时自动折叠显示 `+N more`，点击弹出当天完整列表。

### 4.3 周导航与日期选择器
- 一体化分段导航栏：
  - **日期指示器**：显示当前周区间（如 `Aug 24 – Aug 30, 2026`），点击直接唤起系统 DatePicker 选择任意日期，并自动跳转至对应周；
  - **分段控制按钮组**：`‹` 上一周、`Today` 回到今天、`›` 下一周。

### 4.4 免密身份与极简发布
- **免密码评论模式**：输入 `email` 即可关联或自动注册账号；
- **发布方式**：
  - 右下角常驻悬浮主操作按钮 (FAB `+`)；
  - 日历单元格悬停快速新建（自动预填该单元格日期）；
- **互动与流转**：点击胶囊弹出详情弹窗，支持 4 款 Emoji（👀🔥💪👏）乐观更新互动，作者可自由流转待办状态。
