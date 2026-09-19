# ShowTodo — Public Todo & Walk-Together Platform

> **Build in Public · Walk Together · Companionship · Mutual Accountability · Learning & Emulation · Social Witnessing**

`ShowTodo` is **not** a traditional corporate collaboration tool, task delegation system, or project management suite. 

It is a **public-first, companion-driven action platform** built on the ethos of **Building in Public**. Anyone can publish their commitments, anyone can witness the journey, and independent creators pursuing the same ambition can naturally walk alongside each other without bureaucracy or hierarchical boundaries.

---

## 🌟 Product Philosophy: Why We Exist

1. **Walking Together, Not Managing (同行，而非协同)**  
   No managers, no assignees, no top-down mandates. Through content-addressable topic hashing (`topic_hash`), people who commit to identical goals (e.g., *"Read for 30 minutes daily"* or *"Ship a side project"*) automatically find each other and share the path as equals.

2. **Radical Transparency & Building in Public (全网公开 · 围观见证)**  
   Every todo is public by default. Public commitment transforms internal anxiety into visible resolve, turning passive observers into authentic witnesses.

3. **Companionship & Mutual Accountability (陪伴与监督)**  
   Solitary journeys often succumb to procrastination. By seeing peers actively checking in, making progress, and persevering through setbacks, creators draw collective strength and gentle peer accountability.

4. **Learning & Emulation (学习与模仿)**  
   Discover what passionate developers, learners, and creators are committing to today. Observe how others break down ambitions, study their rhythms, and adopt proven habits.

5. **Delightful Witnessing & Reactions (温情围观 · 灵动微交互)**  
   Lightweight emotional reactions (`❤️`, `👍`, `🔥`, `💪`, `👏`, `🚀`, `🎉`, `👀`) offer zero-friction cheerleading without the weight of formal commenting threads.

6. **Passwordless Frictionless Entry (极简免密 · 纯粹行动)**  
   No tedious onboarding or password setups. Simply provide an email when creating or reacting; identity and persistent credentials are seamlessly created on the fly.

---

## 📖 Core Documentation Index

- 🔌 **RESTful API Specification**: [`docs/api.md`](./docs/api.md) — Comprehensive API endpoints, DTO models, query filters, error schemas, and QA matrix.
- 🏗️ **Backend Architecture Guide**: [`docs/architecture.md`](./docs/architecture.md) — Controller-Service-Repository layers, physical schemas, topic hashing, timezone handling, and test matrices.
- 🎨 **Frontend Architecture & Design System**: [`docs/frontend-architecture.md`](./docs/frontend-architecture.md) — Svelte 5 Runes state architecture, multi-view engines, local-first reactive mutations, and design tokens.
- 💡 **Topic Hash & Multiplayer Design**: [`idea/multiplayer-todo-design.md`](./idea/multiplayer-todo-design.md) — Content-addressable decentralization model and CoW rationale.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Fullstack Framework** | [SvelteKit](https://kit.svelte.dev/) | `^2.63.0` | High-performance SSR/CSR, file-system API routing (`+server.ts`) |
| **Reactivity Engine** | [Svelte 5 Runes](https://svelte.dev/) | `^5.56.1` | Fine-grained reactivity via `$state`, `$derived`, `$props`, `$effect` |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^6.0.3` | End-to-end type safety, shared domain contracts |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) | `^4.3.0` | Modern CSS-first design system with `@tailwindcss/forms` |
| **Iconography** | `@iconify/svelte` (Lucide) | `^5.2.2` | Clean, customizable SVG icons |
| **Database & ORM** | [Neon](https://neon.tech/) + [Drizzle ORM](https://orm.drizzle.team/) | `^0.45.2` | Serverless PostgreSQL with zero-cold-start HTTP query pipelines |
| **Testing Suite** | [Vitest](https://vitest.dev/) | `^4.1.8` | Unit, service, projection, and component regression suites |

---

## ✨ Key Capabilities

- **Topic-Hash Content Addressability**: Automatically groups identical objectives into a unified "Walk-Together" card using normalized SHA-256 slicing, preserving complete user sovereignty without relational lock-in.
- **Triple-View Action Engine**: Seamlessly toggle between:
  - **Stream View** (`TodoStreamView`): Focused, single-column chronological feed with inline action items and quick filters.
  - **Kanban View** (`TodoKanbanView`): Categorized swimlanes across `pending`, `in_progress`, and `done`.
  - **Weekly Calendar View** (`TodoCalendarView`): Multi-user active creator matrix mapping goals onto a weekly timeline.
- **Four-State Fluid Transition Model**: Bidirectional flow between `pending` (待办), `in_progress` (推进中), `done` (达成), and `abandoned` (放弃) with instant one-click reopening and retro note updates.
- **Deep Public Observability**:
  - **Public User Profiles** (`/@handle` and `/@handle/todolist`): User contribution streaks, total completions, and dedicated personal todo lists.
  - **Yearly Activity Heatmap**: 365-day contribution heatmaps reflecting completions, creation, and check-in logs.
  - **Platform Statistics Dashboard** (`/stats`): Real-time site-wide totals, completion rate analytics, category distribution donut charts, and top trending goals.
- **Zero-Jitter Local-First Reactivity**: Actions (creation, check-offs, reactions, status hops) mutate local reactive state with snapshot rollback on network failure, ensuring zero full-page refetches and instant 0ms user feedback.
- **Delightful Micro-interactions**: Jelly-bounce checkboxes, smooth popovers, fan-out avatar clusters, and high-velocity 3D confetti celebrations when finishing daily goals.

---

## 📁 Repository Structure

```
├── docs/                               # Engineering & architecture manuals
│   ├── api.md                          # Production RESTful API specifications
│   ├── architecture.md                 # Backend architecture, services & database dictionary
│   └── frontend-architecture.md        # Svelte 5 Runes state, views & UI component guidelines
├── idea/                               # Product concept & RFC proposals
├── src/
│   ├── app.html                        # HTML entry template
│   ├── app.css                         # Tailwind CSS v4 directives and design tokens
│   ├── lib/
│   │   ├── assets/                     # Static media and favicons
│   │   ├── components/                 # Domain and atomic UI components
│   │   │   ├── layout/                 # Header, Footer, UserPopover
│   │   │   ├── seo/                    # SeoHead open-graph metadata
│   │   │   ├── skeleton/               # Graceful placeholder skeletons
│   │   │   ├── stats/                  # ActivityHeatmap, CategoryDonutChart
│   │   │   ├── todo/                   # TodoItem, TodoStreamView, TodoKanbanView, TodoCalendarView, etc.
│   │   │   ├── topic/                  # TopicCard, TopicHeaderCard, TopicParticipantList
│   │   │   ├── ui/                     # Avatar, Button, Card, Modal, Tabs, FilterChip, Toast, etc.
│   │   │   ├── user/                   # UserProfileCard, UserStatsGrid, UserAvatarTooltip
│   │   │   └── widgets/                # MyTodayWidget, TrendingTopicsWidget, SiteStatsWidget
│   │   ├── constants/                  # Status machines, categories, reactions, tabs, SEO configs
│   │   ├── services/                   # HTTP client and frontend API SDK
│   │   ├── stores/                     # Svelte 5 Runes reactive state
│   │   │   ├── entities/               # todo-registry, user-registry (single source of truth)
│   │   │   ├── resources/              # use-my-todos, use-todo-detail, use-topics, use-user-profile
│   │   │   └── *.svelte.ts             # user, theme, toast, feed, today, stats, trending stores
│   │   ├── server/                     # Backend domain & storage core
│   │   │   ├── db/                     # Drizzle PostgreSQL schema and client
│   │   │   ├── services/               # todo, user, activity, reaction, stats services
│   │   │   ├── utils/                  # timezone.ts (IANA validation, daily windows)
│   │   │   ├── errors.ts               # AppError standard exception handling
│   │   │   ├── topic-hash.ts           # SHA-256 topic content normalization & hashing
│   │   │   └── validation.ts           # Pure functional input assertions
│   │   └── utils/                      # cn, calendar, format, chart, confetti, mutation helpers
│   └── routes/                         # SvelteKit page and API endpoints
│       ├── +layout.svelte              # Global root shell (Header, Toaster, Footer)
│       ├── +page.svelte                # Public action square (Stream, Kanban, Calendar)
│       ├── +error.svelte               # Custom error boundary
│       ├── @[handle]/                  # Public creator profile & todo list
│       ├── goals/                      # Walk-Together topics discovery and details
│       ├── trending/                   # Trending goals leaderboard
│       ├── stats/                      # Site-wide analytics and activity heatmap
│       ├── t/[id]/                     # Todo detail & companion timeline view
│       ├── about/                      # About the product and philosophy
│       ├── privacy/                    # Privacy policy & data transparency
│       ├── (dev)/demo/                 # UI component demo showcase
│       └── api/                        # RESTful endpoints (todos, topics, users, stats, calendar)
├── drizzle.config.ts                   # Drizzle ORM configuration
├── playwright.config.ts                # E2E test configuration
└── vite.config.ts                      # Vite & Vitest configuration
```

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
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

---

## 🧪 Quality Assurance & Test Commands

```bash
# Run Svelte 5 and TypeScript static type verification
npm run check

# Run Vitest unit & domain tests (excluding isolated DB network runs)
npx vitest run src/lib/components/ src/lib/stores/ src/lib/utils/

# Launch Drizzle Studio for visual database inspection
npm run db:studio

# Build production bundle
npm run build
```

---

## 📄 License

MIT © 2026 ShowTodo. Built in Public with passion and accountability.

