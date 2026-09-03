# ptdl-alpha — 前端架构设计与开发规范文档

> **文档状态**: 生产就绪 (Production Ready)  
> **适用对象**: 前端开发工程师、UI/UX 设计师、全栈工程师  
> **文档目标**: 记录与沉淀 ptdl-alpha 前端工程的整体技术选型、App Shell 统一布局标准、Svelte 5 响应式数据流范式、本地更新/乐观更新机制及原子 UI 组件规范。

---

## 1. 产品定位与核心设计哲学

我们的产品美学设计体系严格秉持五大核心支柱：**「极简、克制、高质感、内容为核心、可爱（灵动微动效）」**。

1. **极简 (Minimalist)**：
   - 界面无边界、无多余大边框、无生硬分割线；全屏背景、标题栏与内容流 100% 纯净统一，用优雅宽敞的留白（Whitespace）代替传统分割线；
   - 任何人均可免密快速发布 Todo，所有待办全网公开可见，免去繁琐的注册与认证流程。
2. **克制 (Restrained)**：
   - 采用高级 Zinc（中性冷灰）单色系架构，主次对比分明；
   - 弱化多人协同的冗余视觉噪音，分类仅以 6px 微圆点呼吸点缀，非参与者严格呈现清晰只读态。
3. **高质感 (High Texture & Craftsmanship)**：
   - 严格遵循 Linear / Apple 级别的精细化设计质感，毫米级精确把控深浅双主题下的文字可读性与 Hover 悬浮感知；
   - 顶部 Header 半透明毛玻璃（`backdrop-blur-md`）与纯净卡片阴影相互衬托。
4. **内容为核心 (Content-First)**：
   - 待办正文为最高视觉优先级，去除一切干扰阅读的多余大标题与装饰；
   - 专属多人协同元素在单人待办中完全隐匿，多人条目支持轻量行内折叠与展开。
5. **可爱 · 灵动微动效 (Playful & Delightful Micro-interactions)**：
   - 在严谨克制的单色系中注入“灵动可爱”的情感化设计：果冻弹性交互勾选框（`hover:scale-110`, `active:scale-85`）、鼠标悬停机敏弹出的微型 Tooltip 气泡、多人头像叠层扇形展开；
   - 打勾完成瞬间爆发 300 颗高饱和 3D 物理纸屑与彩带，全天个人待办全部搞定时引爆三次全屏超级大礼炮狂欢！
6. **本地就地响应优先 (Local-First Reactivity)**：
   - 所有交互操作在成功后**一律纯本地就地变异更新，绝对不重新全量请求 API 刷新列表**，保证 0 抖动、0 延迟与丝滑体验。

---

## 2. 技术栈选型矩阵

| 维度 | 选用技术 / 库 | 版本 | 选型理由 |
|---|---|---|---|
| **全栈应用框架** | SvelteKit | ^2.63.0 | 极佳的 SSR/CSR 性能，轻量高效的路由与端点集成 |
| **前端响应式引擎** | Svelte 5 (Runes) | ^5.56.1 | 采用 `$state`, `$derived`, `$props` 细粒度代理响应式，性能卓越 |
| **样式与设计系统** | Tailwind CSS v4 | ^4.3.0 | 现代 CSS-first 配置、极小打包体积、原生深色模式支持 |
| **编程语言** | TypeScript | ^6.0.3 | 严格类型检查 (`strict: true`)，与后端共享 DTO 契约 |
| **通用图标库** | `@iconify/svelte` (Lucide) | ^5.2.2 | 按需加载的高质量 SVG 图标体系 |
| **单元与逻辑测试** | Vitest | ^4.1.8 | 秒级测试执行，保障核心变异与工具函数质量 |

---

## 3. 应用骨架与统一布局规范 (App Shell & Layout)

### 3.1 布局架构草图

```
┌───────────────────────────────────────────────────────────────────┐
│ Header (h-14, sticky top-0, z-30, backdrop-blur-md, border-b)     │
│ [ ⚡ Brand Logo & Title ]                      [ User Avatar/Menu ]│
└───────────────────────────────────────────────────────────────────┘
│                                                                   │
│  Main Container (mx-auto, max-w-3xl sm:max-w-4xl, px-4, py-6~8)   │
│  min-h-[calc(100vh-3.5rem-5rem)]                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Page Content Slot ({@render children()})                    │  │
│  │                                                             │  │
│  │ (极简居中聚焦单列流，为内容展现与创作提供最舒适的阅读视线)  │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│ Footer (py-6, border-t, text-xs text-zinc-400, text-center)       │
│ © 2026 ptdl-alpha · 全网公开协同 Todo · 任何人可发布 · 任何人可围观│
└───────────────────────────────────────────────────────────────────┘
│ Global Overlays (全局浮层):                                       │
│ ├── ToastContainer (fixed top-4 left-1/2 -translate-x-1/2 z-50)   │
│ ├── Modal / Dialog Portals (fixed inset-0 z-50)                   │
│ └── Mobile Drawer (fixed inset-y-0 right-0 w-72 z-40)              │
└───────────────────────────────────────────────────────────────────┘
```

### 3.2 区域详细规范

1. **顶部导航栏 (`Header.svelte`)**:
   - **尺寸与材质**: 高度固定 `h-14` (56px)，粘性置顶 `sticky top-0 z-30`，磨砂半透明背景 `bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md`；
   - **左侧**: 品牌 Logo 图标徽章 + 产品名称（`font-semibold tracking-tight`）；
   - **右侧**: 嵌入 **Apple / Linear 风格的轻量悬浮气泡 (`UserPopover.svelte`)**，点击在头像下方自然下沉弹出。

2. **用户身份与偏好悬浮面板 (`UserPopover.svelte`)**:
   - **轻量透气**: 宽度 `w-72`，采用半透明毛玻璃材质（`backdrop-blur-md`），带 `zoom-in-95` 弹性微展开动效，点击外部或按 `ESC` 自动自然收回；
   - **未绑定身份时**：直接展示极简邮箱输入框与保存按钮，回车即绑定；
   - **已绑定身份时**：展示当前头像、昵称、邮箱，提供「更换邮箱」与「退出身份」功能；
   - **原地无缝切换**：点击「更换邮箱」时，Popover 原地平滑切换为输入表单，无需嵌套弹窗；
   - **外观偏好**：内嵌浅色 (Light)、深色 (Dark)、跟随系统 (System) 三挡一键切换分段按钮。

3. **主工作区 Main (`+layout.svelte`)**:
   - 居中单列流：`mx-auto w-full max-w-3xl sm:max-w-4xl px-4 sm:px-6 py-6 sm:py-8`；
   - 弹性自适应高度：`min-h-[calc(100vh-3.5rem-5rem)]`，确保页面内容较少时 Footer 始终自然贴底。

4. **底部栏 (`Footer.svelte`)**:
   - 极简居中单行：展示版权信息与“全网公开协同 Todo · 任何人可发布 · 任何人可围观”核心理念。

---

## 4. 数据流、排序算法与本地变异架构 (Data Flow & Mutation)

### 4.1 核心原则：0ms 本地就地变异优先
为了彻底避免传统 SPA “操作一次就全量 refetch 导致列表重绘、滚动跳跃、Spinner 闪烁”的糟糕体验，系统严格遵循：**服务端成功/客户端先行，纯本地就地变异响应**。
- **发布待办 / 加入一起做**：0ms 立即在本地列表插入或并入多人聚合，绝不发起全量 Refetch；
- **打勾完成 / 切换状态**：0ms 就地更新状态与统计数据，绝不发起全量 Refetch；
- **精准隔离**：仅在用户真正切换日期或在抽屉里切换了不同账号时才会重新拉取服务端数据。

```mermaid
sequenceDiagram
    autonumber
    actor User as 用户交互 (如发布/标记完成/点赞)
    participant UI as Svelte 5 视图 ($state 响应式代理)
    participant Mut as 本地变异层 (mutation.ts)
    participant API as 后端接口 (http.ts)
    
    User->>Mut: 触发操作 (如 optimisticAction)
    Mut->>Mut: 1. 自动记录状态快照 (Snapshot)
    Mut->>UI: 2. 0ms 立即在本地就地修改数据 (界面即时响应)
    Mut->>API: 3. 异步发送 HTTP 请求
    alt 请求成功 (Success)
        API-->>Mut: 返回服务端实体 / 生成的 ID / 时间戳
        Mut->>UI: 4. 本地静默补充服务端字段
    else 请求失败 (Error)
        API-->>Mut: 抛出 HttpError
        Mut->>UI: 5. 自动安全回滚快照至操作前状态
        Mut->>User: 6. 弹出 Toast 错误反馈
    end
```

### 4.2 待办条目排序核心准则：【个人感知时间优先 (Personal Effective Time)】

#### 决策背景与原因：
1. **防跳动 (Anti-Jittering)**：Todo 类应用必须严格按「创建时间」而非「更新时间」排序，避免打勾或修改备注时列表条目上下剧烈跳动，破坏用户的空间视觉记忆；
2. **个人心流对齐**：对于当前用户参与的目标，用户是在当下的时间点做出行动承诺的。若机械地按早上的首发时间排在最底，用户加入后会产生“任务丢失”的割裂感。

#### 有效时间戳计算公式：
$$\text{effectiveCreatedAt} = \begin{cases} 
\text{myParticipant.createdAt} & \text{若当前用户已参与/发布} \\
\min_{p \in \text{participants}}(\text{p.createdAt}) & \text{若当前用户未参与}
\end{cases}$$

- **交互表现**：未参与的他人目标按全网首发时间排列；一旦当前用户点击「+ 加入一起做」，该条目在本地被赋予当下的最新时间戳，**0ms 顺畅自然地置顶到列表最上方**，让用户确信新任务已就绪；在“我的 (Mine)”视角下严格按个人加入时间倒序排列。

---

## 5. 待办交互与设计系统规范 (Design System & Specs)

### 5.1 待办 4 态生命周期与视觉映射标准 (4-State Status System)

系统支持完整的四态生命周期管理，定义全站统一的图形符号与排版视觉映射：

| 状态定义 | 状态代码 | 交互图标规范 | 文本排版规范 | 操作交互心智 |
| :--- | :--- | :--- | :--- | :--- |
| **待办中** | `pending` | 标准空心正圆 `○` (`stroke-[2.2]`) | `15px`，`text-zinc-900 dark:text-zinc-100 font-medium` | **单次点击**：流转为「已达成」并触发全屏彩屑；<br>**悬停**：呼出 4 态直达选择器 |
| **推进中** | `in_progress` | 右上角 1/4 扇形填充圆 `◔` | `15px`，`text-zinc-900 dark:text-zinc-100 font-medium` | **单次点击**：流转为「已达成」；<br>**悬停**：呼出 4 态直达选择器 |
| **已达成** | `done` | 纯黑实心底 + 加粗白勾 `✓` | `15px`，`text-zinc-500 dark:text-zinc-400 font-normal`，加深删除线 | **单次点击**：回退为「待办中」；<br>**悬停**：呼出 4 态直达选择器 |
| **已放弃** | `abandoned` | 浅灰底 + 极简灰色斜叉 `✕` | `15px`，`text-zinc-400 dark:text-zinc-500 opacity-60 font-normal`，虚化删除线 | **单次点击**：回退为「待办中」；<br>**悬停**：呼出 4 态直达选择器 |

#### 状态机流转图与合法转移矩阵 (State Transition Model)

```mermaid
stateDiagram-v2
    [*] --> pending: 创建待办
    
    pending --> in_progress: 开始推进
    pending --> done: 快速完成 / 标记达成
    pending --> abandoned: 搁置 / 放弃目标
    
    in_progress --> done: 快速完成 / 标记达成
    in_progress --> pending: 暂停 / 重新排期
    in_progress --> abandoned: 搁置 / 放弃目标
    
    done --> pending: 重开待办
    done --> in_progress: 重新推进
    done --> abandoned: 修正状态
    
    abandoned --> pending: 重启待办
    abandoned --> in_progress: 恢复推进
    abandoned --> done: 补记达成
```

| 当前状态 \ 目标状态 | `pending` (待办中) | `in_progress` (推进中) | `done` (已达成) | `abandoned` (已放弃) |
| :--- | :---: | :---: | :---: | :---: |
| **`pending` (待办中)** | - | ✅ 允许 | ✅ 允许 (触发彩屑) | ✅ 允许 |
| **`in_progress` (推进中)** | ✅ 允许 | - | ✅ 允许 (触发彩屑) | ✅ 允许 |
| **`done` (已达成)** | ✅ 允许 (一键重开) | ✅ 允许 | - | ✅ 允许 |
| **`abandoned` (已放弃)** | ✅ 允许 (一键重启) | ✅ 允许 | ✅ 允许 | - |

#### 交互与呈现原则：
1. **二元快速打卡（单击）**：未完成状态（`pending` / `in_progress`）单击直达「已达成」；结束状态（`done` / `abandoned`）单击快速重开为「待办中」；
2. **多态自由直达（悬停 Pop）**：鼠标悬停于复选控制器上方呼出 4 态胶囊条，点击任意项直达目标状态；
3. **只读降噪原则**：他人待办呈现静态只读状态，采用浅灰中性底与低饱和度图形，不响应点击交互。

---

### 5.2 排版与字号设计规范 (Typography Hierarchy)

信息流与待办卡片统一遵循清晰的字号与排版阶梯：

* **核心待办正文**：统一采用 **`15px` (`text-[15px]`)**，行高 `leading-snug`，确保中文字符笔画饱满舒展，兼具桌面端高密度与阅读舒适度；
* **作者昵称**：`12px` (`text-xs`)，`font-semibold`；
* **时间范围、截止时刻与发布时间**：`11px` (`text-[11px]`)，等宽字体 `font-mono text-zinc-400 dark:text-zinc-500`；
  - **当日具体时刻**：优先展示精简时分 `HH:mm`（如 `18:30 截止`）；
  - **跨日时刻**：展示为 `MM-DD HH:mm`；
  - **临期提示视觉**：距截止时间不足 2 小时未达成时，时间标签微高亮为琥珀暖色 (`text-amber-600 dark:text-amber-400 font-medium`)；
* **分类徽标**：`10px` (`text-[10px]`)，`font-medium`；
* **公开备注**：`12px` (`text-xs`)，行高 `leading-relaxed text-zinc-500`。

---

### 5.3 分类即时流筛选与创作闭环 (Category Filter & Creation Loop)

1. **即时无刷新过滤与 URL 同步**：
   - 点击卡片上的分类胶囊即时过滤 Feed 流，URL 同步更新为 `/?category={id}`，支持浏览器历史导航与外链直达；
2. **创作预选联动**：
   - 当分类筛选处于激活态时，顶部发布框（`TodoComposer`）自动预选该分类，形成即看即写的创作闭环；
3. **状态指示与快捷退出**：
   - 动态流标题栏呈现 `[正在筛选: 分类名 ✕]` 状态胶囊，点击 `✕` 或再次点击卡片同分类可一键恢复全网总流。

---

### 5.4 多人同行业务模型与文案规范 (Multiplayer "Together" Model)

1. **参与状态互斥控制**：
   - 当当前用户已加入该多人目标时（`hasJoined === true`），操作区呈现 **`已同行`** 翡翠绿状态徽标；
   - 当用户尚未参与时，呈现 **`+ 一起做`** 快捷加入按钮；
2. **文案词汇体系一致性**：
   - 模块总称：**`今日同行`**
   - 参与度统计：**`N 人同行 · M 达成`**
   - 个人参与态：**`已同行`**

---

### 5.5 纯净沉浸流与灵动微动效 (Playful & Delightful Micro-interactions)
- **背景统一与无边界留白**：全屏大背景、顶部标题栏与内容流统一为同一抹纯净白 (`bg-white`) / 深邃黑 (`dark:bg-zinc-950`)，采用行间距与内边距替代生硬分割线；
- **全屏高饱和物理纸屑 (Canvas Confetti Engine)**：单次达成打卡喷发 300 颗高饱和 3D 纸片、彩带与星形粒子；当日全部达成触发连续三次全屏超级大礼炮 (800+ 颗) 狂欢。

---

### 5.6 待办动态时间线与打卡契约 (Activity Timeline & Check-in Contract)

待办详情建立基于 `activities` 序列的生命周期动态流，维护目标推进的成长轨迹：

1. **动态事件语义分级**：
   * **起点创建 (`created`)**：待办初始化基准事件；
   * **状态跃迁 (`status_change`)**：记录跨状态迁移轨迹，承载随状态流转附带的说明或原因；
   * **进展打卡 (`progress_note`)**：记录在当前状态下追加的阶段性进展、心得或复盘，保留当时的状态阶段快照。
2. **本地变异契约 (Local-First Mutation)**：
   * 追加打卡与状态跃迁严格遵循 4.1 节就地变异原则，由客户端在本地时间线直接执行乐观插入，无需全量重新拉取待办详情；遇到网络异常时自动回滚快照。

---

## 6. 通用原子 UI 组件库规范 (`src/lib/components/ui/`)

所有组件严格基于 **Svelte 5 Runes** 与 **Tailwind CSS v4** 编写，属性严格类型化：

| 组件名称 | 核心 Props / 特性 | 说明 |
|---|---|---|
| `Button.svelte` | `variant`, `size`, `loading`, `disabled`, `leftIcon`, `rightIcon` | 支持 primary, secondary, outline, ghost, danger 等样式 |
| `Input.svelte` | `bind:value`, `type`, `label`, `error`, `helperText`, `size`, `leftIcon`, `rightIcon` | 受控文本输入框，支持错误高亮与图标插槽 |
| `Textarea.svelte` | `bind:value`, `label`, `error`, `rows`, `maxLength` | 自适应多行文本输入，支持字符计数 |
| `Select.svelte` | `bind:value`, `options`, `label`, `error`, `size` | 统一美观的下拉选择框 |
| `Checkbox.svelte` | `bind:checked`, `label`, `disabled` | 优雅的复选框控件 |
| `Badge.svelte` | `variant`, `size`, `dot` | 状态与分类胶囊徽章（neutral, primary, success, warning, danger, purple, pink） |
| `Card.svelte` | `hoverable`, `header`, `children`, `footer`, `onclick` | 基础卡片容器，支持头部/主体/尾部插槽 |
| `Avatar.svelte` | `src`, `name`, `size`, `status` | 支持图片 URL、DiceBear 动态算法 Fallback 与首字母缩写 Fallback |
| `Modal.svelte` | `bind:open`, `title`, `description`, `size`, `header`, `children`, `footer` | 通用弹窗，支持 ESC 关闭、点击遮罩关闭与平滑过渡动效 |
| `Spinner.svelte` | `size`, `class` | 统一的轻量旋转 Loading 指示器 |
| `EmptyState.svelte` | `title`, `description`, `icon`, `actions` | 通用空状态占位展示 |
| `Toast.svelte` | `item: ToastItem` | 单条浮动通知消息（success, error, info, warning） |
| `ToastContainer.svelte`| 全局自动监听 `toast` Store | 顶部居中浮动通知堆叠容器 |

---

## 7. 网络与全局状态管理

### 7.1 网络层 (`src/lib/services/http.ts`)
- 封装统一的 `http.get`, `http.post`, `http.patch`, `http.put`, `http.delete`；
- 结构化异常类 `HttpError`，自动解析服务端标准错误报文 `{ error: { code, message } }`；
- 自动集成全局 `toast.error` 提醒（支持 `silent: true` 静默模式）。

### 7.2 状态管理层 (`src/lib/stores/`)
- `toast.svelte.ts`: 全局通知 Store（支持 `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`）；
- `theme.svelte.ts`: 全局明暗模式 Store（支持 `light`, `dark`, `system` 切换与本地持久化，监听 OS 色彩变更）；
- `user.svelte.ts`: 用户免密 Session 与服务端档案同步管理。

---

## 8. 质量保证与测试体系

```bash
# 1. 运行全量 TypeScript 严格类型与 Svelte 5 Runes 检查
npm run check

# 2. 运行前端工具与本地变异函数自动化测试
npx vitest run src/lib/utils/__tests__/

# 3. 执行生产构建打包
npm run build
```

