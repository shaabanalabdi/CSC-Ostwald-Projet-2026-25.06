# Architecture — CSC Ostwald Frontend

## Pattern: Feature-based Hybrid (Bulletproof React 2026)

The `client/src/` tree is organized around **domain features** with **shared
infrastructure** layers. The project was migrated from TypeScript to pure
JavaScript in May 2026 (212 files converted, see "Migration history" below).

```
src/
├── App.jsx, main.jsx     ← Bootstrap, routes, providers
├── features/             ← Domain modules (closed boundaries)
├── pages/                ← Page-level components (compose features + UI)
├── components/           ← Shared UI (ui/, layout/, shared/, motion/)
├── api/                  ← HTTP client base (NOT feature mutations)
├── hooks/                ← Shared hooks
├── utils/                ← Pure functions
├── stores/               ← Global state (accessibility prefs)
├── config/               ← env + constants
├── styles/               ← Global SCSS only
├── assets/               ← Images, icons, fonts
├── i18n/                 ← Translation config + locales (5 languages)
├── mocks/                ← MSW handlers
└── test/                 ← Test utilities
```

## Decision rule: "Is this a feature?"

See `client/src/features/README.md` for the canonical decision rule. Short
version: a feature owns its own API hooks, schemas, and (when admin) its
own Zod validation. If two pages need the same data, the API hook lives
in a feature; if two features need the same logic, lift it.

## Cross-feature isolation

Features **MUST NOT import from each other**. Allowed dependencies:

```
features/*  →  components/*    OK
features/*  →  hooks/*         OK
features/*  →  utils/*         OK
features/*  →  api/*           OK (base client only)
features/*  →  features/*      FORBIDDEN
```

If two features share logic, lift it into `hooks/`, `utils/`, or
`components/shared/`. The one exception is the public/admin pair
convention: `features/news` (public read) is intentionally separate
from `features/admin-news` (CRUD), and neither imports the other —
they share only the route prefix on the API side.

## Path aliases

Defined in both `client/jsconfig.json` (for editor IntelliSense) and
`client/vite.config.js` (for the build):

| Alias          | Target                              |
| -------------- | ----------------------------------- |
| `@/*`          | `client/src/*` (catch-all)          |
| `@features/*`  | `client/src/features/*`             |
| `@components/*`| `client/src/components/*`           |
| `@pages/*`     | `client/src/pages/*`                |
| `@hooks/*`     | `client/src/hooks/*`                |
| `@api/*`       | `client/src/api/*`                  |
| `@stores/*`    | `client/src/stores/*`               |
| `@utils/*`     | `client/src/utils/*`                |
| `@assets/*`    | `client/src/assets/*`               |
| `@styles/*`    | `client/src/styles/*`               |

## Admin pages convention

Every CRUD admin module follows the same shape, so adding a new domain
is mechanical:

```
pages/Admin<Name>/
├── Admin<Name>.jsx        List view: SearchInput + pagination + edit/delete + CSV export
├── Admin<Name>.scss       BEM under .admin-<name>, mobile-first (<640px)
└── index.js               export { default } from './Admin<Name>'
pages/Admin<Name>Edit/
├── Admin<Name>Edit.jsx    Form: useForm + zodResolver, Controller for image upload
├── Admin<Name>Edit.scss   Form grid, error states, disabled states
└── index.js
features/admin-<name>/
├── api/                   use<Action><Name>.js (5 hooks: list, one, create, update, delete)
├── schemas/<name>.schema.js  Zod schema + enums (e.g. NEWS_PLATFORMS)
└── index.js               Barrel — only public surface
```

All `/admin/*` routes (except `/admin/login`) render inside `AdminLayout`,
which adds the public Navbar + Footer around the admin pages.

## Migration history

| Date / phase    | What changed |
| --------------- | ------------ |
| Phase 1–6       | Newsletter, Contact, Bénévole forms — RHF + Zod, MSW + Vitest, GitHub Actions CI |
| Phase 7         | Feature-based reorganization (folders moved to feature-first layout) |
| Phase 8–16      | Backend (Entity → Repository → Service → Controller), Admin auth, JWT |
| Phase 17        | `team_member.phone` column — public team page shows phone numbers |
| Phase 18        | Agenda DB-driven: `event.cout / capacite / category_label / category_color` |
| Phase 19        | `/famille` + `/jeunesse` consume `/api/activities` — adds `categorie_label / frequence / tag` |
| Phase 20        | **Pure-JS migration**: TypeScript stripped, 212 files converted, `tsconfig.json` → `jsconfig.json` |
| Phase 21        | OVH single-VPS deployment (Docker Compose + nginx + Let's Encrypt) |
| Phase 22        | Mobile-first audit + WCAG AA contrast fixes (Lighthouse 100/100/100/100 on preview) |
| Phase 23        | **Admin "Nos actualités" CRUD** — new `news` table, full backend module, admin pages, home page wired to `/api/news` |

## Why pure JavaScript (post Phase 20)

The CSC team has no TypeScript experience and the maintenance window is
small (community center, part-time webmaster). TS was removed to keep the
total surface area learnable in a week: zero `.ts/.tsx` files, no compile
step beyond Vite, no `tsc` in CI. Runtime safety lives in **Zod schemas**
at the network boundary (request bodies + form inputs) — the layer where
TS types couldn't have helped anyway, since they're erased at runtime.

The trade-off: editor IntelliSense in JS files comes from `jsconfig.json`
+ JSDoc on the most-touched modules. Path aliases still autocomplete.

## Why some "planned" features have no folder

Empty feature folders mislead readers: a junior dev assumes the feature
is implemented but disabled, then wastes time searching for the missing
wiring. The rule from `client/src/features/README.md` is: **the folder
is created in the same commit that introduces its first real file** —
never before.
