# 多人 Todo 设计方案

## 1. 需求定义

在公开待办广场中，支持多人协同参与同一个目标：

- 某人发布一条 Todo 后，其他人可以"加入"这条 Todo
- 每个参与者拥有独立的状态（进行中、已完成、已放弃）和独立的计划日期
- 发起者完成、放弃或删除自己的 Todo，不影响其他参与者
- 所有参与者之间是**完全平权**的，没有管理者/被管理者的关系

---

## 2. 方案选型

### 2.1 候选方案

#### 方案 A：Fork 衍生模式（每人独立记录 + 内容寻址聚合）

每个参与者在 `todos` 表中拥有自己**独立的一条记录**。通过对待办正文内容计算哈希值（`topic_hash`），自动将内容相同的待办聚合在一起。

#### 方案 B：待办元数据 + 用户参与进度表（多对多解耦）

将"待办内容"与"个人打卡进度"拆分为 `todos`（公共内容）和 `user_todos`（个人状态）两张表。

### 2.2 方案 B 的编辑困境

方案 B 下讨论了三种编辑策略：

| 策略 | 描述 | 问题 |
|---|---|---|
| 策略 1：创建者专属管正文 | 只有发起人可以修改正文，其他参与者只能管自己的状态 | 违背平权原则。发起者弃坑、写错字、甚至改成违规内容，所有加入者都被"绑架"，无法自救 |
| 策略 2：写时复制（Copy-on-Write） | 改状态/写笔记继续挂在原 Todo 下；一旦要改正文，自动分叉为独立 Todo | ✅ 唯一合理策略。承认了在公开网络中，唯一的自治方式是"一致时在一起，不一致时自动分流" |
| 策略 3：全员平权协同编辑 | 任何人都能改正文，所有人看到的实时更新 | 公地悲剧。免密公开广场上任何人都能篡改标题，必然导致恶意破坏 |

### 2.3 最终选择：方案 A

**选择方案 A 的核心原因**：

1. **自主性更强**：每个人的 Todo 记录完全独立，天然不受他人影响
2. **架构极简**：不需要新建关系表，只需在 `todos` 表新增一个 `topic_hash` 索引字段
3. **兼容现有体系**：现有的状态机、权限校验、日历泳道、API 接口 100% 零破坏
4. **编辑问题天然解决**：修改正文 → Hash 变化 → 自动脱离原组，逻辑自洽

---

## 3. Topic Hash：内容寻址聚合机制

### 3.1 核心思想

借鉴 Git Commit Hash 和 IPFS 的**内容寻址（Content-Addressable）**思想：

- 不依赖外键、不依赖中心节点、不依赖关系表
- 通过对待办正文内容计算哈希值，内容相同的待办自动拥有相同的 Hash
- 系统按 `topic_hash` 聚合展示，形成"多人卡片"

### 3.2 Hash 计算规则

**参与 Hash 计算的字段**：

| 字段 | 是否参与 | 理由 |
|---|:---:|---|
| `content`（正文） | ✅ 必须 | 核心灵魂，决定大家是否在做同一件事 |
| `category`（分类） | ✅ 参与 | 区分语境（`study: 读《原则》` vs `finance: 读《原则》`） |
| `status`（状态） | ❌ 不参与 | A 已完成、B 还在进行中，必须保持同一 Hash 才能呈现不同进度 |
| `startDate` / `dueDate` | ❌ 不参与 | A 周一做、B 周三加入，依然在同一个目标下 |
| `note` / `isNotePublic` | ❌ 不参与 | 个人私有笔记，每个人完全不同 |
| `authorId` / `id` / 时间戳 | ❌ 不参与 | 每个人唯一，参与了就退化成单人私有 Hash |

**文本归一化预处理**（降低误脱离率）：

1. 去除首尾空白
2. 全部转小写（针对英文）
3. 连续空白/换行折叠为单个空格
4. 去除末尾标点符号（句号、逗号等）

**计算公式**：

```
topic_hash = SHA256( category + ":" + normalize(content) ).substring(0, 16)
```

### 3.3 为什么这个设计出色

1. **无生命周期绑定**：没有父子关系、没有外键约束、没有中心节点。发起者删除自己的 Todo，其他人的 `topic_hash` 依然存在，聚合不受影响
2. **天然支持"偶遇式协同"**：即使两个互不相识的用户分别发布了完全相同的待办，他们的 Hash 自动一致，系统天然将他们聚在一起
3. **架构极简**：数据库只需要在 `todos` 表加一个普通索引字段 `topic_hash TEXT`

---

## 4. 编辑与分流

### 4.1 核心原则

> **修改正文 = Hash 变化 = 自动脱离原组**

### 4.2 场景分类

| 修改内容 | Hash 是否变化 | 行为 |
|---|:---:|---|
| 只改状态（如标记完成） | ❌ 不变 | 继续留在多人组中 |
| 只改日期 | ❌ 不变 | 继续留在多人组中 |
| 只改备注/笔记 | ❌ 不变 | 继续留在多人组中 |
| 修改正文或分类 | ✅ 变化 | 自动脱离原组 |

### 4.3 编辑正文时的 UX 流程

当用户修改正文时，后端检测该 `topic_hash` 下是否有其他参与者：

- **无其他参与者**（仅自己一人）：直接修改，重新计算 Hash，无需提示
- **有其他参与者**（多人组）：前端弹窗确认

```
┌──────────────────────────────────────────────────┐
│  当前有 8 位小伙伴正在一起进行「每天背50个单词」。 │
│  修改文字将为您创建专属新待办，并离开当前组。     │
│                                                  │
│  [ 取消 ]              [ 确认修改并独立 ]         │
└──────────────────────────────────────────────────┘
```

确认后，后端重新计算 `topic_hash`，新 Hash 值 → 自动脱离原组。

---

## 5. "加入/一起做" 流程

```
1. 用户在首页看到其他人的待办卡片（如「每天晨跑5公里」）
2. 点击「一起做」按钮
3. 前端调用 POST /api/todos，body 中复制原 Todo 的 content 和 category
4. 后端自动计算 topic_hash → 值与原 Todo 一致
5. 下次查询时，两人自然聚合在同一张多人卡片中
```

不需要任何"邀请"、"加入"、"审批"环节，也不需要新建关系表或群组表。

---

## 6. 首页单日列表查询架构

### 6.1 视图模式

首页采用**单天待办列表视图**，以卡片形式展示当天所有人的待办：

- **单人卡片**：仅自己一人的普通待办
- **多人卡片**：同一 `topic_hash` 下有多个参与者，展示所有人的头像、昵称和各自的完成状态

### 6.2 核心查询原则：以「卡片」为分页基准

**不能按 `todos` 行记录分页**，否则会产生以下问题：

1. **分页撕裂**：一个 8 人多人卡片可能被切断，前 3 人在第 1 页，后 5 人在第 2 页
2. **分页数量失真**：期望一页 20 张卡片，实际可能只渲染出 8 张
3. **参与者统计不准**：无法准确获取总参与人数

**正确做法**：在 SQL 层直接按 `topic_hash` 分组聚合，`LIMIT` 针对的是卡片数量。

### 6.3 查询 SQL

```sql
SELECT
  t.topic_hash,
  MAX(t.content) AS content,
  MAX(t.category) AS category,
  MIN(t.created_at) AS first_created_at,
  COUNT(*)::int AS total_participants,
  COUNT(*) FILTER (WHERE t.status = 'done')::int AS done_count,
  json_agg(
    json_build_object(
      'todoId', t.id,
      'shortId', t.short_id,
      'status', t.status,
      'createdAt', t.created_at,
      'isMe', (u.id = :currentUserId),
      'user', json_build_object(
        'id', u.id,
        'nickname', u.nickname,
        'handle', u.handle,
        'avatar', u.avatar
      )
    ) ORDER BY (u.id = :currentUserId) DESC, t.created_at ASC
  ) AS participants
FROM todos t
JOIN users u ON t.author_id = u.id
WHERE t.start_date = :targetDate
  AND (:category IS NULL OR t.category = :category)
GROUP BY t.topic_hash
HAVING (:onlyMine = false OR bool_or(u.id = :currentUserId))
ORDER BY MAX(t.created_at) DESC
LIMIT :limit OFFSET :offset;
```

### 6.4 "只看自己" 筛选

通过 `HAVING` 子句中的 `bool_or(u.id = :currentUserId)` 实现：

- `onlyMine = false`（默认）：看当天全网所有人的待办卡片（广场视角）
- `onlyMine = true`：仅看与我相关的待办卡片（个人工作台视角）

"与我相关"包括：
- ✅ 我自己的单人待办
- ✅ 我有参与的多人待办（展示完整参与者列表）
- ❌ 我没有参与的其他人的待办

### 6.5 返回数据结构

```typescript
interface DailyCardResponse {
  date: string;
  totalCards: number;
  cards: Array<{
    topicHash: string;
    content: string;
    category: string | null;
    isMultiplayer: boolean;      // participants.length > 1
    totalParticipants: number;
    doneCount: number;
    participants: Array<{
      todoId: string;
      shortId: string;
      status: TodoStatus;
      createdAt: string;
      isMe: boolean;
      user: {
        id: string;
        nickname: string;
        handle: string;
        avatar: string | null;
      };
    }>;
  }>;
}
```

---

## 7. 数据库变更摘要

`todos` 表新增 1 个字段：

```sql
ALTER TABLE todos ADD COLUMN topic_hash TEXT NOT NULL;
CREATE INDEX idx_todos_topic_hash ON todos (topic_hash);
```

- `topic_hash`：由 `category + content` 归一化后计算的 SHA-256 前 16 位十六进制字符串
- 在 `POST /api/todos` 创建时由后端自动计算并写入
- 在 `PATCH /api/todos/:id` 修改 `content` 或 `category` 时由后端自动重新计算
