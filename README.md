# ShowTodo

ShowTodo is an open, public-first todo network for creators, learners, and builders to share their daily journey and build in public. It transforms isolated personal todo lists into a transparent public feed of real-time progress across the open web.

### Core Value Pillars

- **Social Accountability**: Publishing your daily todos fosters positive discipline, replacing private procrastination with visible commitment.
- **Shared Goals and Companionship**: When peers work toward identical todo goals, content-addressable topic hashing brings them together for shared pacing and quiet companionship.
- **Workflow Discovery**: Observers can witness authentic daily todo breakdowns, study practical focus habits, and emulate effective execution patterns from active peers.
- **Quiet Encouragement**: Peers can cheer progress and celebrate finished todos using distraction-free reaction signals without conversational noise.
- **Build in Public**: Public todo profiles, chronological milestone feeds, and 365-day activity heatmaps create verifiable proof of consistency.

### Workspace Perspectives

- **Flexible Todo Views**: Manage your personal todo list through a chronological stream, a multi-lane kanban board, or a monthly calendar view.
- **Fluid Todo Lifecycle**: Seamlessly transition items across pending, in-progress, completed, and abandoned states as priorities evolve.


## Documentation Index

- [RESTful API Specification](docs/api.md): Endpoints, parameters, schemas, and test checklist.
- [Backend Architecture Guide](docs/architecture.md): Layered architecture, database schema, services, and tests.
- [Frontend Architecture Guide](docs/frontend-architecture.md): State management, view models, and component library.

## Repository Structure

```
├── docs/                               # Engineering and architecture manuals
│   ├── api.md                          # RESTful API specifications
│   ├── architecture.md                 # Backend architecture and database dictionary
│   └── frontend-architecture.md        # Frontend state, views, and UI guidelines
├── idea/                               # Product concept and RFC proposals
├── src/
│   ├── app.html                        # HTML entry template
│   ├── app.css                         # Tailwind CSS directives and design tokens
│   ├── lib/
│   │   ├── assets/                     # Static assets and icons
│   │   ├── components/                 # UI components
│   │   │   ├── layout/                 # Header, Footer, UserPopover
│   │   │   ├── seo/                    # Open-graph metadata
│   │   │   ├── skeleton/               # Loading skeleton placeholders
│   │   │   ├── stats/                  # Heatmaps and charts
│   │   │   ├── todo/                   # Task list items, views, and modals
│   │   │   ├── topic/                  # Topic cards and participant lists
│   │   │   ├── ui/                     # Primitives: buttons, inputs, modals, tabs
│   │   │   ├── user/                   # Profile cards and stats grids
│   │   │   └── widgets/                # Dashboard and sidebar widgets
│   │   ├── constants/                  # Status definitions, categories, and tabs
│   │   ├── services/                   # HTTP client and API functions
│   │   ├── stores/                     # Svelte 5 reactive stores and registries
│   │   ├── server/                     # Backend domain services and database schema
│   │   └── utils/                      # Formatting, calendar, and mutation utilities
│   └── routes/                         # Application routes and API endpoints
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
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require"
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
npx vitest run src/lib/components/ src/lib/stores/ src/lib/utils/

# Launch Drizzle Studio for visual database inspection
npm run db:studio

# Build production bundle
npm run build
```

## License

MIT (c) 2026 ShowTodo. Built in public with accountability.


