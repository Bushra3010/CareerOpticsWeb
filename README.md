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

| Command      | Purpose                                    |
| ------------ | ------------------------------------------ |
| `pnpm dev`   | Dev server (Turbopack)                     |
| `pnpm build` | Production build — must pass before commit |
| `pnpm start` | Serve the production build                 |
| `pnpm lint`  | ESLint                                     |

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
- [ ] **P1** Supabase schema, RLS, storage buckets, seed data, generated types
- [ ] **P2** Design system + `/style-guide`
- [ ] **P3** Home sections
- [ ] **P4** Lead engine
- [ ] **P5**–**P12** listing, detail, taxonomy, finder, content, admin, SEO, launch
