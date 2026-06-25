# features/

Domain features as **closed modules** — each owns its API hooks + Zod schema,
exposed through a single barrel (`index.js`).

## What is a feature?

A folder under `features/` is a feature if it meets 3 of 4:

1. Contains business logic for a specific domain
2. Bundles UI + API call + Zod schema + state together
3. Can be deleted by removing the folder (no broken imports elsewhere)
4. Is named with a natural-language term (`newsletter`, `payment`, `auth`)

## What is NOT a feature?

- `Button` → UI primitive → `src/components/ui/`
- `useParallax` → generic hook → `src/hooks/`
- `formatDate` → utility → `src/utils/`
- `Header` → layout chrome → `src/components/layout/`

## Cross-feature isolation

**Features MUST NOT import from each other.** Allowed dependencies only:

```
features/*  →  components/*    OK
features/*  →  hooks/*         OK
features/*  →  utils/*         OK
features/*  →  api/*           OK (base client only)
features/*  →  features/*      FORBIDDEN
```

If two features share logic, lift it into `hooks/`, `utils/`, or
`components/shared/`.

## Internal structure

```
feature-name/
├── api/              ← React Query hooks — use<Action>.js
├── schemas/          ← Zod schemas (only when the feature has forms)
└── index.js          ← Public API barrel
```

## Active features

Only modules with real code currently live here:

- `newsletter/` — footer subscription form (RHF + Zod + React Query)
- `contact/` — contact page form (RHF + Zod + React Query)
- `benevole/` — volunteer application form (RHF + Zod + React Query)
- `registration/` — Jeunesse online registration + HelloAsso Checkout
- `team/` — /api/team consumer for QuiSommesNous
- `partners/` — /api/partners consumer for NosPartenaires
- `events/` — /api/events/upcoming consumer for Accueil agenda
- `activities/` — /api/activities consumer for Famille + Jeunesse
