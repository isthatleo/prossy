# Prossy

**Student Project Management, Supervision & Collaboration System** — a web platform that manages the full final-year / diploma project lifecycle: topic registration, proposals, document submissions, supervision meetings, messaging, feedback, milestones and institution-wide analytics.

## Tech Stack

| Layer      | Choice                                                              |
| ---------- | ------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict) |
| Styling    | Tailwind CSS v4 (CSS-first config), shadcn/ui on Base UI            |
| Theming    | Light & dark themes via `next-themes` (dark default)                |
| Database   | Supabase Postgres, accessed with Drizzle ORM (`postgres-js` driver) |
| Auth       | Better Auth — email/password with custom `role` column              |
| Storage    | Supabase Storage (`@supabase/supabase-js`)                          |
| Validation | Zod 4 + React Hook Form                                             |
| Icons      | lucide-react                                                        |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```bash
DATABASE_URL=                  # Supabase transaction pooler URL (port 6543)
DIRECT_URL=                    # Session pooler URL (port 5433/5432) for DDL tools
BETTER_AUTH_SECRET=            # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server-only, storage admin ops
SUPABASE_STORAGE_BUCKET=project-files
```

> **Note:** the project must run through Supabase's **pooler** connection
> (`aws-*.pooler.supabase.com:6543`). The direct `db.<ref>.supabase.co`
> host is IPv6-only and unreachable from most home networks.
> `prepare: false` is already set in `db/index.ts` as required by PgBouncer.

### 3. Apply migrations & seed demo data

```bash
npm run db:migrate   # applies db/migrations/*.sql via scripts/db-migrate.cjs
npm run db:seed      # truncates and loads realistic demo data
```

> drizzle-kit's `push`/`migrate` commands hang behind PgBouncer, so migrations
> are applied by `scripts/db-migrate.cjs` (statement-splitting runner with an
> applied-migrations journal). `db:generate` still uses drizzle-kit normally.

### 4. Run

```bash
npm run dev          # http://localhost:3000
```

## Demo Accounts

All seeded accounts use password `password123`.

| Role      | Email               |
| --------- | ------------------- |
| Admin     | `admin@prossy.dev`  |
| Supervisor| `sarah@prossy.dev`  |
| Supervisor| `brian@prossy.dev`  |
| Student   | `leonard@prossy.dev`|
| Student   | `chileshe@prossy.dev`|

## Project Structure

```
app/
  (auth)/           # login, register
  (dashboard)/      # authenticated app: dashboard, projects, messages, ...
  api/auth/[...all]/# Better Auth route handler
components/
  layout/           # app shell (sidebar, topbar, mobile nav)
  shared/           # page header, empty state, stat card, module scaffold
  theme-*.tsx       # next-themes provider + toggle
  ui/               # shadcn/base-ui primitives
db/
  schema/           # drizzle tables (auth, academics, submissions, collaboration, tracking)
  migrations/       # generated SQL, applied by scripts/db-migrate.cjs
lib/
  auth/             # better-auth server/client config, requireUser/guards
  rbac.ts           # role → permission matrix
  nav-config.ts     # per-role sidebar sections
services/           # server-side data access (dashboard queries)
validations/        # zod schemas
```

## Roles & Permissions

Three roles (`student`, `supervisor`, `admin`) defined in `lib/rbac.ts` as a
permission-string matrix (e.g. `projects:create`, `reviews:submit`). Server
actions/pages enforce them via `requireUser()` / `requireRole()` /
`requirePermission()` in `lib/auth/guards.ts`; `proxy.ts` only performs a
cookie-presence redirect check.

## Useful Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run db:generate # generate migration SQL from schema changes
npm run db:migrate  # apply pending migrations
npm run db:studio   # drizzle-kit studio
npm run db:seed     # reset + seed demo data
```
