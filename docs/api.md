# ShowTodo — Production RESTful API Specification

> **Document Status**: Production Ready  
> **Audience**: Frontend Developers, QA Automation Engineers, Integration Partners  
> **Core Philosophy**: Built for public transparency, walk-together companionship, mutual accountability, and radical openness.

---

## 1. Protocol & Global Standards

### 1.1 Base URL & Transport
- **Development**: `http://localhost:3003/api`
- **Production**: `https://<your-domain>/api`
- **Transport**: HTTPS / HTTP 1.1 / HTTP 2
- **Encoding**: `UTF-8`

### 1.2 Global Request Headers
All mutating requests (`POST`, `PATCH`, `DELETE`) should provide:
```http
Content-Type: application/json
Accept: application/json
```

#### Optional Context Headers
- `x-timezone`: Client IANA timezone identifier (e.g., `Asia/Shanghai`, `America/New_York`, `UTC`). Defaults to `Asia/Shanghai` if omitted or invalid. Used for accurate date aggregation and local day boundaries.
- `x-user-id`: Client UUID for personal state projection and permission detection when `currentUserId` query parameter is omitted.

### 1.3 Identification & Temporal Conventions
- **Dates (`YYYY-MM-DD`)**: Local calendar day string (ISO 8601 Date), e.g., `2026-08-26`.
- **Timestamps (`ISO 8601`)**: Full timezone-aware UTC ISO timestamp, e.g., `2026-08-26T08:30:00.000Z`.
- **Entity UUID (`id`)**: Canonical UUID v4 (36 chars), e.g., `a9bf1c17-646e-4401-9f93-5c026e64ec64`.
- **Short Identifier (`shortId`)**: URL-safe base62 string (6–12 chars), e.g., `8x2k9a1b`, used for clean sharing links.
- **Topic Hash (`topicHash`)**: 16-character hexadecimal hash derived from normalized content (`SHA256(normalize(content)).substring(0, 16)`).

---

## 2. Standardized Error Response

On failure, endpoints respond with HTTP 4xx or 5xx status codes and a structured JSON payload:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Content is required and must not be empty"
  }
}
```

### Global Error Code Matrix

| Error Code (`code`) | HTTP Status | Triggering Scenario | Client Remediation |
|---|---|---|---|
| `VALIDATION_ERROR` | `400 Bad Request` | Missing required fields, invalid date/UUID format, exceeding length limits | Display field feedback based on `message` |
| `INVALID_STATUS_TRANSITION` | `400 Bad Request` | Target status is not in the valid state machine enumeration | Refresh item state or prompt invalid action |
| `FORBIDDEN` | `403 Forbidden` | Provided `email` does not match the resource author | Prompt "Only author can perform this action" |
| `NOT_FOUND` | `404 Not Found` | Requested Todo, User, or Topic hash does not exist | Show 404 Empty State or redirect to Square |
| `DUPLICATE_REACTION` | `409 Conflict` | Same user attempting to react with identical emoji on same todo | Safe to ignore or toggle off |
| `INTERNAL_ERROR` | `500 Internal Error` | Database connection error, unhandled runtime exception | Display "Service temporarily unavailable" |

---

## 3. Domain Constants & Enumerations

### 3.1 Todo Lifecycle Status (`status`)
| Status Code | Label | Description | Allowed Next States |
|---|---|---|---|
| `pending` | Pending | Newly created or planned | `in_progress`, `done`, `abandoned` |
| `in_progress` | In Progress | Actively being worked on | `pending`, `done`, `abandoned` |
| `done` | Completed | Finished successfully (supports reopening) | `pending`, `in_progress`, `abandoned` |
| `abandoned` | Abandoned | Shelved or canceled (supports reopening) | `pending`, `in_progress`, `done` |

*Note: The state machine is fully connected and bidirectional. Same-state transitions (`from === to`) are idempotent no-ops.*

### 3.2 Categories (`category`)
| ID | Display Label | Semantic Purpose |
|---|---|---|
| `study` | Study | Reading, certifications, academic research, note-taking |
| `fitness` | Fitness | Running, gym, sports, diet and health targets |
| `finance` | Finance | Budgeting, investing, financial management |
| `dev` | Dev | Coding, side projects, releases, technical writing |
| `life` | Life | Chores, daily routines, social gatherings |
| `other` | Other | General unclassified aspirations |

### 3.3 Reaction Indicators (`emoji`)
The platform supports 8 reaction indicators for peer cheering and witnessing. The backend validator (`VALID_EMOJIS` in `validation.ts`) and database schema strictly enforce the literal Unicode emoji character:

| Emoji | Name | Unicode Escape | Semantic Intent | Active Color Scheme |
|---|---|---|---|---|
| `❤️` | Heart | `\u2764\ufe0f` | Care and solidarity | Rose tint (`border-rose-300 text-rose-700`) |
| `👍` | Like | `\ud83d\udc4d` | Endorsement and agreement | Blue tint (`border-blue-300 text-blue-700`) |
| `🔥` | Fire | `\ud83d\udd25` | Momentum and encouragement | Orange tint (`border-orange-300 text-orange-700`) |
| `💪` | Strong | `\ud83d\udcaa` | Determination and persistence | Emerald tint (`border-emerald-300 text-emerald-700`) |
| `👏` | Clap | `\ud83d\udc4f` | Celebration and applause | Amber tint (`border-amber-300 text-amber-700`) |
| `🚀` | Rocket | `\ud83d\ude80` | Accelerated progress | Indigo tint (`border-indigo-300 text-indigo-700`) |
| `🎉` | Party | `\ud83c\udf89` | Milestone celebration | Yellow tint (`border-yellow-300 text-yellow-700`) |
| `👀` | Watching | `\ud83d\udc40` | Witnessing and observation | Zinc tint (`border-zinc-300 text-zinc-700`) |

*Protocol Specification*: Mutation endpoints (`POST/DELETE /api/todos/:id/reactions`) require the literal Unicode character (or its JSON-encoded Unicode escape). The `reactions` map returned in Todo payloads uses these Unicode characters as keys. English words (such as `"fire"` or `"rocket"`) are not accepted by the API validator and will produce `400 Bad Request`.

---

## 4. Detailed API Endpoints

---

### 4.1 Todo Operations (`/api/todos`)

#### `GET /api/todos` — Query Todo Feed Stream
Retrieve a paginated stream of public todos with rich filtering options.

##### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `status` | `string` | No | - | Filter by status (`pending`, `in_progress`, `done`, `abandoned`) |
| `category` | `string` | No | - | Filter by category ID |
| `authorId` | `string` | No | - | Filter by author user UUID |
| `currentUserId` | `string` | No | - | Current user UUID for personal reaction state & companion resolution |
| `cursor` | `string` | No | - | Cursor Todo UUID (v4) of the last fetched item for keyset pagination |
| `limit` | `integer` | No | `20` | Max items to return (`1 <= limit <= 1000`) |
| `startDateFrom` | `string` | No | - | Scheduled start date window start (`YYYY-MM-DD` or ISO) |
| `startDateTo` | `string` | No | - | Scheduled start date window end (`YYYY-MM-DD` or ISO) |
| `dueDateFrom` | `string` | No | - | Due date window start |
| `dueDateTo` | `string` | No | - | Due date window end |

##### Response (200 OK)
```json
{
  "todos": [
    {
      "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
      "shortId": "8x2k9a1b",
      "topicHash": "7f8b9a1c2d3e4f5a",
      "content": "Ship public API documentation",
      "note": "Complete all 19 endpoints",
      "isNotePublic": true,
      "category": "dev",
      "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
      "status": "in_progress",
      "startDate": "2026-08-26T08:00:00.000Z",
      "dueDate": "2026-08-28T18:00:00.000Z",
      "createdAt": "2026-08-26T08:00:00.000Z",
      "updatedAt": "2026-08-26T10:15:00.000Z",
      "author": {
        "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
        "nickname": "Alex Chen",
        "handle": "alexchen",
        "avatar": null
      },
      "reactions": { "❤️": 0, "👍": 2, "🔥": 5, "💪": 3, "👏": 1, "🚀": 4, "🎉": 0, "👀": 7 },
      "myReactions": ["🔥", "🚀"],
      "topicParticipantCount": 3,
      "myJoinedTodo": null
    }
  ],
  "nextCursor": "78c946e3-f661-4fa3-9f5b-1662991ddf31"
}
```

---

#### `POST /api/todos` — Publish a Public Todo
Publish a new public commitment. Providing an email automatically finds or provisions a user profile.

##### Request Body
| Field | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `email` | `string` | **Yes** | - | Valid email, max 255 chars | Author identifier |
| `content` | `string` | **Yes** | - | `1 <= length <= 1000` | Todo statement |
| `note` | `string` | No | `null` | Max 5000 chars | Optional detailed notes/plans |
| `isNotePublic` | `boolean` | No | `true` | `true` or `false` | Public visibility of notes |
| `category` | `string` | No | `null` | Category enum whitelist | Categorical tag |
| `startDate` | `string` | No | Current time | ISO 8601 or `YYYY-MM-DD` | Planned start date/time |
| `dueDate` | `string` | No | `null` | ISO 8601 or `YYYY-MM-DD` | Planned deadline |

##### Response (201 Created)
```json
{
  "todo": {
    "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "shortId": "8x2k9a1b",
    "topicHash": "7f8b9a1c2d3e4f5a",
    "content": "Read 30 minutes of TypeScript Handbook",
    "note": "Chapters on Type Guards and Conditional Types",
    "isNotePublic": true,
    "category": "study",
    "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "status": "pending",
    "startDate": "2026-08-26T08:00:00.000Z",
    "dueDate": null,
    "createdAt": "2026-08-26T08:00:00.000Z",
    "updatedAt": "2026-08-26T08:00:00.000Z",
    "reactions": { "❤️": 0, "👍": 0, "🔥": 0, "💪": 0, "👏": 0, "🚀": 0, "🎉": 0, "👀": 0 },
    "myReactions": []
  },
  "author": {
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

#### `GET /api/todos/:id` — Get Todo Details & Growth Timeline
Fetch single todo by UUID or 8-character `shortId`. Returns author info, reaction counts, personal reactions, and full historical activity logs.

##### Path & Query Parameters
- Path `:id`: UUID or shortId.
- Query `currentUserId`: Optional UUID to identify viewer reactions and companion states.

##### Response (200 OK)
```json
{
  "todo": {
    "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "shortId": "8x2k9a1b",
    "topicHash": "7f8b9a1c2d3e4f5a",
    "content": "Read 30 minutes of TypeScript Handbook",
    "note": "Focus on type transformation utilities",
    "isNotePublic": true,
    "category": "study",
    "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "status": "in_progress",
    "startDate": "2026-08-26T08:00:00.000Z",
    "dueDate": null,
    "createdAt": "2026-08-26T08:00:00.000Z",
    "updatedAt": "2026-08-26T09:30:00.000Z",
    "author": {
      "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
      "nickname": "Alex Chen",
      "handle": "alexchen",
      "avatar": null
    },
    "reactions": { "❤️": 1, "👍": 4, "🔥": 2, "💪": 0, "👏": 0, "🚀": 1, "🎉": 0, "👀": 3 },
    "myReactions": ["🔥"],
    "activities": [
      {
        "id": "11c946e3-f661-4fa3-9f5b-1662991ddf01",
        "todoId": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
        "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
        "type": "created",
        "fromStatus": null,
        "toStatus": "pending",
        "content": null,
        "createdAt": "2026-08-26T08:00:00.000Z"
      },
      {
        "id": "22c946e3-f661-4fa3-9f5b-1662991ddf02",
        "todoId": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
        "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
        "type": "status_change",
        "fromStatus": "pending",
        "toStatus": "in_progress",
        "content": "Coffee poured, ready to dig into mapped types",
        "createdAt": "2026-08-26T09:30:00.000Z"
      }
    ]
  }
}
```

---

#### `PATCH /api/todos/:id` — Update Todo & Record Check-in Progress
Update content, reschedule, transit status, or log a progress note. Requires author `email` in request body.

##### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | **Yes** | Author email for authorization |
| `content` | `string` | No | New todo statement |
| `note` | `string \| null` | No | Updated detailed note |
| `isNotePublic` | `boolean` | No | Visibility flag for note |
| `category` | `string \| null` | No | Category ID |
| `status` | `string` | No | New status (`pending`, `in_progress`, `done`, `abandoned`) |
| `startDate` | `string` | No | ISO timestamp or date |
| `dueDate` | `string \| null` | No | ISO timestamp or date |
| `activityNote` | `string \| null` | No | Optional reflection log or status reason (`<= 1000` chars) |

##### Automated Activity Logging Rules:
- If `status` changes: logs `type: 'status_change'` with `activityNote` as content.
- If `status` remains unchanged but `activityNote` is provided: logs `type: 'progress_note'` as a standalone check-in log.

##### Response (200 OK)
```json
{
  "todo": {
    "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "shortId": "8x2k9a1b",
    "content": "Read 30 minutes of TypeScript Handbook",
    "note": "Completed chapter on conditional types",
    "isNotePublic": true,
    "category": "study",
    "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "status": "done",
    "startDate": "2026-08-26T08:00:00.000Z",
    "dueDate": null,
    "createdAt": "2026-08-26T08:00:00.000Z",
    "updatedAt": "2026-08-26T10:30:00.000Z"
  }
}
```

---

#### `DELETE /api/todos/:id` — Delete Todo
Delete a todo by UUID or shortId. Requires author authorization via `email` provided in JSON body or query param `?email=...`. Cascade deletes all related activities and reactions.

##### Response (200 OK)
```json
{
  "success": true
}
```

---

#### `GET /api/todos/:id/topic` — Retrieve Topic Info for Todo
Returns the topic hash and total peer participant count for a specific todo.

##### Response (200 OK)
```json
{
  "topicHash": "7f8b9a1c2d3e4f5a",
  "participantCount": 3
}
```

---

### 4.2 Walk-Together Discovery & Goals (`/api/topics`)

#### `GET /api/topics` — Discover Walk-Together Goals Leaderboard
Discover goals with multiple companions walking together. Supports keyword search, time window filters, and multi-criteria sorting.

##### Query Parameters
| Parameter | Type | Required | Default | Values / Description |
|---|---|---|---|---|
| `category` | `string` | No | `all` | Filter by category ID |
| `scope` | `string` | No | `all` | `all` (everyone) or `mine` (goals I participate in) |
| `sortBy` | `string` | No | `participants` | `participants` (popularity), `recent` (latest action), `completion` (highest rate) |
| `timeRange` | `string` | No | `all` | `today` (scoped to current day) or `all` (all time) |
| `date` | `string` | No | - | Filter target day (`YYYY-MM-DD`) |
| `search` | `string` | No | - | Keyword search matching goal content (max 100 chars) |
| `minParticipants` | `integer` | No | `1` | Filter goals having at least N participants (e.g., `2` for multiplayer only) |
| `currentUserId` | `string` | No | - | Current user UUID for personal status flags |
| `limit` | `integer` | No | `20` | Max records (`1 <= limit <= 100`) |
| `offset` | `integer` | No | `0` | Pagination offset (`>= 0`) |

##### Response (200 OK)
```json
{
  "total": 12,
  "topics": [
    {
      "topicHash": "7f8b9a1c2d3e4f5a",
      "content": "Read for 30 minutes daily",
      "category": "study",
      "isMultiplayer": true,
      "totalParticipants": 8,
      "doneCount": 5,
      "completionRate": 62.5,
      "isAllDone": false,
      "firstCreatedAt": "2026-08-01T07:00:00.000Z",
      "lastUpdatedAt": "2026-08-26T14:20:00.000Z",
      "participants": [
        {
          "todoId": "88c946e3-f661-4fa3-9f5b-1662991ddf31",
          "shortId": "9x2k9a1c",
          "status": "done",
          "createdAt": "2026-08-26T08:00:00.000Z",
          "isMe": true,
          "user": {
            "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
            "nickname": "Alex Chen",
            "handle": "alexchen",
            "avatar": null
          }
        }
      ]
    }
  ],
  "hasMore": false
}
```

---

#### `GET /api/topics/:hash` — Goal Detail & Companion Roster
Retrieve deep companion metrics and full participant lists for a specific goal hash.

##### Path Parameters
- `:hash`: 16-character topic hash.

##### Query Parameters
- `currentUserId`: Viewer UUID.
- `date`: Target date (`YYYY-MM-DD`).
- `tz`: Optional IANA timezone identifier.

##### Response (200 OK)
```json
{
  "topic": {
    "topicHash": "7f8b9a1c2d3e4f5a",
    "content": "Read for 30 minutes daily",
    "category": "study",
    "firstCreatedAt": "2026-08-01T07:00:00.000Z",
    "targetDate": "2026-08-26",
    "todayParticipants": 4,
    "todayDoneCount": 3,
    "todayInProgressCount": 1,
    "isTodayAllDone": false,
    "totalParticipants": 8,
    "doneCount": 6,
    "inProgressCount": 1,
    "isAllDone": false,
    "participants": [
      {
        "todoId": "88c946e3-f661-4fa3-9f5b-1662991ddf31",
        "shortId": "9x2k9a1c",
        "status": "done",
        "note": "Finished Chapter 4",
        "startDate": "2026-08-26T08:00:00.000Z",
        "dueDate": null,
        "createdAt": "2026-08-26T08:00:00.000Z",
        "isMe": true,
        "reactions": { "❤️": 1, "👍": 2, "🔥": 4, "💪": 0, "👏": 0, "🚀": 0, "🎉": 0, "👀": 1 },
        "myReactions": ["🔥"],
        "user": {
          "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
          "nickname": "Alex Chen",
          "handle": "alexchen",
          "avatar": null
        }
      }
    ]
  }
}
```

---

### 4.3 Daily Stream & Weekly Calendar

#### `GET /api/daily` — Daily Aggregated Action Cards
Aggregates tasks on a specific calendar date into unified cards using `topicHash`.

##### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `date` | `string` | **Yes** | - | Target date (`YYYY-MM-DD`) |
| `category` | `string` | No | `all` | Filter by category ID |
| `onlyMine` | `boolean` | No | `false` | Only return cards joined by current user |
| `currentUserId` | `string` | No | - | Current user UUID |
| `limit` | `integer` | No | `1000` | Pagination capacity limit |
| `offset` | `integer` | No | `0` | Offset |

##### Response (200 OK)
```json
{
  "date": "2026-08-26",
  "totalCards": 1,
  "cards": [
    {
      "topicHash": "7f8b9a1c2d3e4f5a",
      "content": "Read for 30 minutes daily",
      "category": "study",
      "isMultiplayer": true,
      "totalParticipants": 2,
      "doneCount": 1,
      "participants": [
        {
          "todoId": "88c946e3-f661-4fa3-9f5b-1662991ddf31",
          "shortId": "9x2k9a1c",
          "status": "done",
          "createdAt": "2026-08-26T08:00:00.000Z",
          "isMe": true,
          "user": {
            "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
            "nickname": "Alex Chen",
            "handle": "alexchen",
            "avatar": null
          }
        }
      ]
    }
  ]
}
```

---

#### `GET /api/calendar` — Weekly Creator Swimlane Matrix
User-first calendar matrix returning active creators with commitments in `[startDateFrom, startDateTo]` and their tasks.

##### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `startDateFrom` | `string` | **Yes** | - | Week start date (`YYYY-MM-DD`) |
| `startDateTo` | `string` | **Yes** | - | Week end date (`YYYY-MM-DD`) |
| `limit` | `integer` | No | `20` | User pagination limit |
| `offset` | `integer` | No | `0` | User offset |
| `currentUserId` | `string` | No | - | Places current user at the top swimlane |
| `category` | `string` | No | - | Category filter |

##### Response (200 OK)
```json
{
  "users": [
    {
      "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
      "nickname": "Alex Chen",
      "handle": "alexchen",
      "avatar": null,
      "lastTodoUpdatedAt": "2026-08-26T12:00:00.000Z"
    }
  ],
  "todos": [
    {
      "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
      "shortId": "8x2k9a1b",
      "content": "Build in public: ship daily updates",
      "note": null,
      "isNotePublic": true,
      "category": "dev",
      "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
      "status": "in_progress",
      "startDate": "2026-08-26",
      "dueDate": null,
      "createdAt": "2026-08-26T08:00:00.000Z",
      "updatedAt": "2026-08-26T08:30:00.000Z",
      "reactions": { "❤️": 0, "👍": 0, "🔥": 2, "💪": 1, "👏": 0, "🚀": 1, "🎉": 0, "👀": 3 }
    }
  ],
  "hasMoreUsers": false
}
```

---

### 4.4 Emotional Reactions (`/api/todos/:id/reactions`)

#### `POST /api/todos/:id/reactions` — Add Emotion Reaction
Cheer and witness a todo using one of the 8 emojis (`❤️`, `👍`, `🔥`, `💪`, `👏`, `🚀`, `🎉`, `👀`). Automatically creates an account if the email is unseen.

##### Request Body
```json
{
  "email": "supporter@example.com",
  "emoji": "🔥"
}
```

##### Response (201 Created)
```json
{
  "reaction": {
    "id": "3bb62c64-41d6-444a-992a-8cf8feccefa7",
    "todoId": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "userId": "b1234567-1111-2222-3333-444455556666",
    "emoji": "🔥",
    "createdAt": "2026-08-26T10:20:00.000Z"
  }
}
```

---

#### `DELETE /api/todos/:id/reactions` — Remove Reaction
Remove an existing reaction for the given email and emoji.

##### Request Body
```json
{
  "email": "supporter@example.com",
  "emoji": "🔥"
}
```

##### Response (200 OK)
```json
{
  "success": true
}
```

---

#### `GET /api/todos/:id/reactions` — Get Reaction Group Details
Returns detailed emoji counts and participant profiles.

##### Response (200 OK)
```json
{
  "reactions": [
    {
      "emoji": "🔥",
      "count": 1,
      "users": [
        {
          "id": "b1234567-1111-2222-3333-444455556666",
          "nickname": "Sarah",
          "avatar": null
        }
      ]
    }
  ]
}
```

---

### 4.5 User Profiles & Observability (`/api/users`)

#### `POST /api/users` — Synchronize User Account
Authenticate or initialize a user account with email.

##### Request Body
```json
{
  "email": "alex@example.com"
}
```

##### Response (200 OK)
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

#### `GET /api/users/:id` — Get Public User Profile
Lookup profile by UUID or `@handle`. Redacts email unless requested by the authenticated owner (`isSelf: true`).

##### Path Parameters
- `:id`: UUID (e.g. `a9bf1c17-...`) or handle (e.g. `alexchen`).

##### Response (200 OK)
```json
{
  "user": {
    "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "handle": "alexchen",
    "nickname": "Alex Chen",
    "avatar": null,
    "createdAt": "2026-08-26T08:00:00.000Z",
    "updatedAt": "2026-08-26T10:30:00.000Z"
  }
}
```

---

#### `PATCH /api/users/:id` — Update User Profile
Update nickname, handle, or avatar. Requires author verification `email`.

##### Request Body
| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | `string` | **Yes** | Author email verification |
| `nickname` | `string` | No | 1–50 characters |
| `handle` | `string` | No | 1–50 characters, lowercase alphanumeric, `-`, `_` |
| `avatar` | `string \| null` | No | Avatar URL, or `null` to clear |

##### Response (200 OK)
```json
{
  "user": {
    "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "email": "alex@example.com",
    "handle": "alexchen",
    "nickname": "Alex Chen",
    "avatar": "https://example.com/avatar.png",
    "createdAt": "2026-08-26T08:00:00.000Z",
    "updatedAt": "2026-08-26T11:00:00.000Z"
  }
}
```

---

#### `GET /api/users/:id/heatmap` — Get User Activity Heatmap
Retrieves daily contribution activity points (created, completed, progress notes) for up to 365 days.

##### Query Parameters
- `days`: Integer between 7 and 365 (default `365`).
- `tz`: Optional IANA timezone identifier.

##### Response (200 OK)
```json
{
  "heatmap": {
    "startDate": "2025-08-27",
    "endDate": "2026-08-26",
    "totalActivities": 142,
    "maxDayCount": 9,
    "days": [
      {
        "date": "2026-08-26",
        "count": 4,
        "level": 2,
        "created": 1,
        "completed": 2,
        "notes": 1
      }
    ]
  }
}
```

---

### 4.6 Platform Observability & Health

#### `GET /api/stats` — Platform Overview & Public Metrics
Returns global platform metrics: total creators, completion ratios, category breakdown, global heatmap, and leaderboards.

##### Query Parameters
- `heatmapDays`: Integer between 7 and 366 (default `365`).
- `tz`: Optional IANA timezone identifier.

##### Response Headers
```http
Cache-Control: public, max-age=15, s-maxage=30, stale-while-revalidate=60
```

##### Response (200 OK)
```json
{
  "overview": {
    "totalTodos": 1280,
    "completedTodos": 912,
    "inProgressTodos": 184,
    "completionRate": 71.25,
    "totalUsers": 340,
    "totalReactions": 4510,
    "todayCreated": 38,
    "todayCompleted": 26,
    "todayActiveUsers": 54
  },
  "categories": [
    { "category": "dev", "total": 520, "completed": 390, "completionRate": 75.0, "percentage": 40.6 },
    { "category": "study", "total": 310, "completed": 220, "completionRate": 70.9, "percentage": 24.2 }
  ],
  "trend": [
    { "date": "2026-08-25", "created": 42, "completed": 31 },
    { "date": "2026-08-26", "created": 38, "completed": 26 }
  ],
  "heatmap": {
    "startDate": "2025-08-27",
    "endDate": "2026-08-26",
    "totalActivities": 4890,
    "maxDayCount": 45,
    "days": []
  },
  "topTopics": [
    {
      "topicHash": "7f8b9a1c2d3e4f5a",
      "content": "Read for 30 minutes daily",
      "category": "study",
      "totalParticipants": 28,
      "doneCount": 19
    }
  ],
  "topUsers": [
    {
      "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
      "nickname": "Alex Chen",
      "handle": "alexchen",
      "avatar": null,
      "completedCount": 84
    }
  ],
  "updatedAt": "2026-08-26T14:30:00.000Z"
}
```

---

#### `GET /api/health` — Service Health & Liveness Probe
Monitors uptime and basic service availability.

##### Response (200 OK)
```json
{
  "status": "ok",
  "timestamp": "2026-08-26T14:30:00.000Z"
}
```

---

## 5. QA Test Matrix & Automated Verification Checklist

| Test ID | Target Endpoint | Test Description | Expected Status | Assertion Rule |
|---|---|---|---|---|
| **TC-TODO-01** | `POST /api/todos` | Create todo with new email | `201 Created` | Auto provisions account; `author.email` matches |
| **TC-TODO-02** | `POST /api/todos` | Empty content body | `400 Bad Request` | `error.code == "VALIDATION_ERROR"` |
| **TC-TODO-03** | `PATCH /api/todos/:id` | Transition `pending` -> `in_progress` | `200 OK` | `todo.status == "in_progress"` |
| **TC-TODO-04** | `PATCH /api/todos/:id` | Reopen todo from `done` -> `pending` | `200 OK` | Valid reopen transition allowed by state machine |
| **TC-TODO-05** | `PATCH /api/todos/:id` | Invalid target status string `unknown_xyz` | `400 Bad Request` | `error.code == "VALIDATION_ERROR"` |
| **TC-TODO-06** | `PATCH /api/todos/:id` | Attempt update using wrong author email | `403 Forbidden` | `error.code == "FORBIDDEN"` |
| **TC-TODO-07** | `DELETE /api/todos/:id` | Author deletes existing todo | `200 OK` | `success == true`; cascades reactions/activities |
| **TC-TODO-08** | `GET /api/todos` | Query feed with category and cursor | `200 OK` | Returns `todos` array and `nextCursor` |
| **TC-TOPIC-01**| `GET /api/topics` | Discover trending goals | `200 OK` | Returns `topics` with participants and completionRate |
| **TC-TOPIC-02**| `GET /api/topics/:hash` | Query specific goal hash | `200 OK` | `topic.topicHash == :hash` |
| **TC-REACT-01**| `POST /api/todos/:id/reactions` | React with `🚀` | `201 Created` | Reaction recorded |
| **TC-REACT-02**| `POST /api/todos/:id/reactions` | Duplicate reaction with same emoji | `409 Conflict` | `error.code == "DUPLICATE_REACTION"` |
| **TC-REACT-03**| `DELETE /api/todos/:id/reactions` | Remove previously placed reaction | `200 OK` | `success == true` |
| **TC-USER-01** | `GET /api/users/:id` | Fetch user profile by handle | `200 OK` | `user.handle` matches, email redacted |
| **TC-USER-02** | `GET /api/users/:id/heatmap` | Fetch user 365-day heatmap | `200 OK` | Returns array of `days` with activity levels 0-4 |
| **TC-STATS-01**| `GET /api/stats` | Fetch platform observability stats | `200 OK` | Returns `overview`, `categories`, `heatmap` |
| **TC-CAL-01**  | `GET /api/calendar` | Valid weekly window query | `200 OK` | Returns active `users` and scoped `todos` |
| **TC-CAL-02**  | `GET /api/calendar` | Missing `startDateFrom` parameter | `400 Bad Request` | `error.code == "VALIDATION_ERROR"` |
