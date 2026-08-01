# CareerOptics Education Service

_Your career. Our guidance._

College discovery + admission counselling lead-generation portal for India. Full spec in [`PRD.md`](PRD.md); build rules for agents in [`CLAUDE.md`](CLAUDE.md).

## Stack

Next.js 15 (App Router, RSC) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase · Resend · Upstash · Vercel.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in values as each phase needs them
pnpm dev
```

Open http://localhost:3000.

## Scripts

| Command          | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `pnpm dev`       | Dev server (Turbopack)                                          |
| `pnpm build`     | Production build — must pass before commit                      |
| `pnpm start`     | Serve the production build                                      |
| `pnpm lint`      | ESLint                                                          |
| `pnpm db:verify` | Run migrations + seed against PGlite and assert RLS (no Docker) |
| `pnpm db:push`   | Apply migrations to the linked Supabase project                 |
| `pnpm db:reset`  | Reset the local Supabase database and reload the seed           |
| `pnpm db:types`  | Regenerate `src/types/database.types.ts`                        |

## Database

Schema, RLS policies and storage buckets live in `supabase/migrations/`; §14 seed data is in `supabase/seed.sql`.

```bash
pnpm supabase login
pnpm supabase link --project-ref <your-project-ref>
pnpm db:push
pnpm db:types
```

Then visit `/db-check` to confirm the tables are readable and that `leads` is correctly blocked for anonymous users.

> The college metrics in `seed.sql` (NAAC grades, NIRF ranks, packages, fees) are **placeholder demo values**. Replace them with verified partner data before launch.

## Layout

```
src/
  app/
    (site)/          public pages
    globals.css      brand design tokens (PRD §6.1)
    layout.tsx       fonts + root metadata
  components/        ui/ site/ …
  config/site.ts     name, contact, social
  lib/utils.ts       cn()
```

## Build phases

One phase per session — see `PRD.md` §16.

- [x] **P0** Foundation: scaffold, Tailwind v4 + shadcn, fonts, brand tokens, env, site config
- [x] **P1** Supabase schema, RLS, storage buckets, seed data, typed clients
- [ ] **P2** Design system + `/style-guide`
- [ ] **P3** Home sections
- [ ] **P4** Lead engine
- [ ] **P5**–**P12** listing, detail, taxonomy, finder, content, admin, SEO, launch
