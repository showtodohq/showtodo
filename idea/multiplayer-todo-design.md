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
| `category`（分类） | ❌ 不参与 | 分类属用户主观标签，不参与 Hash 避免同行者因分类不同而被割裂，提高聚合匹配率 |
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
topic_hash = SHA256( normalize(content) ).substring(0, 16)
```

### 3.3 为什么这个设计出色

1. **无生命周期绑定**：没有父子关系、没有外键约束、没有中心节点。发起者删除自己的 Todo，其他人的 `topic_hash` 依然存在，聚合不受影响
2. **天然支持"偶遇式协同"**：即使两个互不相识的用户分别发布了完全相同的待办（哪怕选了不同的分类），他们的 Hash 自动一致，系统天然将他们聚在一起
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
| 修改分类 | ❌ 不变 | 继续留在多人组中（仅更新个人分类属性） |
| 修改正文 | ✅ 变化 | 自动脱离原组 |

### 4.3 编辑正文时的业务分流逻辑

当用户修改正文时：

- **该 Topic Hash 下仅当前用户一人**：直接就地更新，重新计算 Hash，原地迁移；
- **该 Topic Hash 下存在其他参与者**：系统将该记录与原组解绑，计算新 Hash 并独立归组，保证其他参与者的既有待办不受任何篡改。

---

## 5. "加入/一起做" 业务逻辑

```
1. 客户端发起创建请求，携带与目标待办相同的 content（分类可自主选择）
2. 后端执行文本归一化并计算 topic_hash，获得与目标相同的 Hash 值
3. 数据库插入一条独立属于当前用户的待办记录
4. 查询聚合时，多条待办通过相同 topic_hash 自然聚合
```

系统无需维护繁重的关系表、申请审批或群组关系，完全由数据特征决定聚合。

---

## 6. 聚合查询与分页架构

### 6.1 聚合维度

系统按 `topic_hash` 作为第一维度进行分组聚合：

- **单人目标**：同一 Hash 仅有一位创建者
- **多人协同目标**：同一 Hash 下有多位参与者，聚合输出所有参与者的身份及各自完成状态

### 6.2 核心查询原则：以「聚合实体（Topic）」为分页基准

**不能按原始 `todos` 数据行进行物理分页**，否则会产生以下问题：

1. **数据切断**：一个多参与者的目标可能在不同分页中被截断
2. **分页数量失真**：期望一页 N 组聚合目标，按物理行分页会导致实际聚合组数不确定
3. **统计口径偏差**：难以精准计算每组的总参与人数

**正确做法**：在 SQL 层直接按 `topic_hash` 进行 `GROUP BY` 分组与统计，`LIMIT` 针对的是聚合组数。

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
