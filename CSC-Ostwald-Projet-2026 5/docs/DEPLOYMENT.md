# Deployment guide — CSC Ostwald

End-to-end production setup. The stack splits into three pieces, each
hosted independently:

| Piece    | Host          | Cost                     | Why this one              |
| -------- | ------------- | ------------------------ | ------------------------- |
| Frontend | Vercel        | Free (hobby tier)        | Native Vite support, edge CDN, instant deploys |
| Backend  | Render        | Free (sleeps after 15min)| Simple Node deploy, Frankfurt region (low latency for Alsace) |
| Database | Aiven         | Free (1 mo trial, then $20/mo) — see alternatives below | Managed MySQL, EU regions |

Alternative database hosts (free or cheap, in priority order):

1. **Aiven MySQL free trial** — 1 month, then $20/mo. Cleanest UX, EU-hosted.
2. **Railway MySQL** — $5/mo minimum, no free tier as of 2025-2026.
3. **DigitalOcean Managed Database** — $15/mo, EU regions.
4. **PlanetScale** — free Hobby tier was deprecated. Now paid only.
5. **Self-host MySQL on a $5 VPS** (Hetzner CX11, Frankfurt) if budget is tight.

The configs in `api/render.yaml` and `client/vercel.json` are written
for the Vercel + Render + Aiven path. To use a different DB host, the
only change is the four `DB_*` env vars on Render — no code changes.

---

## Prerequisites

- A GitHub (or GitLab) account with the project pushed to a repository.
- A working `api/.env` locally so you can run `mysql -u root -p <
  database.sql` against the production database before first deploy.
- An admin email + password you'll seed via `npm run create-admin`.

---

## Local development with Docker (optional but recommended)

If you don't want to install MySQL natively, the project ships a
`docker-compose.yml` at the repo root that spins up MySQL 8 +
phpMyAdmin and auto-initializes the schema from `api/database.sql`:

```sh
# From the project root (where docker-compose.yml lives)
docker compose up -d              # start MySQL + phpMyAdmin
# After ~10 s the DB is ready (healthcheck) — schema already loaded.

# api/.env (copy from .env.example) needs:
#   DB_HOST=localhost
#   DB_USER=root
#   DB_PASSWORD=dev
#   DB_NAME=csc_ostwald

cd api
npm install
npm run create-admin admin@csc-ostwald.fr 'dev'
npm run seed:team
npm run seed:partners
npm run seed:events
npm run seed:activities
npm start                          # http://localhost:3001

# In another shell:
cd ../client
npm install
npm run dev                        # http://localhost:5173
```

Tear-down:

```sh
docker compose down                # stop containers, KEEP data
docker compose down -v             # stop AND wipe the volume (fresh start)
```

phpMyAdmin is at <http://localhost:8080> (`root` / `dev`). The Docker
stack is for local dev ONLY — the production database is hosted on
Aiven (see Step 2 below) and never exposed publicly.

---

## Step 1 — Push to GitHub

```sh
# From the project root
gh auth login                                  # one-time, opens browser
gh repo create csc-ostwald --public --source=. --remote=origin --push
# OR manually:
#   1. Create a new repo on github.com
#   2. git remote add origin https://github.com/YOU/csc-ostwald.git
#   3. git push -u origin main
```

Verify:

```sh
git remote -v          # origin should point at github.com/.../csc-ostwald
gh repo view --web     # opens the repo in your browser
```

---

## Step 2 — Provision the database (Aiven)

1. Sign up at <https://aiven.io>.
2. Create a new **MySQL** service:
   - Cloud provider: any (Google Cloud / AWS / Azure)
   - Region: **europe-west1 (Belgium)** or **eu-west-1 (Ireland)** — closest to Alsace.
   - Plan: **Free** (1 month trial).
3. Wait ~2 minutes for the service to become `RUNNING`.
4. Open the service → **Overview** tab. Copy:
   - `Host` → will be `DB_HOST`
   - `Port` → `DB_PORT`
   - `User` → `DB_USER`
   - `Password` → `DB_PASSWORD`
   - `Database name` → `DB_NAME` (Aiven calls it `defaultdb` by default).

Load the schema from your local machine:

```sh
# From the project root
mysql \
  -h <DB_HOST> \
  -P <DB_PORT> \
  -u <DB_USER> \
  -p<DB_PASSWORD> \
  <DB_NAME> < api/database.sql
```

(Note: no space between `-p` and the password.)

Verify the 12 tables exist:

```sh
mysql -h ... -P ... -u ... -p... <DB_NAME> -e "SHOW TABLES;"
# user, category, activity, event, team_member, partner, message,
# registration, newsletter_subscriber, benevole_application,
# projet_social_document, news
```

### Migrations (only if you ran `database.sql` BEFORE Phase 17)

`database.sql` is the source of truth. Re-running it on an existing
database is a no-op (`CREATE TABLE IF NOT EXISTS`), so columns added
after the initial run need a one-time `ALTER TABLE`. Apply these in
order on production databases that pre-date the change:

```sql
-- Phase 17 (2026-05-19): public team page now shows phone numbers.
-- The seed-team.js script also writes to this column.
ALTER TABLE team_member ADD COLUMN phone VARCHAR(20) NULL AFTER email;

-- Phase 18 (2026-05-19): home-page agenda is now DB-driven. The
-- AgendaEvenements card shows cost, capacity, and a category badge
-- coloured per event — all four columns are added at once.
ALTER TABLE event
  ADD COLUMN cout VARCHAR(50) NULL AFTER lieu,
  ADD COLUMN capacite INT UNSIGNED NULL AFTER cout,
  ADD COLUMN category_label VARCHAR(80) NULL AFTER category_id,
  ADD COLUMN category_color VARCHAR(7) NULL AFTER category_label;

-- Phase 19 (2026-05-19): /famille and /jeunesse public pages now
-- consume /api/activities. The card UI needs three extra columns
-- that didn't exist in the original schema.
ALTER TABLE activity
  ADD COLUMN categorie_label VARCHAR(80) NULL AFTER category_id,
  ADD COLUMN frequence ENUM('HEBDO', 'MENSUEL') NULL AFTER horaire,
  ADD COLUMN tag VARCHAR(30) NULL AFTER capacite;

-- Phase 23 (2026-05-19): admin CRUD for "Nos actualités" cards on the
-- home page. Replaces the previously hardcoded news array in
-- client/src/pages/Accueil/sections/Actualites.jsx with a DB-driven
-- module managed from /admin/news.
CREATE TABLE IF NOT EXISTS news (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  excerpt TEXT NOT NULL,
  image_url VARCHAR(500) NULL,
  date_published DATE NOT NULL,
  social_platform ENUM('instagram', 'facebook', 'none') NOT NULL DEFAULT 'none',
  social_url VARCHAR(500) NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_news_published (is_published, date_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- After creating the table, seed the two original cards (idempotent):
-- npm run seed:news

-- Phase 24 (2026-05-19): security hardening.
-- 1. Authoritative price column on activity. The registration flow now
--    refuses to start a paid checkout when price_cents is NULL.
ALTER TABLE activity
  ADD COLUMN price_cents INT UNSIGNED NULL AFTER cout;

-- 2. Index for the new /api/newsletter/confirm?token=… endpoint
--    (double opt-in). Token is a 64-hex random value; without an index
--    confirmation queries would full-scan the table.
ALTER TABLE newsletter_subscriber
  ADD INDEX idx_newsletter_token (confirmation_token);
```

Skip this block if you're loading `database.sql` for the first time —
it already has the columns and tables.

### Backfilling activity.price_cents

Existing rows have `price_cents = NULL`. For Jeunesse activities that
should charge money, set the column from the admin UI (the
`/admin/activities/:id/edit` form has a new field) or directly in SQL:

```sql
-- Example: a €5 jeunesse workshop
UPDATE activity SET price_cents = 500 WHERE id = 42;
-- Free activities can stay NULL — the registration service still
-- refuses checkout (admin must explicitly set 0 to flag "free, but
-- registration tracked").
UPDATE activity SET price_cents = 0 WHERE id = 43;
```

---

## Step 3 — Deploy the backend (Render)

1. Sign up at <https://render.com> with your GitHub account so Render
   can read the repo.
2. New → **Blueprint** → select the `csc-ostwald` repo.
3. Render reads `api/render.yaml` and proposes one service:
   `csc-ostwald-api`. Confirm.
4. On the next page, fill the env vars marked `sync: false` in the
   blueprint (they have empty values in the UI):
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
     → from Aiven, step 2.
   - `JWT_SECRET` → generate locally: `openssl rand -base64 64`. Paste.
   - `HELLOASSO_CLIENT_ID`, `HELLOASSO_CLIENT_SECRET`,
     `HELLOASSO_WEBHOOK_SECRET` → leave empty while `HELLOASSO_MODE=mock`.
5. Click **Apply**. Render builds + deploys (~3 minutes).
6. Verify:

   ```sh
   curl https://csc-ostwald-api.onrender.com/api/health
   # → { "status": "ok", "database": "reachable", ... }
   ```

   If `database: unreachable`, double-check the 5 DB env vars in
   Render's dashboard.

### Seeding the first admin user + initial content

Render's free plan doesn't include a built-in shell, so run the seed
scripts **locally** against the production database the first time:

```sh
cd api
cp .env.example .env
# Edit .env: set DB_HOST/PORT/USER/PASSWORD/NAME to Aiven values

# 1. Admin login (required — without it you can't reach /admin/*)
npm run create-admin etienne@csc-ostwald.fr 'YourS3cureP@ss!'

# 2. Real CSC team (5 staff members from CLAUDE.md)
npm run seed:team

# 3. Real CSC partners (6 institutionnels + 12 associatifs)
npm run seed:partners

# 4. Sample agenda events (4 dated entries shifted 6 months into the
#    future so they're always visible at first deploy — the team can
#    edit / delete them via /admin/events)
npm run seed:events

# 5. Recurring activities (4 Famille + 4 Jeunesse workshops — these
#    populate /famille and /jeunesse via /api/activities)
npm run seed:activities

# 6. Projet Social PDFs (CERFA, dossier inscription, rapports)
npm run seed:projet-social

# 7. "Nos actualités" home cards (2 initial items — Fête des voisins,
#    espace numérique). The team can add/edit more via /admin/news.
npm run seed:news
```

All scripts are idempotent — running them twice is a no-op
(skips rows that already exist by email / name / title). Photos and
other optional fields can be edited via the admin UI afterwards.

Verify:

```sh
mysql -h ... -u ... -p... <DB_NAME> -e "SELECT id, email, role FROM user;"
mysql -h ... -u ... -p... <DB_NAME> -e "SELECT prenom, nom, role FROM team_member;"
mysql -h ... -u ... -p... <DB_NAME> -e "SELECT name, category FROM partner;"
```

---

## Step 4 — Deploy the frontend (Vercel)

1. Sign up at <https://vercel.com> with your GitHub account.
2. **Add New… → Project** → import `csc-ostwald`.
3. Configure:
   - **Root directory**: `client` (the project monorepo has `client/`
     and `api/` at the same level).
   - **Framework preset**: Vite (auto-detected).
   - **Build command**, **Output directory**, **Install command**:
     left empty — Vercel reads them from `client/vercel.json`.
4. Environment variables: none required for the default setup
   (the `/api/*` rewrite in `vercel.json` already points at the Render
   backend). If you've changed the Render URL, edit `vercel.json` →
   `rewrites[0].destination` before pushing.
5. Click **Deploy**. ~90 seconds later, your site is live at
   `https://csc-ostwald.vercel.app`.

### Custom domain (optional, do later)

1. Buy a domain (recommended: OVH for `.fr` — French registrar, ~10 €/yr).
2. In Vercel dashboard → Project → Settings → Domains, add `csc-ostwald.fr`.
3. Vercel shows two DNS records to add at your registrar (A + CNAME).
4. After DNS propagation (10–60 min), update:
   - `api/render.yaml` → `CORS_ORIGIN` → `https://csc-ostwald.fr`
   - `api/render.yaml` → `HELLOASSO_RETURN_URL` and `_CANCEL_URL` similarly
   - Commit + push; Render redeploys automatically.

---

## Step 5 — Smoke-test end-to-end

```sh
# Backend health
curl https://csc-ostwald-api.onrender.com/api/health

# Auth (replace email/password with what you seeded)
curl -i -X POST https://csc-ostwald-api.onrender.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"etienne@csc-ostwald.fr","password":"YourS3cureP@ss!"}'
# → 200 + Set-Cookie: jwt_token=...

# Public site
open https://csc-ostwald.vercel.app                     # frontend loads
open https://csc-ostwald.vercel.app/admin/login         # admin login form
```

If the admin login form sends but you get redirected to `/admin/login`
again, check that the cookie is being set: open browser DevTools →
Application → Cookies → `https://csc-ostwald.vercel.app` — you should
see `jwt_token` with `HttpOnly`, `Secure`, `SameSite=Strict`.

---

## Step 6 — HelloAsso activation (when ready)

Phase 11.4 wires the real HelloAsso API. To switch from mock to real:

1. Create a HelloAsso organization account at <https://www.helloasso.com>.
2. In the org admin → **API** → create credentials. Copy:
   - `client_id` → Render env `HELLOASSO_CLIENT_ID`
   - `client_secret` → Render env `HELLOASSO_CLIENT_SECRET`
   - Configure a webhook → URL: `https://csc-ostwald-api.onrender.com/api/payment/webhook`
   - Webhook signing secret → Render env `HELLOASSO_WEBHOOK_SECRET`
3. Set `HELLOASSO_MODE=real` on Render.
4. Implement the real-mode methods in `api/src/service/HelloAssoService.js`
   (the file has TODO blocks with the full contract).
5. Add `express.raw({ type: 'application/json' })` to the webhook route
   in `api/src/server.js` before `express.json()` (webhook needs raw
   body for HMAC validation).
6. Push → Render redeploys → real payments work.

---

## Common issues

### Render deploys but `/api/health` returns 502

- Check the Render service logs for crash messages on startup.
- Usual cause: missing env var (often `JWT_SECRET` in prod — the code
  fails fast on the dev default).

### Vercel deploys but `/admin/dashboard` 404s on hard refresh

- This means the SPA rewrite isn't catching all routes.
- Verify `client/vercel.json` contains the catch-all
  `{"source": "/(.*)", "destination": "/index.html"}` rewrite.
- The `/api/:path*` rewrite must come FIRST (more specific patterns
  must precede the catch-all in Vercel's rewrites list).

### Form submission fails with CORS error

- `CORS_ORIGIN` on Render doesn't match the actual frontend URL.
- Check: open the form, submit, look at the network tab for the
  preflight `OPTIONS` request's `Access-Control-Allow-Origin` header.
  If it says `null` or a stale URL, fix `CORS_ORIGIN` on Render.

### Cookie isn't set after login (cross-site)

- Render and Vercel are on different domains, so the cookie needs
  `SameSite=None` (not `Strict`) AND `Secure` to cross the origin
  boundary. The code uses `SameSite=Strict` because the production
  intent was a same-origin deploy (e.g. both behind the same domain via
  Vercel's `/api/*` rewrite).
- The Vercel `/api/*` rewrite to Render keeps the request _same-origin_
  from the browser's point of view, so `SameSite=Strict` works as long
  as users hit `csc-ostwald.vercel.app/api/...` not the bare Render URL.
- If you ever talk to the Render URL directly from the browser (e.g.
  testing), the cookie won't flow. That's expected.

### MSW mocks intercept requests on the deployed site

- `import.meta.env.DEV` is `false` in prod builds, so MSW is
  tree-shaken. If you see mocked responses, the build was a dev build —
  re-run `npm run build` (not `npm run dev`).

---

## Cost summary (per month, after free tiers)

| Item                                | Cost        |
| ----------------------------------- | ----------- |
| Vercel Hobby                        | **0 €**     |
| Render free Node (with cold starts) | **0 €**     |
| Render Starter (no cold starts)     | $7 ≈ 6.50 € |
| Aiven free trial month              | **0 €**     |
| Aiven hobby MySQL (after trial)     | $20 ≈ 18 €  |
| `.fr` domain (OVH)                  | ~0.80 €     |
| **Total free-tier monthly**         | ~0.80 €     |
| **Total recommended (no cold start + real DB)** | ~25 €     |

The free-tier path is sufficient for an initial public launch with low
traffic. Upgrade Render to Starter as soon as the team complains about
the 30s cold start on first morning visit; upgrade Aiven once the trial
ends or move to a self-hosted MySQL on a $5 VPS.
