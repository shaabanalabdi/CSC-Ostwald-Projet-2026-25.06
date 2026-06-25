# CSC Ostwald — Backend API

Node.js 22 LTS + Express 5 + MySQL backend for the Centre Social et Culturel d'Ostwald site.

## Stack

- **Runtime**: Node.js >= 22 (uses native `--watch` for dev hot-reload)
- **Framework**: Express 5 (ES Modules — `type: module`)
- **Database**: MySQL 8 via `mysql2/promise` (connection pool)
- **Auth**: JWT in HTTPOnly cookie + bcrypt for password hashing
- **Uploads**: `multer` with disk storage → `/uploads/` static folder
- **Tests**: Vitest (215 passing) + supertest for HTTP integration

## Architecture

Layered, with one folder per concern. Pair `<Domain>Controller` (public read) +
`<Domain>AdminController` (full CRUD, auth-gated):

```
api/src/
├── config/        env.js (single dotenv.config) + database.js (mysql pool)
├── core/          Entity (base class) + Repository (generic CRUD)
├── entity/        Concrete entities — extends Entity
├── repository/    Singleton repositories per entity — extends Repository
├── service/       Business logic + validation (Auth, Activity, News, AdminStats, …)
├── controller/    Static methods, format response (public vs admin pairs)
├── router/routes/ Express Router per domain (public + admin-prefixed)
├── middleware/    errorHandler, isAuthenticated, csrfProtection, requireRole, rate-limits, uploadImage
├── error/         HttpException hierarchy (BadRequest, NotFound, …)
├── utils/         Validator + shared helpers
└── server.js      Boot entry
```

## Conventions & contracts

These rules are followed everywhere in the codebase. They are written down
here so they are explicit rather than implied.

### Layer responsibilities

- **Controller** — thin HTTP layer. Static methods written as arrow-function
  class properties. Reads `req`, calls a Service, returns the response.
  **No business logic, no `try/catch`** — Express 5 forwards a rejected
  promise straight to `errorHandler`.
- **Service** — all business logic + validation. Singleton export. Throws
  `HttpException` subclasses on failure; **never touches `res`**.
- **Repository** — generic CRUD over the MySQL pool (`core/Repository.js`).
  Singleton export. Parameterised SQL (`?` placeholders) only.
- **Entity** — plain data holder hydrated via `Object.assign` (`core/Entity.js`).

### Controller pairing

Each domain has up to two controllers, mirrored by its route files:

| Controller                            | Routes file              | Auth                            |
| -------------------------------------- | ------------------------ | ------------------------------- |
| `<Domain>Controller` (public read)     | `routes/<domain>.js`     | none                            |
| `<Domain>AdminController` (full CRUD)  | `routes/admin-<domain>.js` | `isAuthenticated` + `csrfProtection` |

### Response contract

Success responses return **raw data — no `{ message, resource }` envelope**
(a deliberate divergence from the Pokédex reference pattern).

| Case                                  | Status        | Body                                            |
| -------------------------------------- | ------------- | ----------------------------------------------- |
| GET list (public)                      | `200`         | raw array                                       |
| GET list (admin, paginated)            | `200`         | `{ items, total, page, perPage, totalPages }`   |
| GET one / POST create / PATCH update   | `200` / `201` | the raw entity object                           |
| DELETE                                 | `204`         | empty                                           |
| Error                                  | `4xx` / `5xx` | `{ message }` or `{ message, details }`         |

Every controller method ends with `return res…` so execution never falls
through to another handler.

### Error handling

- Services throw from `error/HttpException.js`: `BadRequestException` (400),
  `UnauthorizedException` (401), `ForbiddenException` (403),
  `NotFoundException` (404), `ConflictException` (409),
  `UnprocessableEntityException` (422).
- The central `errorHandler` (last middleware) formats them. `details` carries
  structured info — e.g. per-field validation errors as `{ fields: { … } }`.
- Unknown errors → `500 { message: "Internal Server Error" }`; the stack is
  logged server-side only, never sent in the response.

### Validation

- Validation lives in the Service (inline, per method), using
  `utils/Validator.js` for cross-cutting formats (email, FR phone, contact
  subjects).
- The frontend Zod schemas duplicate these rules and **must stay in sync**.
  `CONTACT_SUBJECTS` has an automated drift test
  (`utils/__tests__/Validator.test.js`); field length limits are
  cross-referenced in comments on both sides.

### Testing

Automated **Vitest** suites under `**/__tests__/` (`npm test`) are the testing
standard — there is no manual-test checklist.

## Setup

1. **Copy env template**
   ```sh
   cp .env.example .env
   # Edit .env: DB credentials + JWT_SECRET (use `openssl rand -base64 64`)
   ```

2. **Create the database**
   ```sh
   mysql -u root -p < database.sql
   ```
   The schema lives in [`database.sql`](./database.sql) — **12 tables**.

3. **Install dependencies**
   ```sh
   npm install
   ```

4. **Run dev server** (auto-reloads on file change)
   ```sh
   npm run dev
   ```

5. **Seed initial content** (idempotent — re-running skips existing rows)
   ```sh
   npm run create-admin admin@csc-ostwald.fr 'YourS3cureP@ss!'
   npm run seed:team
   npm run seed:partners
   npm run seed:events
   npm run seed:activities
   npm run seed:projet-social
   npm run seed:news
   ```

6. **Verify health check**
   ```sh
   curl http://localhost:3001/api/health
   # → { "status": "ok", "database": "reachable", ... }
   ```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Production server (no watch) |
| `npm run dev` | Dev server with file watching |
| `npm run migrate` | Apply `database.sql` against the configured DB |
| `npm run create-admin <email> <password>` | Seed the first admin user |
| `npm run seed:team` | Seed the 5 real CSC staff members |
| `npm run seed:partners` | Seed institutional + associatifs partners |
| `npm run seed:events` | Seed sample agenda events |
| `npm run seed:activities` | Seed Famille + Jeunesse activities |
| `npm run seed:projet-social` | Seed Projet Social PDFs |
| `npm run seed:news` | Seed the 2 initial "Nos actualités" cards |
| `npm run lint` | ESLint check |
| `npm test` | Vitest run (215 tests) |
| `npm run verify` | lint + format:check + tests |

## Database — 12 tables

`user`, `category`, `activity`, `event`, `team_member`, `partner`,
`message`, `registration`, `newsletter_subscriber`, `benevole_application`,
`projet_social_document`, `news`.

See [`database.sql`](./database.sql) for the full schema and
[`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for the chronological
`ALTER TABLE` migrations (phases 17 → 20).

## Endpoints

### Public (no auth)

| Method | Path | Used by |
|--------|------|---------|
| `GET`  | `/api/health` | monitoring |
| `POST` | `/api/auth/login`, `/api/auth/logout` | `features/auth` |
| `GET`  | `/api/auth/me` | `features/auth/useMe` |
| `POST` | `/api/newsletter` | `features/newsletter` (double opt-in) |
| `GET`  | `/api/newsletter/confirm?token=…` | confirmation link |
| `POST` | `/api/contact` | `features/contact` |
| `POST` | `/api/benevole` | `features/benevole` |
| `GET`  | `/api/activities?type=famille\|jeunesse\|reguliere` | `/famille`, `/jeunesse` pages |
| `GET`  | `/api/events/upcoming` | home `AgendaEvenements` |
| `GET`  | `/api/team` | `/a-propos/qui-sommes-nous` |
| `GET`  | `/api/partners` | `/a-propos/nos-partenaires` |
| `GET`  | `/api/projet-social/documents` | `/a-propos/projet-social` |
| `GET`  | `/api/news?limit=4` | home `Actualites` section |
| `POST` | `/api/payment/checkout`, `/api/payment/webhook` | HelloAsso flow |

### Admin (auth-gated, `isAuthenticated` middleware)

| Method | Path |
|--------|------|
| `GET`  | `/api/admin/stats` — KPI snapshot for the dashboard |
| `GET POST PATCH DELETE` | `/api/admin/activities` |
| `GET POST PATCH DELETE` | `/api/admin/events` |
| `GET POST PATCH DELETE` | `/api/admin/team` |
| `GET POST PATCH DELETE` | `/api/admin/partners` |
| `GET POST PATCH DELETE` | `/api/admin/projet-social` |
| `GET POST PATCH DELETE` | `/api/admin/news` |
| `GET PATCH DELETE` | `/api/admin/messages` (no create — comes from public form) |
| `GET PATCH DELETE` | `/api/admin/benevole` |
| `GET PATCH DELETE` | `/api/admin/newsletter` |
| `GET DELETE` | `/api/admin/registrations` |
| `POST` | `/api/admin/upload` — multer image upload, returns `{ url: "/uploads/<hash>.webp" }` |
| `GET`  | `/api/admin/*/export.csv` — CSV download per domain |
| `PATCH`| `/api/admin/activities/reorder` (and `partners/`, `team/`) — drag-and-drop persistence |

## Frontend integration

The frontend (`client/`) talks to the API via the wrapper at
[`client/src/api/client.js`](../client/src/api/client.js) (`apiGet`,
`apiPost`, `apiPatch`, `apiDelete`, `downloadCsv`, plus `resolveStaticUrl`
for `/uploads/...` paths).

In dev, requests hit `/api/*` and `/uploads/*` which the Vite dev server
proxies to `http://localhost:3001` (see `client/vite.config.js`).
In production, both routes are served by nginx as a same-origin reverse
proxy (Vercel rewrites for the Vercel+Render+Aiven path, or the
single-VPS nginx for the OVH path).

## Deployment

Two paths documented at the repo root:

- **[DEPLOYMENT.md](../DEPLOYMENT.md)** — Vercel (frontend) + Render
  (backend) + Aiven (MySQL). Free tier, ~25 €/month once trial ends.
- **[DEPLOYMENT-OVH.md](../DEPLOYMENT-OVH.md)** — Single VPS at OVH
  (Docker Compose + nginx + Let's Encrypt). ~55 €/year total.
