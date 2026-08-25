# TECUMP — TUMCU Enterprise Christian Union Management Platform

A monorepo scaffold implementing the architecture described in the TECUMP
Software Requirements Specification (Parts I–VII). This is a **working
foundation**, not a finished production system — see "Status" below for
exactly what's implemented vs. scaffolded.


## Deployment-ready improvements in this package

This version includes a production-focused frontend pass: a real data-driven member dashboard, live membership application queue with automatic refresh and search, improved mobile/desktop dashboard navigation, server-backed logout, resilient JWT refresh handling for concurrent expired sessions, client-side registration validation, a branded 404 page, SPA deep-link support for Nginx/Netlify, environment-driven Docker secrets/CORS, Redis persistence/health checks, API health checks, and a deployment runbook in `DEPLOYMENT.md`.

The backend's constitutional workflows and generated API modules remain available. The frontend exposes the member-facing workflows and the administrator membership/RBAC workflows; the remaining generated backend modules are API-ready but do not all have dedicated frontend screens yet.

## Structure

```
tumcu-platform/
  backend/     Express + TypeScript API (clean architecture, feature modules)
  frontend/    React + Vite + TypeScript + Tailwind SPA
  docker-compose.yml
```

## Quick start (local development)

### 1. Database

```bash
docker compose up -d mysql redis
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # edit DB_PASSWORD, JWT secrets, etc.
npm install
npm run migrate           # applies src/database/migrations/*.sql in order
npm run seed               # seeds roles, permissions, ministries, committees, etc.
npm run create:admin -- --email you@example.com --name "Your Name"
                            # bootstraps a Super Administrator account — see
                            # "Creating a Super Admin" below for details
npm run dev                 # http://localhost:4000
```

Health check: `GET http://localhost:4000/health`

### 3. Frontend

```bash
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:4000/api/v1
npm install
npm run dev                 # http://localhost:5173
```

### 4. Full stack via Docker

```bash
docker compose up --build
```

## What's implemented vs. scaffolded

**Fully implemented (real business logic, not just CRUD):**
- Authentication: register (opens a membership application), login, JWT
  access + refresh token rotation, logout, logout-everywhere
- Database-driven RBAC/PBAC: permissions are loaded per-request from
  `role_permissions`, never hardcoded
- Membership: application review, approval workflow (transactional —
  generates membership number, activates the user, queues a welcome
  notification), rejection, annual renewal
- Meetings (Chapter 10): agenda management, minutes recording + approval,
  resolutions with mover/seconder/vote tallies, attendance confirmation,
  and an archive step that enforces minutes be approved first
- Expenses (Chapter 17): the full constitutional approval chain —
  Request → Treasurer Review → Secretary Verification → Chairperson
  Approval → Payment → Receipt → Audit — each transition validated against
  the correct preceding state, with a rejection path from any open state
- Events (Chapter 13): Create → Budget → Approval → Registration → QR
  Ticket → Attendance → Archive, including capacity-aware waitlisting and
  QR check-in that rejects already-used or cancelled tickets
- Standardized API response envelope, centralized error handling, Zod
  request validation, structured logging, rate limiting, security headers
- Database schema covering Chapters 1–23 (61 tables) as versioned,
  reproducible SQL migrations, plus a seed script for reference data
  (membership types, executive positions, constitutional ministries,
  committees, permissions, default roles, current spiritual year)
- Frontend: public site shell, multi-step registration wizard matching the
  constitutional declaration step, login, protected dashboard shell with
  desktop sidebar + mobile bottom nav, design tokens matching Chapter 41
  (Royal Blue / Gold / Inter)

**Scaffolded, ready to build out (compiles and runs, CRUD only):**
- 17 backend modules generated on a shared `BaseRepository`/`BaseService`/
  `BaseController` pattern: Leadership, Committees, Committee Members,
  Ministries, Ministry Members, Attendance, Prayer, Bible Study Groups,
  Mentorship Groups, Evangelism Teams, Income, Welfare Cases, Assets,
  Library Resources, Broadcast Messages, Reports, Audit Logs. Each has its
  own `interfaces/`, `repositories/`, `services/`, `controllers/`, `routes/`
  folder — extend the generated service class to add real workflow logic
  (approval chains, notifications, cross-table writes) module by module,
  the same way Meetings/Expenses/Events were built out.
- Frontend dashboard sub-pages (Membership, Meetings, Attendance, Prayer,
  Finance) are placeholders wired into routing — build out one at a time
  against the already-working API modules.

**Not yet built:**
- Redis caching layer, background job queue (BullMQ), file upload service,
  full-text/global search, notification delivery (email/SMS providers),
  AI module integrations, automated test suite, CI/CD pipeline

## Email notifications

Notifications (welcome emails, approval notices, etc.) are queued into the
`notifications` table by the code that triggers them (e.g. membership
approval), then a background dispatcher — started automatically with the
server, running every 30 seconds by default — sends each unsent one and
marks it `sent_at`.

**Without any SMTP configuration**, notifications are logged to the console
instead of actually sent — safe default for local development, and nothing
piles up unsent waiting for credentials. To send real email, set in `.env`:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM="TUMCU Christian Union <no-reply@tumcu.ac.ke>"
```

A failure sending one notification (bad address, SMTP down) is logged and
skipped — it stays unsent and is retried on the next cycle — rather than
blocking every other queued notification.

## Testing

```bash
cd backend
npm run test              # 19 unit tests — pure logic, no database needed
npm run test:integration  # 6 integration tests — needs a real MySQL database
npm run test:all          # both
```

Unit tests cover the password policy and the expense approval state machine
(every valid transition, every skip-a-step and go-backward rejection).
Integration tests hit a live database and automate the exact manual proofs
used to validate this system during development: account lockout (fires
precisely on the 5th failed attempt, not the 4th — a real off-by-one bug
this pinned as a regression test) and ministry-scope enforcement (a Ministry
Leader can manage their own ministry, is blocked from a different one, and
the Secretary's cross-ministry bypass works correctly).

This is a start, not full coverage — the modules scaffolded on generic CRUD
(see above) have no tests yet, and there's no frontend or E2E test suite.

## Adding a new CRUD module

```bash
cd backend
# 1. Edit scripts/generate-module.js — add { name, table, permissionPrefix } to MODULES
# 2. Regenerate:
npm run generate:module
# 3. Wire the new routes into src/app.ts and src/modules/_generated/index.ts (auto-updated)
```

## Role-Based Access Control (18 constitutional roles)

`npm run seed` creates the full constitutional role hierarchy, not just a
handful of examples:

- **Technical**: Super Admin, System Admin, IT Admin (unrestricted — Super
  Admin holds every permission in the system, regenerated automatically
  each time you re-run the seed)
- **Executive Committee**: Chairperson, 1st Vice Chairperson, 2nd Vice
  Chairperson, Secretary, Vice Secretary, Treasurer
- **Committee Chairpersons**: Prayer, Worship, Missions, Discipleship,
  Assets, Publicity, Non-Residents — one role per constitutional committee
- **Ministry roles**: Ministry Leader, Ministry Secretary, Ministry
  Treasurer — generic, **scoped** roles (see below)
- **Member**: the baseline role every approved member holds

### Scoped roles — a ministry leader only manages their own ministry

Ministry/committee roles are assigned via `user_roles.scope_type` +
`scope_id` (e.g. "Ministry Leader, scoped to Media Ministry"). Holding
`ministries.manage_members` does **not** by itself mean "every ministry" —
`enforceScope()` in `auth.middleware.ts` checks the request's target
ministry/committee against the caller's actual scoped assignment(s), and
rejects it if they don't match. Roles senior enough to act across every
ministry (Secretary, Chairperson, Super Admin) instead hold
`ministries.manage_all_members`, which bypasses the scope check entirely.

This is enforced in the `ministry-members` module as the reference
implementation — apply the same `enforceScope()` pattern to
`committee-members` and any other scoped resource as those get built out.

### Permissions without a module yet

A few permission codes exist for dashboards described in the RBAC spec that
don't have dedicated backend modules/tables yet — venue booking, transport
management, the Associates/Finalists database, Worship Committee song
library, and Publicity's website/social/livestream management. They're
seeded now (see the "Reserved" comment block in `seed.ts`) so roles can be
granted them today without a second RBAC migration once each module is
actually built.

## Creating a Super Admin

There is **no default admin account** — none is seeded automatically, on
purpose. Baking a default admin (even with a random-looking password) into
seed data is how "admin/admin"-style breaches happen: anyone with the repo
knows an account exists and can go looking for it.

Instead, run this once after `npm run migrate && npm run seed`:

```bash
npm run create:admin -- --email you@example.com --name "Your Name"
```

- If you omit `--password`, a strong random password is generated and
  printed **once** to the terminal — copy it immediately, it is not stored
  anywhere in recoverable form (only its bcrypt hash is saved).
- To set a specific password instead: add `--password "YourStrongPassword1!"`
  (must meet the same policy as normal registration: 10+ characters,
  upper/lower/number/symbol).
- Safe to re-run: if the email already exists, the script promotes that
  account to Super Admin and resets its lockout state, without touching its
  password unless you explicitly pass `--password`.
- The `super_admin` role is granted every permission in the system
  (re-running `npm run seed` keeps this current as new permissions are
  added) — grant it sparingly, to real people, not shared logins.

## Migration order

Migrations are numbered and applied in order by `npm run migrate`
(tracked in a `schema_migrations` table, safe to re-run):

1. `001_core_schema.sql` — Users, Auth, RBAC, Membership, Executive
   Committee, Advisory Board, Committees, Ministries, Discipleship
2. `002_operational_modules.sql` — Meetings, Weekly Programme, Attendance,
   Events, Prayer, Evangelism, Finance, Welfare, Assets, Library,
   Communication, Reports, Audit (extends tables from migration 001)
3. `003_security_hardening.sql` — account lockout columns on `users`, and a
   `security_events` table for login/lockout/token-reuse monitoring

## Notes on scale claims in the SRS

The SRS targets 100,000+ registered users and 5,000+ concurrent users.
This scaffold is architected to *not preclude* that (connection pooling,
indexed foreign keys, pagination everywhere, stateless JWT auth for
horizontal scaling) but has not been load-tested. Treat those numbers as
a design constraint to validate before launch, not a guarantee of this
scaffold as-is.


## RBAC and administration

See [`RBAC.md`](./RBAC.md) for the complete role hierarchy, scopes and administration UI.


## Cloud synchronization

Production data is server-authoritative. Active pages automatically revalidate server data every 15 seconds and when the browser regains focus/reconnects. Therefore changes made from an admin device propagate to other open devices without requiring a manual refresh.
