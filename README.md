# ShowTodo

ShowTodo is an open, public-first todo network for creators, learners, and builders to share their daily journey and build in public. It transforms isolated personal todo lists into a transparent public feed of real-time progress across the open web.

### Core Value Pillars

- **Social Accountability**: Publishing your daily todos fosters positive discipline, replacing private procrastination with visible commitment.
- **Shared Goals and Companionship**: When peers work toward identical todo goals, content-addressable topic hashing brings them together for shared pacing and quiet companionship.
- **Workflow Discovery**: Observers can witness authentic daily todo breakdowns, study practical focus habits, and emulate effective execution patterns from active peers.
- **Quiet Encouragement**: Peers can cheer progress and celebrate finished todos using distraction-free reaction signals without conversational noise.
- **Build in Public**: Public todo profiles, chronological milestone feeds, and 365-day activity heatmaps create verifiable proof of consistency.
- **AI Agent & MCP Native**: Out-of-the-box Model Context Protocol (MCP) server at `/api/mcp` allowing Claude Desktop, Cursor, and AI agents to manage tasks directly.
- **Ecosystem & Extension**: Official Chrome Extension (Quick Post) for instant text-selection capture, seamless Google OAuth sign-in, and 1:N scoped personal API tokens.

### Workspace Perspectives

- **Flexible Todo Views**: Manage your personal todo list through a chronological stream, a multi-lane kanban board, or a monthly calendar view.
- **Fluid Todo Lifecycle**: Seamlessly transition items across pending, in-progress, completed, and abandoned states as priorities evolve.

## Documentation Index

- [RESTful & MCP API Specification](docs/api.md): Endpoints, MCP JSON-RPC schemas, and pointers to the living SSOT ([`llms-full.txt`](static/llms-full.txt)).
- [Backend Architecture Guide](docs/architecture.md): Layered architecture, database schema dictionary, Better-Auth, and services.
- [Frontend Architecture Guide](docs/frontend-architecture.md): State management, Svelte 5 Runes view models, and component library.
- [Chrome Web Store Listing Guide](CHROMEWEBSTORE.md): Extension store copy, permissions justifications, and promo graphics.

## Repository Structure

```
├── docs/                               # Engineering and architecture manuals
│   ├── api.md                          # RESTful & MCP API specifications pointer
│   ├── architecture.md                 # Backend architecture and database dictionary
│   └── frontend-architecture.md        # Frontend state, views, and UI guidelines
├── extension/                          # Official ShowTodo Quick Post Chrome Extension (MV3)
│   ├── manifest.json                   # Extension manifest configuration
│   ├── popup.html / popup.js           # Lightweight popup composer UI
│   └── icons/                          # Extension toolbar assets
├── CHROMEWEBSTORE.md                   # Chrome Web Store listing and compliance guide
├── idea/                               # Product concept and RFC proposals
├── src/
│   ├── app.html                        # HTML entry template
│   ├── app.css                         # Tailwind CSS directives and design tokens
│   ├── lib/
│   │   ├── assets/                     # Static assets and icons
│   │   ├── components/                 # UI components (Layout, Todo, Topic, UI, User)
│   │   ├── constants/                  # Status definitions, categories, and SEO
│   │   ├── services/                   # HTTP client and API functions
│   │   ├── stores/                     # Svelte 5 reactive stores and registries
│   │   ├── server/                     # Domain services, MCP handlers, and DB schema
│   │   └── utils/                      # Formatting, calendar, and mutation utilities
│   └── routes/                         # Application routes, settings, and API endpoints
├── static/                             # Public static assets, crawler & LLM discoverability
│   ├── .well-known/llms.txt            # RFC-compliant LLM discoverability mirror
│   ├── favicon.svg                     # Site icon
│   ├── llms.txt                        # Standard LLM context index (llmstxt.org)
│   ├── llms-full.txt                   # Complete system specs & schemas for LLMs
│   ├── robots.txt                      # Search engine & AI crawler access rules
│   └── sitemap.xml                     # Search engine XML sitemap
├── drizzle.config.ts                   # Drizzle ORM configuration
├── playwright.config.ts                # E2E test configuration
└── vite.config.ts                      # Vite and Vitest configuration
```

## Quick Start

### 1. Clone and Install Dependencies
```bash
git clone <repo-url>
cd web-public-todo
npm install
```

### 2. Configure Environment Variables
Create or verify `.env` in the project root:
```env
# Database Connection (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require"

# Better-Auth Configuration
BETTER_AUTH_SECRET="your-secure-random-secret-here"
BETTER_AUTH_URL="http://localhost:3003"

# Google OAuth Credentials (Optional for local dev, required for Google Sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Synchronize Database Schema
```bash
# Push schema directly to database (development)
npm run db:push

# Generate and execute migrations (production)
npm run db:generate
npm run db:migrate
```

### 4. Start Local Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3003`.

## Test Commands

```bash
# Run Svelte 5 and TypeScript static type verification
npm run check

# Run Vitest unit and domain tests
npx vitest run src/lib/components/ src/lib/stores/ src/lib/utils/ src/lib/constants/

# Launch Drizzle Studio for visual database inspection
npm run db:studio

# Build production bundle
npm run build
```

## License

MIT (c) 2026 ShowTodo. Built in public with accountability.
