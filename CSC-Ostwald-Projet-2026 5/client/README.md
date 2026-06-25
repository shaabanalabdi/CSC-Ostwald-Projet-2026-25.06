# CSC Ostwald — Frontend

React 19 + Vite 8 single-page app for the Centre Social et Culturel d'Ostwald
site.

## Stack

- **React 19** + **Vite 8** — pure JavaScript (no TypeScript)
- **React Router v7** — code-split routes via `lazy()` + Suspense
- **SCSS** — design tokens in `src/styles/_variables.scss`, modular partials
- **TanStack React Query** (`@tanstack/react-query`) — data fetching with cache
- **React Hook Form** + **Zod** (`zodResolver`) — all forms
- **framer-motion** (LazyMotion + `m`) — page transitions, scroll reveals
- **@dnd-kit/sortable** — admin drag-and-drop reorder
- **react-i18next** — 5 locales (fr, en, ar, ru, tr). RTL applied on `<html>`
  for `ar`
- **react-icons/fa** — FontAwesome icon set
- **Leaflet** — map (no Google, zero cookies)
- **Vitest** + Testing Library — 102 tests passing

## Setup

```sh
npm install
npm run dev                # http://localhost:5173 — proxies /api & /uploads to :3001
```

The API must be running on `localhost:3001`. See
[`../api/README.md`](../api/README.md).

## Scripts

| Command                 | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `npm run dev`           | Dev server with HMR                                                     |
| `npm run build`         | Production build → `dist/`                                              |
| `npm run preview`       | Serve the production build locally on `:4173` (use this for Lighthouse) |
| `npm run lint`          | ESLint check                                                            |
| `npm test`              | Vitest run (102 tests)                                                  |
| `npm run test:coverage` | Coverage report                                                         |

## Folder layout (Bulletproof React, feature-first)

```
src/
├── api/                  HTTP wrapper + resolveStaticUrl + downloadCsv
├── assets/               images, fonts
├── components/
│   ├── layout/           Layout, AdminLayout, Navbar, Footer, PageSEO
│   ├── ui/               SearchInput, UploadField, CSCBadge, CSCCard, LeafletMap, …
│   └── shared/           ProtectedRoute, ErrorBoundary, ScrollToTop, AccessibilityWidget
├── features/             Domain modules (closed boundaries — see below)
├── hooks/                Shared hooks (useMotionPresets, useSpotlight, …)
├── i18n/                 Translation config + locales
├── pages/                Page-level components
├── stores/               Global stores (accessibility prefs)
├── styles/               Global SCSS only (_variables, _mixins, …)
└── App.jsx, main.jsx
```

Path aliases (defined in `vite.config.js` + `jsconfig.json`): `@api/*`,
`@features/*`, `@components/*`, `@pages/*`, `@hooks/*`, `@assets/*`,
`@stores/*`, `@/*` (catch-all).

## Features convention

Each `src/features/<domain>/` is a **closed boundary**:

```
features/<domain>/
├── api/                  React Query hooks — use<Action>.js
├── schemas/              Zod schemas (admin-* domains only)
└── index.js              Barrel — only public surface
```

Rules:

- Features **MUST NOT import from each other**. Lift shared logic to `hooks/`,
  `utils/`, or `components/shared/`.
- Public read hooks live in `features/<domain>/`, admin CRUD hooks live in
  `features/admin-<domain>/`. Example: `features/news` (public) +
  `features/admin-news` (CRUD).
- Each feature owns its own Zod schemas — never reach into another feature's
  `schemas/` folder.

## Admin

All `/admin/*` routes (except `/admin/login`) render inside `AdminLayout`, which
adds Navbar + Footer around the page. 12 admin modules — see
[`../CLAUDE.md`](../../CLAUDE.md) for the full list.

Pattern per CRUD module (e.g. `news`):

```
pages/AdminNews/
├── AdminNews.jsx         List with SearchInput + pagination + edit/delete
├── AdminNews.scss        BEM-style, $space-* tokens
└── index.js              Default barrel
pages/AdminNewsEdit/
├── AdminNewsEdit.jsx     RHF + zodResolver + Controller for image upload
├── AdminNewsEdit.scss    .admin-news-edit + responsive (<640px)
└── index.js
features/admin-news/
├── api/use{Admin,Item,Create,Update,Delete}News.js
├── schemas/news.schema.js
└── index.js              Exports hooks + schema + NEWS_PLATFORMS const
```

## Image uploads

`UploadField` posts to `POST /api/admin/upload` (multer disk storage) which
returns `{ url: '/uploads/<hash>.webp' }`. The string is stored in the DB column
(e.g. `news.image_url`). On display, pass the value through `resolveStaticUrl()`
from `@api/client`:

```jsx
import { resolveStaticUrl } from '@api/client';
<img src={resolveStaticUrl(news.image_url)} alt="" />;
```

In dev (Vite proxy) and prod (nginx/Vercel rewrites), this is effectively a
no-op. It only matters when `VITE_API_BASE_URL` points to a different origin
than the frontend.

## Accessibility

- Lighthouse target: 100/100/100/100 on `npm run preview` (port 4173, NOT
  `npm run dev` — dev has React DevTools / HMR overhead).
- WCAG AA contrast (4.5:1 normal text, 3:1 large) enforced manually for every
  color-on-color combination — see `src/styles/_variables.scss` for the dark
  variants (`$orange-text`, `$bleu-dark`, …) used on light backgrounds.
- `prefers-reduced-motion` respected — `useMotionPresets` returns zero-duration
  variants when set.
- Skip links, `aria-current` on active nav, `aria-invalid` + `role="alert"` on
  all form errors.

## Tests

```sh
npm test                  # one-shot
npm run test:watch        # watch mode
npm run test:coverage     # coverage report
```

102 tests cover: form validation, public hooks, UI components, admin flows
(login, list, edit, delete), and i18n translation completeness.
