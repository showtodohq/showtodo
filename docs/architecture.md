# ShowTodo — Backend Architecture & Engineering Guide

> **Document Status**: Production Ready  
> **Audience**: Fullstack/Backend Engineers, Software Architects, DBAs, DevOps/SREs  
> **Core Purpose**: Comprehensive technical blueprint detailing ShowTodo's layered architecture, physical relational schemas, domain service contracts, content-addressable topic hashing, timezone safety, and test matrices.

---

## 1. System Architecture Overview

### 1.1 Architectural Philosophy & Positioning
`ShowTodo` is engineered as a **Public Todo & Walk-Together Platform** (Action, Companionship, Accountability, Emulation, Observation, Building in Public). 

The backend does not manage rigid organizational hierarchies, user roles, or approval workflows. Instead, it is built around:
- **Decentralized Content Addressability**: Peer goals are indexed and aggregated by content hash (`topic_hash`), decoupling participants while enabling instant mutual discovery.
- **Zero-Barrier Action**: Instant profile provisioning via email.
- **Radical Observability**: Efficient multi-view aggregation, 365-day contribution heatmaps, and global completion statistics.

### 1.2 Technology Selection Matrix

| Layer / Concern | Chosen Technology | Version | Rationale |
|---|---|---|---|
| **Fullstack Framework** | SvelteKit (Node.js / Edge) | `^2.63.0` | Unified TypeScript runtime, seamless server endpoints (`+server.ts`), fast SSR/CSR |
| **Programming Language** | TypeScript | `^6.0.3` | Strict type checking (`strict: true`), zero-cost contract sharing between backend and UI |
| **ORM & Query Builder** | Drizzle ORM | `^0.45.2` | Type-safe SQL dialect, zero runtime bloat, transparent cold starts |
| **Database Engine** | Neon Serverless PostgreSQL | PostgreSQL 16+ | Elastic auto-scaling, storage-compute separation, serverless branching |
| **Database Driver** | `@neondatabase/serverless` | `^1.1.0` | HTTP pipelining driver without connection-pool exhaustion risks |
| **Testing Framework** | Vitest | `^4.1.8` | Concurrent isolated test suites, sub-second execution |

---

### 1.3 Layered Architecture & Data Flow

The system adheres strictly to a decoupled **Controller — Service — Data Access (Drizzle)** design:

```
┌────────────────────────────────────────────────────────┐
│                   Client Request                        │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON / Query Params / Headers (x-timezone, x-user-id)
                            v
┌────────────────────────────────────────────────────────┐
│      1. Controller Layer (src/routes/api)              │
│  - todos/+server.ts         : Feed list & Todo creation│
│  - todos/[id]/+server.ts    : Detail, patch, deletion  │
│  - todos/[id]/reactions/    : Emoji cheers & counter   │
│  - todos/[id]/topic/        : Topic info by todo       │
│  - topics/+server.ts        : Goals discovery & ranks  │
│  - topics/[hash]/+server.ts : Goal companions & detail │
│  - daily/+server.ts         : Daily topic-hash cards   │
│  - calendar/+server.ts      : Weekly user matrix       │
│  - stats/+server.ts         : Platform metrics & heat  │
│  - users/+server.ts         : Session initialization   │
│  - users/[id]/+server.ts    : Profile get/patch        │
│  - users/[id]/heatmap/      : 365-day user activity    │
│  - health/+server.ts        : Liveness probe           │
│  - validation.ts            : Pure input assertions    │
│  - errors.ts                : Centralized AppError     │
└───────────────────────────┬────────────────────────────┘
                            │ Typed DTOs / Primitive Arguments
                            v
┌────────────────────────────────────────────────────────┐
│      2. Domain Service Layer (src/lib/server/services) │
│  - todo.service.ts          : CRUD, calendar, search   │
│  - user.service.ts          : Auto-provision, privacy  │
│  - activity.service.ts      : Event logging & timeline │
│  - reaction.service.ts      : Reactions & non-N+1 aggr │
│  - stats.service.ts         : Heatmaps, ratios, top-5  │
│  - topic-hash.ts            : SHA-256 normalization    │
│  - timezone.ts              : IANA validation & days   │
└───────────────────────────┬────────────────────────────┘
                            │ Database Instance (DI)
                            v
┌────────────────────────────────────────────────────────┐
│      3. Data Access Layer (src/lib/server/db)          │
│  - schema.ts                : Drizzle tables & enums   │
│  - index.ts                 : Neon HTTP client init    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP SQL Pipeline
                            v
┌────────────────────────────────────────────────────────┐
│      4. Storage Engine: Neon Serverless PostgreSQL     │
└────────────────────────────────────────────────────────┘
```

#### Key Architecture Principles:
1. **Dependency Injection (DI)**: Every domain service function explicitly takes `db: Database` as its first parameter, allowing effortless injection of mock databases or isolated test transactions.
2. **Zero-Dependency Pure Validation**: `validation.ts` uses pure TypeScript functions with zero heavy schema libraries, maintaining near-instant cold-start speeds.
3. **Structured Domain Exceptions**: `AppError` carries business codes and HTTP statuses, formatted uniformly by `handleError(e)`.
4. **Privacy-Preserving Projections**: `toUserProfile` automatically redacts sensitive fields like `email` unless the request represents the authenticated owner (`isSelf: true`).

---

## 2. Physical Data Models & Schema Dictionary

### 2.1 Entity Relationship Diagram

```
┌──────────────────────────────┐                1:N                 ┌──────────────────────────────┐
│            users             │───────────────────────────────────<│            todos             │
├──────────────────────────────┤                                    ├──────────────────────────────┤
│ id: uuid (PK)                │                                    │ id: uuid (PK)                │
│ email: text (UK)             │                                    │ short_id: text (UK)          │
│ handle: text (UK)            │                                    │ topic_hash: text (INDEX)     │
│ nickname: text               │                                    │ author_id: uuid (FK->users)  │
│ avatar: text (nullable)      │                                    │ content: text                │
│ created_at: timestamptz      │                                    │ note: text (nullable)        │
│ updated_at: timestamptz      │                                    │ is_note_public: boolean      │
│ last_todo_updated_at: tz     │                                    │ category: text (nullable)    │
└──────────────────────────────┘                                    │ status: todo_status (enum)   │
        │               │                                           │ start_date: timestamptz      │
        │ 1:N           │ 1:N                                       │ due_date: timestamptz (null) │
        │               │                                           │ created_at: timestamptz      │
        v               v                                           │ updated_at: timestamptz      │
┌──────────────────────────────┐                                    └──────────────────────────────┘
│          reactions           │                                                   │       │
├──────────────────────────────┤                                                   │       │ 1:N (Cascade Delete)
│ id: uuid (PK)                │                                                   │       v
│ todo_id: uuid (FK->todos)    │<──────────────────────────────────────────────────┘ ┌──────────────────────────────┐
│ user_id: uuid (FK->users)    │                                                     │       todo_activities        │
│ emoji: text                  │                                                     ├──────────────────────────────┤
│ created_at: timestamptz      │                                                     │ id: uuid (PK)                │
{{ ... }}
                                                                                     └──────────────────────────────┘
```

---

### 2.2 Physical Tables (`src/lib/server/db/schema.ts`)

#### 1. `users` (User Account & Identity)
| Column | SQL Type | Drizzle Type | Constraints / Defaults | Business Purpose |
|---|---|---|---|---|
| `id` | `uuid` | `uuid` | `PRIMARY KEY`, `defaultRandom()` | Global unique user identifier |
| `email` | `text` | `text` | `NOT NULL`, `UNIQUE` | Email used for user identity |
| `handle` | `text` | `text` | `NOT NULL`, `UNIQUE` | Unique URL handle (e.g. `alexchen`) |
| `nickname` | `text` | `text` | `NOT NULL` | Display name (defaults to email prefix) |
| `avatar` | `text` | `text` | `NULL` | Custom avatar URL (fallback to DiceBear) |
| `created_at` | `timestamptz` | `timestamp` | `NOT NULL`, `defaultNow()` | Profile creation time |
| `updated_at` | `timestamptz` | `timestamp` | `NOT NULL`, `defaultNow()` | Last profile update time |
| `last_todo_updated_at`| `timestamptz` | `timestamp` | `NULL` | Timestamp of latest todo action (for active ranking) |

#### 2. `todos` (Public Todo Commitments)
| Column | SQL Type | Drizzle Type | Constraints / Defaults | Business Purpose |
|---|---|---|---|---|
| `id` | `uuid` | `uuid` | `PRIMARY KEY`, `defaultRandom()` | Todo primary key |
| `short_id` | `text` | `text` | `NOT NULL`, `UNIQUE` | 6–12 character base62 identifier for clean links |
| `topic_hash` | `text` | `text` | `NOT NULL`, `INDEX(idx_todos_topic_hash)` | Content-addressable hash (`SHA256` slice) |
| `content` | `text` | `text` | `NOT NULL` | Todo commitment text (1–1000 chars) |
| `note` | `text` | `text` | `NULL` | Detailed notes/planning (<=5000 chars) |
| `is_note_public`| `boolean`| `boolean` | `NOT NULL`, `default(true)` | Privacy toggle for note field |
| `category` | `text` | `text` | `NULL` | Category tag (`study`, `fitness`, `dev`, etc.) |
| `author_id` | `uuid` | `uuid` | `NOT NULL`, `REFERENCES users(id)` | Foreign key referencing author |
| `status` | `todo_status`| `pgEnum` | `NOT NULL`, `default('pending')` | State machine enum (`pending`, `in_progress`, etc.) |
| `start_date` | `timestamptz`| `timestamp` | `NOT NULL`, `defaultNow()` | Scheduled start timestamp |
| `due_date` | `timestamptz`| `timestamp` | `NULL` | Scheduled deadline |
| `created_at` | `timestamptz`| `timestamp` | `NOT NULL`, `defaultNow()` | Creation timestamp |
| `updated_at` | `timestamptz`| `timestamp` | `NOT NULL`, `defaultNow()` | Last modification timestamp |

#### 3. `reactions` (Peer Cheering & Witnessing)
| Column | SQL Type | Drizzle Type | Constraints / Defaults | Business Purpose |
|---|---|---|---|---|
| `id` | `uuid` | `uuid` | `PRIMARY KEY`, `defaultRandom()` | Reaction PK |
| `todo_id` | `uuid` | `uuid` | `NOT NULL`, `FK(todos.id ON DELETE CASCADE)` | Associated Todo (cascades on delete) |
| `user_id` | `uuid` | `uuid` | `NOT NULL`, `REFERENCES users(id)` | Cheering user |
| `emoji` | `text` | `text` | `NOT NULL` | Reaction code: `heart`, `like`, `fire`, `strong`, `clap`, `rocket`, `party`, `eyes` |
| `created_at` | `timestamptz`| `timestamp` | `NOT NULL`, `defaultNow()` | Timestamp of reaction |

*Unique Constraint: `UNIQUE("todo_id", "user_id", "emoji")` prevents duplicate reaction by the same user.*

#### 4. `todo_activities` (Growth Timeline & Check-in Logs)
| Column | SQL Type | Drizzle Type | Constraints / Defaults | Business Purpose |
|---|---|---|---|---|
| `id` | `uuid` | `uuid` | `PRIMARY KEY`, `defaultRandom()` | Activity PK |
| `todo_id` | `uuid` | `uuid` | `NOT NULL`, `FK(todos.id ON DELETE CASCADE)` | Associated Todo (cascades on delete) |
| `author_id` | `uuid` | `uuid` | `NOT NULL`, `REFERENCES users(id)` | Author of the activity |
| `type` | `todo_activity_type` | `pgEnum` | `NOT NULL`, `default('status_change')` | Event type: `created`, `status_change`, `progress_note` |
| `from_status`| `todo_status` | `pgEnum` | `NULL` | Previous status snapshot |
| `to_status` | `todo_status` | `pgEnum` | `NULL` | New status snapshot |
| `content` | `text` | `text` | `NULL` | Optional check-in reflection or reason (<=1000 chars) |
| `created_at` | `timestamptz` | `timestamp` | `NOT NULL`, `defaultNow()` | Event creation timestamp |

*Composite Index: `idx_todo_activities_todo_created` on `(todo_id, created_at ASC)` guarantees sub-millisecond timeline assembly.*

---

## 3. Domain Service Contracts & Algorithms

---

### 3.1 Todo Service (`todo.service.ts`)

- `create(db, data)`: Creates new todo, generates collision-resistant `shortId`, calculates `topicHash`, records initial `created` activity event, and updates `users.last_todo_updated_at`.
- `findByIdOrShortId(db, identifier, currentUserId?)`: Retrieves todo by UUID or shortId, enriches with author profile, non-N+1 reaction counts, personal reaction states, and chronologically ordered activities. Applies `sanitizeNote` privacy rules.
- `list(db, filters)`: Multi-dimensional querying of the public feed with support for `category`, `status`, `authorId`, `startDate` and `dueDate` windows, and ISO cursor pagination.
- `update(db, idOrShortId, authorEmail, data)`: Author-verified editing. Handles status transitions, logs `status_change` or `progress_note` activities, updates `topicHash` if content changes, and updates user activity timestamp.
- `deleteTodo(db, idOrShortId, authorEmail)`: Author-verified deletion with database-level cascade cleanup.
- `listTopics(db, options)`: Aggregates and ranks Walk-Together goals with participants count, completion rates, time filters (`today` vs `all`), and sorting strategies (`participants`, `recent`, `completion`).
- `getTopicByHash(db, topicHash, currentUserId?, date?, startDateFrom?, startDateTo?, tz?)`: Deep goal inspection, returning both today's active peers and all-time companions.
- `listDailyCards(db, options)`: Aggregates tasks on a given calendar day into unified multi-user cards using `topicHash`, ordered by Personal Effective Time.
- `listForCalendar(db, options)`: Bulk fetches todos for the weekly creator grid, batch-aggregating reactions.

---

### 3.2 Topic Hash Engine (`topic-hash.ts`)

Decoupled content addressability relies on deterministic text normalization and cryptographic hashing:

```typescript
export function normalizeContent(content: string): string {
  if (!content) return '';
  let normalized = content.trim().toLowerCase().replace(/\s+/g, ' ');
  // Strip trailing punctuation (English and CJK)
  normalized = normalized.replace(/[.,!?;:。，！？；：…~～、]+$/g, '').trim();
  return normalized;
}

export function computeTopicHash(content: string): string {
  const normalizedContent = normalizeContent(content);
  return createHash('sha256').update(normalizedContent, 'utf8').digest('hex').substring(0, 16);
}
```

#### Why Content Addressability Excels:
1. **Zero Relationship Overhead**: No junction tables or join entities required.
2. **Serendipitous Discovery**: Unacquainted users committing to the same goal (even with different categories) automatically join the same companion circle.
3. **Sovereign Autonomy**: Deleting or modifying one's own todo never impacts other companions; altering content simply recalculates the hash and moves the creator to their new target.

---

### 3.3 Timezone Domain Utilities (`timezone.ts`)

Ensures multi-timezone resilience and prevents SQL injection:
- `isValidTimezone(tz)`: Validates IANA timezone strings via regex whitelist and `Intl.DateTimeFormat` verification.
- `resolveTimezone(paramTz, headerTz, fallbackTz)`: Priority resolution (`Query > Header > Default 'Asia/Shanghai'`).
- `formatDateInTimezone(date, tz)`: Converts Date into `YYYY-MM-DD` in the target timezone without UTC shift distortion.
- `getPastDaysList(daysCount, endDate, tz)`: Generates sequential `YYYY-MM-DD` day lists for heatmaps.

---

### 3.4 Platform Observability Service (`stats.service.ts`)

- `getSiteOverview(db)`: High-performance parallel aggregation of total todos, completed, in-progress, completion percentages, total creators, and today's dynamic metrics.
- `getCategoryStats(db)`: Computes volume and completion ratios grouped by category.
- `getTrendStats(db, days)`: Daily creation vs completion timeline series.
- `getHeatmapStats(db, days, tz)` / `getUserHeatmapStats(db, userId, days, tz)`: Generates continuous 365-day activity matrices. Levels:
  - `Level 0`: 0 activities
  - `Level 1`: 1–2 activities
  - `Level 2`: 3–5 activities
  - `Level 3`: 6–9 activities
  - `Level 4`: 10+ activities
- `getTopTopics(db, limit)` & `getTopUsers(db, limit)`: Top 5 most pursued companion goals and top 5 completed creators.

---

### 3.5 User Service (`user.service.ts`)

- `findOrCreate(db, email)`: Email-based onboarding. Automatically generates sanitized URL handle and nickname on first appearance.
- `findByIdOrHandle(db, identifier)`: Polymorphic lookup supporting either 36-char UUID or handle string.
- `toUserProfile(user, { isSelf })`: Domain projection ensuring email address is only exposed to the author.
- `listUsersWithTodosInWeek(db, options)`: Efficient user-first calendar query using `INNER JOIN todos` to eliminate inactive empty rows.

---

## 4. State Machine & Business Rules

### 4.1 Fully-Connected Bidirectional Lifecycle

```
        ┌────────────────────────────────────────────────┐
        │                                                │
        │      ┌─────────────┐                           │
        │      │   pending   │                           │
        │      └──────┬──────┘                           │
        │             ^                                  │
        │      Reopen │  Start / Complete / Shelve       │
        │             v                                  │
        │      ┌─────────────┐                           │
        │      │ in_progress │                           │
        │      └──────┬──────┘                           │
        │             ^                                  │
        │      Reopen │  Complete / Shelve               │
        │             v                                  │
        │      ┌─────────────┐                           │
        │      │    done     │                           │
        │      └──────┬──────┘                           │
        │             ^                                  │
        │      Reopen │  Retro / Shelve                  │
        │             v                                  │
        │      ┌─────────────┐                           │
        │      │  abandoned  │                           │
        │      └─────────────┘                           │
        │                                                │
        └────────────────────────────────────────────────┘
```

- **Reopening Freedom**: Both `done` and `abandoned` can transition back to `in_progress` or `pending` with one click.
- **Idempotency**: Transitioning to the same status (`from === to`) is permitted as a no-op without emitting redundant state-change events.

---

## 5. Automated Regression Test Matrix

All backend logic is rigorously verified with **Vitest**:

| Test Suite File | Test Scope & Assertions |
|---|---|
| `validation.test.ts` | 77 test cases covering regex rules, handle sanitation, UUIDs, XSS payloads, and all 16 state machine permutations. |
| `todo.service.test.ts` | 27 test cases verifying CRUD, shortId retries, note redaction, daily card aggregation, and cascade deletions. |
| `user.service.test.ts` | 13 test cases covering auto-onboarding, handle suffix collisions, and authorization protections. |
| `user.projection.test.ts` | Tests privacy projection verifying email redaction when `isSelf: false`. |
| `stats.service.test.ts` | Verifies site overview arithmetic, category completion calculations, and activity heatmap level distributions. |
| `topic-hash.test.ts` | Verifies CJK punctuation trimming, case insensitivity, whitespace collapse, and SHA-256 slicing. |
| `timezone.test.ts` | Tests IANA timezone validation, daylight savings day boundaries, and SQL safety. |
| `topics-query.test.ts` | Verifies multi-participant topic aggregation, sorting algorithms, and participant lists. |
| `reaction.service.test.ts` | Verifies 8-reaction counters, single-query non-N+1 GROUP BY operations, and duplicate 409 prevention. |

---

## 6. Local Development & Operational SOP

### 6.1 Environment Configuration (`.env`)
```env
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/<db_name>?sslmode=require"
```

### 6.2 Standard Engineering Commands
```bash
# 1. Start local hot-reload fullstack server
npm run dev

# 2. Push Drizzle schema updates to dev database
npm run db:push

# 3. Generate and run production migrations
npm run db:generate
npm run db:migrate

# 4. Open Drizzle Studio visual GUI
npm run db:studio

# 5. Type and syntax verification
npm run check

# 6. Execute Vitest test suite
npx vitest run

# 7. Production build
npm run build
```
