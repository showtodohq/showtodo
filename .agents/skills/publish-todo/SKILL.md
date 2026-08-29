---
name: publish-todo
description: >-
  Publishes, creates, or batch-creates todos via the web-public-todo REST API.
  Use this skill whenever the user asks to create, publish, post, schedule, batch-insert, or record a todo item in this workspace.
---

# Publish Todo Skill

This skill allows Antigravity to quickly publish and manage todos in the **web-public-todo** (ptdl-alpha) system via its RESTful API.

---

## 1. Quick Start / Execution Workflow

When the user asks to publish or create a todo:

### Method A: Use the Helper Script (Recommended)

Run the included Node.js publishing script located at [publish.mjs](./scripts/publish.mjs):

```bash
node .agents/skills/publish-todo/scripts/publish.mjs \
  --email "user@example.com" \
  --content "Finish sprint planning" \
  --category "dev" \
  --start-date "2026-08-30"
```

#### Supported Script Flags:
| Flag | Alternative | Description | Default |
|---|---|---|---|
| `-e` | `--email` | Author email (**Required**, or set `$PTDL_EMAIL`) | |
| `-c` | `--content` | Todo text content (**Required**, 1-1000 chars) | |
| `-g` | `--category` | Category ID: `study`, `fitness`, `finance`, `dev`, `life`, `other` | `null` |
| `-s` | `--start-date` | Start date in `YYYY-MM-DD` | Today's date |
| `-d` | `--due-date` | Due date in `YYYY-MM-DD` | `null` |
| `-n` | `--note` | Markdown note / details (max 5000 chars) | `null` |
| | `--private-note` | Set note visibility to private | Public (`true`) |
| `-u` | `--base-url` | Server Base URL | `http://localhost:3003` or `$PTDL_API_URL` |
| `-b` | `--batch` | JSON file path containing array of todos | |
| | `--raw` | Output plain JSON response | |

---

### Method B: Direct HTTP Request (`curl`)

```bash
curl -s -X POST "http://localhost:3003/api/todos" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "user@example.com",
    "content": "Deploy v1.0 release",
    "category": "dev",
    "startDate": "2026-08-30",
    "dueDate": "2026-08-31",
    "note": "Verify CI/CD passes before pushing tags",
    "isNotePublic": true
  }'
```

---

## 2. API Specification Reference

### Endpoint: `POST /api/todos`
- **Protocol**: HTTP/JSON
- **Authentication**: **Passwordless (WordPress style)**. Providing an email is sufficient. If the user account does not exist, the server automatically creates the user record and generates a default handle.

### Payload Schema (`application/json`)
| Field | Type | Required | Constraints / Values | Description |
|---|---|---|---|---|
| `email` | `string` | **Yes** | Valid email, max 255 chars | Author identifier |
| `content` | `string` | **Yes** | `1 <= length <= 1000` | The main task description |
| `category` | `string \| null` | No | One of the 6 category IDs (see below) | Categorization |
| `startDate` | `string` | No | Format `YYYY-MM-DD` | Scheduled start date (defaults to today) |
| `dueDate` | `string \| null` | No | Format `YYYY-MM-DD` | Scheduled due date |
| `note` | `string \| null` | No | Max 5000 chars | Additional details / notes |
| `isNotePublic` | `boolean` | No | `true` or `false` (default: `true`) | Note visibility |

---

## 3. Standard Categories (`category`)

When the user specifies or implies a category, map it to one of these valid IDs:

| Category ID | Name (CN) | Color Theme | Common Use Cases |
|---|---|---|---|
| `study` | 学习 | `#3B82F6` (Blue) | Reading books, courses, exam prep, papers |
| `fitness` | 健身 | `#22C55E` (Emerald) | Gym, running, diet, sports, workouts |
| `finance` | 理财 | `#F59E0B` (Amber) | Budgeting, accounting, investment, tax |
| `dev` | 开发 | `#8B5CF6` (Purple) | Coding, bug fixes, architecture, release |
| `life` | 生活 | `#EC4899` (Pink) | Groceries, party, chores, travel, daily life |
| `other` | 其他 | `#6B7280` (Zinc) | General uncategorized tasks |

---

## 4. Batch Publishing Guide

To publish multiple todos at once, create a temporary JSON file (e.g. `scratch/todos.json`):

```json
[
  {
    "email": "exc@example.com",
    "content": "Morning workout 30 mins",
    "category": "fitness",
    "startDate": "2026-08-30"
  },
  {
    "email": "exc@example.com",
    "content": "Review PR #42 for calendar layout",
    "category": "dev",
    "startDate": "2026-08-30",
    "dueDate": "2026-08-30",
    "note": "Check mobile drawer responsiveness"
  }
]
```

Run batch creation:
```bash
node .agents/skills/publish-todo/scripts/publish.mjs --batch scratch/todos.json
```

---

## 5. Response & Verification

### Success Response (`201 Created`)
```json
{
  "todo": {
    "id": "78c946e3-f661-4fa3-9f5b-1662991ddf31",
    "shortId": "8x2k9a1b",
    "content": "Design system refactor",
    "note": "Refactor tokens to Tailwind v4",
    "isNotePublic": true,
    "category": "dev",
    "authorId": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "status": "pending",
    "startDate": "2026-08-30",
    "dueDate": null,
    "createdAt": "2026-08-30T08:00:00.000Z",
    "updatedAt": "2026-08-30T08:00:00.000Z"
  },
  "author": {
    "id": "a9bf1c17-646e-4401-9f93-5c026e64ec64",
    "email": "exc@example.com",
    "handle": "exc",
    "nickname": "exc",
    "avatar": null
  }
}
```

### Verification Step
To verify that the newly created todo appears in the week calendar:
```bash
curl -s "http://localhost:3003/api/calendar?startDateFrom=2026-08-24&startDateTo=2026-08-30" \
  -H "Accept: application/json"
```

---

## 6. Error Codes & Recovery

| Error Code | HTTP Status | Typical Cause | Recommended Agent Action |
|---|---|---|---|
| `VALIDATION_ERROR` | `400` | Content is empty, email format is invalid, or date format is not `YYYY-MM-DD`. | Inspect input values, format date to ISO `YYYY-MM-DD`, and retry. |
| `HTTP_ERROR` (Connection Refused) | N/A | Local development server is not running on port 3003. | Verify if dev server is running (`npm run dev`) or test with custom `--base-url`. |
