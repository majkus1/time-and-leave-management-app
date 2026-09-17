# Planopia

Time tracking and leave management system for teams. Built with React and Node.js.

**Live:** [planopia.pl](https://planopia.pl)

**Note:** The codebase is currently undergoing refactoring to improve architecture. Business logic is being moved from controllers to services following MVC principles, SOLID principles, and best practices. This is an ongoing process.

## What it does

Planopia helps teams manage work hours and leave requests. Employees log daily hours, request time off, and supervisors approve requests. Everything is organized by departments within teams.

## Features

- **Time tracking** - Daily hour logging with monthly calendar view and PDF export
- **Work timer** - Real-time work session tracking with break and overtime support
- **QR code registration** - QR code-based entry/exit time registration
- **Task boards** - Kanban-style task management with drag-and-drop
- **Schedules** - Team scheduling and shift planning
- **Chat** - Team communication with real-time messaging
- **Leave management** - Request system with department-based approval workflows
- **Team organization** - Multi-tenant setup where each team has isolated data and departments
- **Role-based access** - Admin, HR, Department Supervisor, and Worker roles with different permissions
- **Multi-language** - Polish and English support

## Tech stack

**Landing Page (Next.js):**
- Next.js 16 with App Router
- TypeScript
- SEO optimized with sitemap and robots.txt
- Blog system for marketing content
- Multi-language support (Polish/English)

**Business App (React):**
- React 18 with Vite
- TanStack Query for data fetching
- FullCalendar for calendar views
- Tailwind CSS
- React Router

**Backend:**
- Node.js 18+ with Express (global `fetch` for OpenAI API)
- MongoDB with Mongoose
- JWT authentication
- Email notifications with Nodemailer

## Security

The app includes several security measures:

- **JWT authentication** with http-only cookies and refresh token rotation
- **Password hashing** using bcrypt with 12 salt rounds
- **Rate limiting** on login, password reset, and team registration endpoints
- **CSRF protection** for state-changing operations
- **XSS protection** with input sanitization
- **MongoDB injection protection** via query sanitization
- **Security headers** using Helmet
- **CORS** restricted to specific origins
- **Role-based access control** enforced on both frontend and backend

## Project structure

```
├── planopia-next-landing/  # Next.js landing page (SEO, blog, marketing)
│   └── src/
│       ├── app/            # Next.js App Router
│       └── components/     # Landing page components
├── client/                 # React business app
│   └── src/
│       ├── components/     # UI components
│       ├── hooks/         # Custom React hooks
│       ├── context/       # Auth and alert context
│       └── utils/         # Helper functions
└── server/                 # Node.js backend
    ├── controllers/       # Request handlers (HTTP layer)
    ├── services/          # Business logic layer
    ├── models/           # Database schemas
    ├── routes/           # API endpoints
    └── middleware/       # Auth and validation
```

## AI Assistant (optional)

Team insights chat uses OpenAI from the server. Set in `.env`:

- `OPENAI_API_KEY` — required to enable `/api/ai-assistant/chat`
- `OPENAI_MODEL` — optional, default `gpt-4o-mini`
- `OPENAI_MODEL_DATA_CHAT`, `OPENAI_MODEL_HELP`, `OPENAI_MODEL_JSON` — optional per-path overrides (team-data chat, product help, JSON drafts/export intent)
- `OPENAI_REASONING_EFFORT_DATA_CHAT|HELP|JSON_DRAFT|SCHEDULE_DRAFT|EXPORT_INTENT` — optional, only for reasoning models (gpt-5*, o*); defaults low/minimal/minimal/medium/minimal
- Token usage and estimated cost per call are stored in `aiusagelogs` (see `server/constants/openaiPricing.js`)
- `/api/ai-help` (“How Planopia works” mode): answers from the product knowledge only, no team data, does **not** consume the AI message quota, available on the free plan and on Core without the AI module; abuse limits per user `AI_HELP_PER_MINUTE` (default 6) and `AI_HELP_PER_DAY` (default 60)

### Product knowledge (shared by the in-app assistant and the landing chat)

- Source of truth: `server/constants/productKnowledge/*.js` — one module per feature area, Polish text is canonical, prices are `{{price.*}}` placeholders rendered from `planCatalog.js` (`server/utils/productKnowledgeRender.js`).
- The landing (separate Next.js package) gets a generated copy: `npm run knowledge:build` writes `planopia-next-landing/src/data/productKnowledge.generated.ts` and `landingPlanPricing.generated.ts`; `npm run knowledge:check` (CI) fails when they are stale. **Change a feature → update its module → run the build → commit both.**
- Rules for reading team data (roles, holidays, data glossary) live in `docs/AI_DATA_CONTEXT_RULES.md`.
- Tests: `server/tests/productKnowledge.test.js` (server) and `cd planopia-next-landing && npm run test:knowledge` (selector twin, shared cases in `scripts/knowledge-select-cases.json`).
- Golden questions (manual, costs tokens): `node scripts/ai-golden-questions.mjs --target=landing` — see the script header.
- Landing env: `OPENAI_MODEL_LANDING` (falls back to `OPENAI_MODEL`, default `gpt-4o-mini`), `OPENAI_REASONING_EFFORT_LANDING` (default `low`).

## License

MIT License
