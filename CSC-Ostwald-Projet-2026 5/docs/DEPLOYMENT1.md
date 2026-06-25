# Production Deployment — CSC Ostwald

Step-by-step runbook to take this repo from local dev to production on
Vercel (frontend) + Render (API) + Aiven (managed MySQL).

Total time, end to end: about **45 minutes** if the GitHub repo and a
domain are already in your hands.

---

## 0. Prerequisites

- [ ] Repo pushed to GitHub (`origin/main`).
- [ ] Account on:
  - [Vercel](https://vercel.com) — frontend hosting.
  - [Render](https://render.com) — Node API hosting.
  - [Aiven](https://aiven.io) — managed MySQL (free trial 30 days, then
    ~$10/mo for the cheapest plan). Alternatives: PlanetScale, Railway,
    AWS RDS, Hetzner-managed MySQL.
- [ ] (Optional but recommended) Domain `csc-ostwald.fr` with access to
      its DNS provider.

Open these three dashboards in tabs — you will alternate between them.

---

## 1. Provision the database (Aiven, ~10 min)

1. Aiven dashboard → **Create service** → **MySQL**.
2. Cloud + region: **Google Cloud → europe-west9 (Paris)** or
   **AWS → eu-west-3 (Paris)** for low latency from Alsace.
3. Plan: **Hobbyist** (or Free trial). 1 CPU / 1 GB RAM is plenty for
   a community-center site.
4. Name: `csc-ostwald-mysql`. Click **Create service**.
5. Wait ~3 minutes for the service to come online (state: *Running*).
6. Open the service → **Overview** tab. Copy the connection details
   shown in the right panel:

   ```
   Host:     csc-ostwald-mysql-<id>.aivencloud.com
   Port:     12345    (Aiven assigns a random port — NOT 3306)
   User:     avnadmin
   Password: <one-shot generated string>
   Database: defaultdb
   ```

   Keep these secret. Aiven hides the password if you leave the tab.

7. **Service settings** → **Allowed IPs**: leave the default
   `0.0.0.0/0` for now. Once you know Render's outbound IPs, tighten
   this down (Render exposes them under "Bandwidth").

### 1.1 Apply the schema

From your local machine (the one with this repo):

```bash
cd api
cp .env .env.bak             # keep your dev config safe
cat > .env.migrate <<EOF
DB_HOST=csc-ostwald-mysql-XYZ.aivencloud.com
DB_PORT=12345
DB_USER=avnadmin
DB_PASSWORD=<the-Aiven-password>
DB_NAME=defaultdb
EOF

# Use the migrate config without overwriting your real .env
NODE_OPTIONS="--use-system-ca" \
  npm_config_userconfig=/dev/null \
  node --env-file=.env.migrate scripts/migrate.js
```

Expected output: `✓ Applied N statement(s) to defaultdb`. Verify in
Aiven's web console (Databases tab → defaultdb → Tables): you should
see **12 tables** (`user`, `category`, `activity`, `event`, `team_member`,
`partner`, `message`, `registration`, `newsletter_subscriber`,
`benevole_application`, `projet_social_document`, `news`).

### 1.2 Seed the first admin user + initial content

```bash
# Required — without this, /admin/* is inaccessible
node --env-file=.env.migrate scripts/create-admin.js \
  admin@csc-ostwald.fr 'PICK-A-STRONG-PASSPHRASE!2026'

# Optional content seeds — all idempotent (skip rows that already exist)
node --env-file=.env.migrate scripts/seed-team.js
node --env-file=.env.migrate scripts/seed-partners.js
node --env-file=.env.migrate scripts/seed-events.js
node --env-file=.env.migrate scripts/seed-activities.js
node --env-file=.env.migrate scripts/seed-projet-social.js
node --env-file=.env.migrate scripts/seed-news.js
```

Delete `.env.migrate` once the migration succeeds — you will set these
values in Render's dashboard, not commit them anywhere.

```bash
rm api/.env.migrate
```

---

## 2. Deploy the API to Render (~15 min)

1. Render dashboard → **New** → **Blueprint**.
2. Connect your GitHub repo. Render detects `api/render.yaml` and
   pre-fills the service. Confirm.
3. Service name: `csc-ostwald-api` (must match the rewrite in
   `client/vercel.json` — if you change one, change the other).
4. Click **Apply**. Render starts the first build (~3 min on free tier).
   It will fail the first deploy because the database env vars are
   blank — that's expected; we fill them next.
5. Open the service → **Environment** tab. Fill in:

   | Key                       | Value                                                |
   | ------------------------- | ---------------------------------------------------- |
   | `DB_HOST`                 | `csc-ostwald-mysql-XYZ.aivencloud.com`               |
   | `DB_PORT`                 | The Aiven port (NOT 3306)                            |
   | `DB_USER`                 | `avnadmin`                                           |
   | `DB_PASSWORD`             | (the Aiven password)                                 |
   | `DB_NAME`                 | `defaultdb`                                          |
   | `JWT_SECRET`              | `openssl rand -base64 64` output — 64+ random chars  |
   | `CORS_ORIGIN`             | `https://csc-ostwald.vercel.app` (update after §3)   |
   | `HELLOASSO_CLIENT_ID`     | leave empty (still mock mode in this release)        |
   | `HELLOASSO_CLIENT_SECRET` | leave empty                                          |
   | `HELLOASSO_WEBHOOK_SECRET`| leave empty                                          |

   The other env vars (`NODE_ENV`, `PORT`, `COOKIE_NAME`,
   `COOKIE_SAMESITE`, `HELLOASSO_MODE`, …) come from `render.yaml` and
   need no manual entry.

6. Click **Save changes**. Render redeploys automatically.
7. Once status is "Live", open `https://csc-ostwald-api.onrender.com/api/health`.
   You should see:

   ```json
   { "status": "ok", "db": true, "timestamp": "2026-…" }
   ```

   If `db: false`, double-check the Aiven host/port/password and
   whether Aiven's "Allowed IPs" lets Render in.

> **Cold-start note**: Render's free tier sleeps the service after
> 15 minutes of inactivity. The first request after a sleep takes
> ~30 s. For a low-traffic community-center site this is acceptable.
> Upgrade to the **Starter** plan ($7/mo) once you have real users.

---

## 3. Deploy the frontend to Vercel (~10 min)

1. Vercel dashboard → **Add New** → **Project**.
2. Import the same GitHub repo.
3. **Root directory**: `client`.
   Framework preset: **Vite** (auto-detected).
   Build command: `npm run build` (default).
   Output directory: `dist` (default).
4. **Environment Variables** — add only one:

   | Key             | Value                       |
   | --------------- | --------------------------- |
   | `VITE_SITE_URL` | `https://csc-ostwald.fr`    |

   No `VITE_API_BASE_URL` needed — the `client/vercel.json` rewrite
   forwards `/api/*` to the Render service, so the frontend keeps
   calling `/api/...` (same origin as far as the browser knows).

5. Click **Deploy**. First build ~2 minutes.
6. When the deploy finishes, copy the preview URL
   (`https://csc-ostwald-<hash>.vercel.app`).
7. **Go back to Render → Environment** and update `CORS_ORIGIN` to
   exactly that URL (no trailing slash). Save → Render redeploys.

### 3.1 Update the Vercel rewrite target

If you renamed the Render service, edit
`client/vercel.json` → `rewrites[0].destination` to match. Commit, push,
Vercel auto-rebuilds.

---

## 4. Wire the custom domain (~10 min)

### 4.1 Frontend → Vercel

1. Vercel project → **Settings → Domains** → add `csc-ostwald.fr`
   and `www.csc-ostwald.fr`.
2. Vercel shows two A/CNAME records. Add them at your DNS provider
   (OVH, Gandi, Cloudflare …).
3. Wait for DNS propagation (usually <10 min, up to 48 h).
4. Vercel auto-provisions an SSL cert via Let's Encrypt.

### 4.2 CORS_ORIGIN update

Once `https://csc-ostwald.fr` resolves, update the Render env var:

```
CORS_ORIGIN=https://csc-ostwald.fr,https://www.csc-ostwald.fr
```

Save → Render redeploys.

### 4.3 (Optional) Custom API subdomain

Skip this if you keep the Vercel rewrite — the `/api/*` traffic goes
through `csc-ostwald.fr` transparently and same-origin cookies work.

If you do want `api.csc-ostwald.fr`:
1. Render service → **Settings → Custom Domains** → add the subdomain.
2. Add the CNAME record Render gives you.
3. Update `client/vercel.json` rewrite destination AND set
   `COOKIE_SAMESITE=none` in Render env (cross-site cookies).
4. Update `VITE_API_BASE_URL` in Vercel env to
   `https://api.csc-ostwald.fr/api`.

---

## 5. Smoke tests

After the domain is live, exercise every public surface:

- [ ] `GET https://csc-ostwald.fr/` returns the React app (HTML).
- [ ] `GET https://csc-ostwald.fr/api/health` → `{ status: "ok" }`.
- [ ] `GET https://csc-ostwald.fr/api/team` → JSON array of staff.
- [ ] Submit the contact form on `/contact` — admin should see the
      message under `/admin/messages` after logging in.
- [ ] Subscribe an email on the footer newsletter — appears in
      `/admin/newsletter`.
- [ ] Submit a benevole application from `/inscription-benevole`.
- [ ] Log into `/admin/login` with the admin user from §1.2.
- [ ] Run a CSV export from any admin page — confirm a `.csv` file
      downloads with the UTF-8 BOM.

---

## 6. Operations cheat sheet

| Action                                 | Where                                          |
| -------------------------------------- | ---------------------------------------------- |
| Rotate `JWT_SECRET`                    | Render → Environment → edit → Save (forces redeploy + invalidates all admin sessions) |
| Promote a new commit                   | Push to `main`; Vercel + Render auto-deploy via the webhooks added at setup |
| Rollback                               | Vercel: redeploy a past commit from the Deployments tab. Render: same via "Manual Deploy → Previous commit". |
| Add a new admin                        | Render shell (paid plans only) or run `npm run create-admin` locally pointing `.env` at the Aiven DB |
| Apply a schema change                  | Edit `api/database.sql`, then `node scripts/migrate.js` with the Aiven env. Idempotent — only new tables/columns get created. |
| Watch errors                           | Render → Logs (live stream). Vercel → Project → Deployments → "Runtime Logs". |
| Tighten Aiven access                   | Aiven → Service → Allowed IPs → replace `0.0.0.0/0` with the Render outbound IPs (printed in Render's Bandwidth tab). |

---

## 7. Costs (recurring, EUR/month, low traffic)

| Service               | Tier                  | Cost        |
| --------------------- | --------------------- | ----------- |
| Vercel                | Hobby (personal)      | **0 €**     |
| Render                | Free (sleeps)         | **0 €**     |
| Render                | Starter (no sleep)    | ~6 €        |
| Aiven MySQL           | Hobbyist 1 GB         | ~12 €       |
| Domain (csc-ostwald.fr)| .fr at OVH           | ~8 €/year   |

Minimum viable: **0 € + 1 € for the domain** (Vercel + Render free
+ Aiven trial). Sustainable for the long term: ~12-18 €/month with the
managed DB and no-sleep API.

---

## 8. Future hardening (not blockers)

- Move `JWT_SECRET` to Render's "Secret Files" instead of plain env vars.
- Enable Vercel Web Analytics (zero-cookie analytics, RGPD-friendly).
- Add Sentry (free tier covers a community site).
- Set up Aiven daily backups (built-in, just turn on retention).
- Replace HelloAsso mock with real credentials → set `HELLOASSO_MODE=real`
  and the four `HELLOASSO_*` env vars in Render.
