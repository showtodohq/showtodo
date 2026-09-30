# ShowTodo — API & Integration Specification

> **Notice**: The canonical, living API specifications and machine-readable context are maintained in the standardized LLM discovery documents:
> - **Full System & API Context**: [`static/llms-full.txt`](../static/llms-full.txt) (or online: `https://www.showtodo.com/llms-full.txt`)
> - **Summary Index**: [`static/llms.txt`](../static/llms.txt) (or online: `https://www.showtodo.com/llms.txt`)

ShowTodo treats human developers and AI agents as first-class citizens. All endpoints, parameters, schemas, and integration specifications are unified in the Single Source of Truth (SSOT) referenced above.

---

## Quick Navigation

### 1. Model Context Protocol (MCP) Interface
- **Endpoint**: `https://www.showtodo.com/api/mcp`
- **Supported Transports**: Streamable HTTP (`POST /api/mcp`) & Server-Sent Events (`GET /api/mcp` with `Accept: text/event-stream`).
- **Authentication**: `Authorization: Bearer <API_KEY>` (token format: `st_live_...`, provisioned in `/settings/apikey`).
- **Detailed Tools, Resources & Prompts**: Refer to [Section 3.8 of `static/llms-full.txt`](../static/llms-full.txt).

### 2. Public RESTful Endpoints
- `GET /api/daily`: Grouped public task cards for the chronological feed.
- `GET /api/topics`: Trending goals, participant counts, and topic hashes.
- `GET /api/topics/:hash`: Goal companions and specific topic details.
- `GET /api/todos`: Paginated public todo feed with rich category/status filters.
- `GET /api/todos/:id`: Detail, reactions, and check-in timeline for an individual todo.
- `POST /api/todos`: Publish a new public task (supports email provisioning or Bearer token).
- `PATCH /api/todos/:id`: Transition lifecycle status or update task details.
- `DELETE /api/todos/:id`: Remove a task (author or authenticated token required).
- `POST /api/todos/:id/reactions`: React with one of the 8 canonical Unicode emojis.
- `DELETE /api/todos/:id/reactions`: Remove a placed emoji reaction.
- `GET /api/users/:id`: Public creator profile and completion stats.
- `GET /api/users/:id/heatmap`: 365-day activity density grid.
- `GET /api/stats`: Platform-wide productivity telemetry.
- **Detailed JSON Request/Response Schemas**: Refer to [Section 3 of `static/llms-full.txt`](../static/llms-full.txt).

### 3. Authentication & Security
- **Web App**: Seamless Google OAuth & email/password authentication via Better-Auth (`/api/auth/*`).
- **Browser Extension**: Official ShowTodo Quick Post companion extension via secure cookie synchronization.
- **Personal Access Tokens**: 1:N scoped API keys (`st_live_...`) managed in `/settings/apikey` for programmatic REST & MCP access.
