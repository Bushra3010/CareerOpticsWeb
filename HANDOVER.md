# CareerOptics — developer handover

Everything you need to pick this project up. Read this once, then work from
[`PRD.md`](PRD.md) (the full spec) and [`CLAUDE.md`](CLAUDE.md) (the working rules).

> ⚠ **`.env.local` is committed to this repository, and this repository is
> public.** That was a deliberate decision to simplify handover, but it means
> `SUPABASE_SERVICE_ROLE_KEY` — which bypasses row-level security on every
> table — is world-readable. Treat it as compromised: rotate it in the Supabase
> dashboard (Settings → API) before this project holds any real student data.
> See [Environment variables](#3-environment-variables).

---

## 1. What this is

| | |
|---|---|
| Product | CareerOptics Education Service — college discovery + admission counselling lead-gen portal |
| Market | Bihar-first, pan-India. ~85% mobile Android traffic on 3G/4G |
| Business model | Student submits an enquiry → counsellor calls → university admission → commission |
| Feature reference | pujaeducation.com |
| Layout reference | collegedunia.com homepage |
| Head office | Near Kshatriya School Road, Bandhan Tola, Maharaja Hata, Nawada, Thana, Arrah, Bihar 802301 |
| Phone | +91 82525 32179 |

The whole product is specified in `PRD.md`. **Do not re-derive decisions that are
already written there** — stack, colours, schema and build phases are fixed.

---

## 2. Current state

Built in phases (PRD §16), one phase per working session.

| Phase | Scope | Status |
|---|---|---|
| **P0** | Next.js 15 + TS + Tailwind v4 + shadcn/ui, fonts, brand tokens, env, site config | ✅ Done |
| **P1** | Supabase schema, RLS, storage buckets, seed data, typed clients | ✅ Done, applied to the live project |
| **P2** | Design system: all §6.4 primitives + site chrome + `/style-guide` | ✅ Done |
| **P3** | Home sections 4–17 of §5.1 with real DB data | ✅ Done |
| **P4** | Lead engine: `LeadForm`, `QuickEnquiryModal`, `CallbackWidget`, `/api/leads`, Resend, rate limit | ✅ Done |
| **P5** | `/colleges` listing + filters + sort + pagination + compare | ✅ Done |
| P6 | `/colleges/[slug]` detail: tabs, right-rail form, reviews, brochure gate | ⬅ **Next** |
| P7–P12 | Taxonomy, finder, content, admin, SEO, launch | Not started |

**Routes that exist today:** `/`, `/colleges`, `/compare`, `POST /api/leads` and
`/style-guide`. `/db-check` was deleted when P3 landed; `/style-guide` is
`noindex` scaffolding, keep it as long as it is useful.

Home is statically prerendered with `revalidate = 300` at **162 kB** First Load
JS, inside the 180 kB budget. Every section is DB-driven and hides itself when
its table is empty, so the page degrades rather than breaking. The only API
route is `POST /api/leads`.

### The lead engine (P4)

Every CTA on the site opens the same `LeadForm` through `LeadDialog`, which
clones its trigger and lazy-loads the dialog on first click — that is why the
whole engine costs about 1 kB of First Load JS. Wire new CTAs the same way.

`POST /api/leads` runs zod validate → honeypot → rate limit → service-role
insert → notify. Notifications are env-gated and can never fail a lead that is
already saved. A repeat phone inside 24 hours still inserts, with
`answers.duplicate_of` pointing at the earlier row (§9 step 6).

Sources wired today: `home_hero`, `contact` (header), `callback`,
`quick_enquiry`, `apply_now`, `college_detail`, `brochure`. `college_finder`
arrives with P8.

### The colleges listing (P5)

All ten filters, the sort and the page live in the query string via `nuqs`, so
any view is shareable and back-button correct, and results are rendered on the
server from them. Filtered and paged URLs are `noindex, follow` (§10).

`listColleges` deliberately runs two queries — see the comment at the top of
`lib/queries/colleges.ts`. It reads every matching college in the first query,
capped at 500 with the cap surfaced in the UI. **Move the fee aggregate into a
database view before the catalogue passes 500 colleges.**

Compare selection is localStorage, not URL state: it has to survive filtering
and paging without colliding with the filter params. `/compare?ids=a,b,c` reads
the ids straight from the query string and caps them at three.

**Not set up yet:** Vercel project, custom domain, GA4/GTM, Resend, Upstash.

---

## 3. Environment variables

`.env.local` **is committed to this repo**, so `pnpm install && pnpm dev` works
with no extra setup. See the warning at the top of this file about what that
means for `SUPABASE_SERVICE_ROLE_KEY`.

`.env.example` remains the documented template of every variable the project
uses (PRD §12).

| Variable | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Set. Project ref `fnsmnamafnugjyqqghhm` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Set. Public by design — it ships in the browser bundle and RLS constrains it |
| `SUPABASE_SERVICE_ROLE_KEY` | Set. **Bypasses RLS entirely.** Server-only — never import `lib/supabase/admin.ts` into a client component |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; set to the real domain on Vercel |
| `NEXT_PUBLIC_PHONE` / `NEXT_PUBLIC_WHATSAPP_NUMBER` | Set |
| `RESEND_API_KEY` / `LEAD_NOTIFY_EMAILS` | **Empty. Lead alert emails are only logged, not sent.** Set both before launch |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | **Empty. Rate limiting falls back to a per-instance in-memory limiter** that resets on deploy and does not span serverless instances. Set both before launch |
| `REVALIDATE_SECRET`, `NEXT_PUBLIC_GTM_ID`, `WHATSAPP_*` | Empty — not needed until P10+ |

Rotating the service-role key: Supabase dashboard → Settings → API → regenerate,
then update `.env.local` and any Vercel environment variables.

---

## 4. First run

```bash
# Node 20+ (Supabase SDK warns on 20 and wants 22 — 22 is recommended)
# If pnpm is missing: npm i -g pnpm@10   (corepack may fail with a signature error)

pnpm install
cp .env.example .env.local     # then fill in the Supabase values
pnpm dev                       # http://localhost:3000
```

Sanity checks:

- `/db-check` should show green pills, all row counts populated, and `leads blocked for anon`
- `/style-guide` should render every UI component in brand colours

### Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build — **must pass with zero TS errors before every commit** |
| `pnpm lint` | ESLint |
| `pnpm db:verify` | Runs migrations + seed + RLS assertions against PGlite. No Docker or Supabase needed |
| `pnpm db:push` | Apply migrations to the linked Supabase project |
| `pnpm db:reset` | Reset the local Supabase database and reload the seed |
| `pnpm db:types` | Regenerate `src/types/database.types.ts` |

---

## 5. Architecture

```
src/
  app/
    (site)/           public pages — layout mounts header/footer/FAB/sticky bar
    globals.css       ALL design tokens live here (PRD §6.1)
    layout.tsx        fonts + root metadata
  components/
    ui/               primitives — check here before writing anything new
    site/             site chrome: header, footer, nav, FAB, logo, social icons
  config/
    site.ts           name, tagline, phone, WhatsApp, social links
    nav.ts            course chips, main/level nav, footer columns, office address
  components/
    home/             the §5.1 home sections + the Section/ScrollRow shells
    college/          CollegeCard — shared with the P5 listing
    forms/            LeadForm · LeadDialog · QuickEnquiryModal · CallbackWidget
  lib/
    supabase/         client (browser) · server (SSR) · public (anon, no cookies) · admin (service role)
    queries/          ALL database reads live here — pages never call Supabase inline
    validations/      zod schemas — all user input goes through these
    leads/            counsellor notification (Resend + WhatsApp deep link)
    seo/              JSON-LD builders (§10)
    media.ts          image fallbacks + INR formatting for DB values
    rate-limit.ts     Upstash limiter with an in-memory fallback
    analytics.ts      GTM / Meta Pixel conversion events (§9 step 4)
    env.ts            env accessors that fail loudly instead of passing undefined
  types/
    database.types.ts generated — do not hand-edit
supabase/
  migrations/         0001_init · 0002_rls · 0003_storage
  seed.sql            PRD §14 seed data
  tests/verify.mjs    the db:verify harness
```

### Non-negotiable conventions

1. **Server Components by default.** `'use client'` only on interactive leaves.
   In our own code that is currently just `site/mobile-nav.tsx` and
   `site/style-guide-toast.tsx` — the shadcn primitives that need it
   (`dialog`, `sheet`, `select`, `tabs`, `accordion`, `carousel`, `sonner`,
   `label`, `separator`) carry their own directive.
2. **No raw hex in components.** Every colour, radius and spacing comes from a
   token in `globals.css`. See `/style-guide`.
3. **All DB access goes through `lib/queries/`** (currently just `health.ts`, for
   `/db-check`). All user input must be validated with zod in `lib/validations/`
   — that directory gets created in P4 with the first real form.
4. **Check `components/ui` before building a component.** Reuse, don't duplicate.
5. **Never edit an applied migration.** Add a new numbered one.
6. One component per file, named export.

### The three Supabase clients

| File | Key | Use |
|---|---|---|
| `lib/supabase/client.ts` | anon | Browser, read-only public data |
| `lib/supabase/server.ts` | anon + request cookies | Server Components, admin Server Actions (RLS enforces role). **Reading cookies opts the route into dynamic rendering** |
| `lib/supabase/public.ts` | anon, no cookies | Published public content on the server — keeps ISR pages static |
| `lib/supabase/admin.ts` | **service role** | Route Handlers / Server Actions only. Guarded by `import "server-only"` so importing it into a client component is a build error |

All lead writes go through `/api/leads` (service role + rate limit + honeypot).
Anonymous inserts are blocked by RLS — this is verified, not assumed.

---

## 6. Database

Schema is PRD §7, implemented across three migrations. 25 tables, 5 enums.

**Security model:**

- RLS is enabled on **every** table.
- Public content is readable by `anon` only when `status='published'` (or
  `is_active` / `is_approved`).
- `leads`, `finder_sessions`, `lead_activities`, `profiles`, `settings` have
  **no anon policy at all**. Verified: anon reads return `[]`, anon inserts fail
  with `42501`, anon updates/deletes affect zero rows.
- Storage: 7 buckets, public read except `brochures`, which is private and served
  via a 60-second signed URL after a lead is captured.

**Triggers:** `updated_at` on colleges/leads; `auth.users` → `profiles` on signup
(created, but untested until the first admin account in P10); reviews →
recomputes `colleges.rating` and `review_count` from approved reviews only.

### ⚠ Two things to know before touching the database

1. **The schema was applied through the Supabase SQL Editor, not `db push`.**
   Supabase therefore has no record of the three migrations. Before anyone runs
   `pnpm db:push` for the first time:

   ```bash
   pnpm supabase login
   pnpm supabase link --project-ref fnsmnamafnugjyqqghhm
   pnpm supabase migration repair --status applied 0001 0002 0003
   ```

   Skipping this will make `db push` try to re-run `0001_init.sql` and fail.

2. **Run `pnpm db:verify` after touching any migration.** It executes the
   migrations and seed against PGlite (WASM Postgres 17) and asserts the seed
   counts, referential integrity and RLS behaviour. It already caught one real
   bug (a non-idempotent seed). It needs no Docker and takes seconds.

### Seed data

PRD §14 quantities: 36 states, 120 cities, 10 streams, 60 courses, 25 colleges,
67 college-course mappings, 12 exams, 39 exam-course links, 8 testimonials,
6 FAQs, 3 banners, 1 scholarship, 6 gallery items, 4 press items. The seed is
idempotent — safe to re-run.

> **🚨 The college metrics are invented placeholder data.** Institution names are
> real so the site is testable, but every NAAC grade, NIRF rank, package figure,
> fee and seat count was made up during development. Publishing invented
> accreditation or placement numbers about a named institution is a legal and
> trust problem. **This must be replaced with verified partner data before
> launch** — it is flagged at the top of `seed.sql`, in the README, and stored as
> a `settings` row (`seed_data.demo_metrics = true`).
>
> Also note the seeded `colleges.rating` values are decorative: the first
> approved review overwrites them, because the trigger recomputes rating purely
> from approved reviews.

---

## 7. Design system

Tokens are in `src/app/globals.css`. Everything is visible at `/style-guide`.

**The rules that make it look like the logo (PRD §6.1, non-negotiable):**

- Primary CTA = `brand-red`. Secondary = outline `brand-blue`. Links = `brand-blue-400`.
- Header/footer/nav = `brand-blue-900`. Red is an accent — ≤10% of any viewport,
  never a large background.
- Orange **only** for: goal/city selector text, "NEW" pills, urgency badges, and
  the active tab underline. **Never white text on orange** — use `text-ink`.
- `bg-brand-gradient` (blue→red, 115°) is the signature element: College Finder
  band and heading underlines only. Nowhere else.
- `heading-underline` puts the 56×4px blue→red swipe under section headings.

**Type:** `font-display` = Plus Jakarta Sans 700/800 (headings), `font-sans` =
Inter 400/500/600 (body). Sizes `text-h1` / `lg:text-h1-lg` / `text-h2` /
`text-h3` / `text-base` (15/24) / `text-sm` (13/20). Fees, packages and ranks use
`tabular-nums`.

**A11y floor:** contrast ≥ 4.5:1, visible focus ring
`ring-2 ring-brand-blue-400 ring-offset-2`, keyboard-navigable carousels, alt on
every image, real `<label>` on every field.

### Built already

- `components/ui`: `Button` (default=red CTA, outline=blue, secondary, ghost,
  inverse, destructive, link; sizes sm→xl), `Badge` (default, secondary, outline,
  new, urgent, success, rating), `Chip` (default, solid, onDark), `Rating`, plus
  shadcn `Input · Label · Select · Card · Tabs · Accordion · Dialog · Sheet ·
  Carousel · Breadcrumb · Pagination · Skeleton · Separator · Toaster(sonner)`.
- `components/site`: `Logo · SiteHeader · MobileNav · CourseChipNav · SiteFooter ·
  MobileStickyBar · WhatsAppFab · social-icons`.

### Still to build

`GoalCitySelector · MegaSearch · HeroCarousel · StudyGoalCards · StatsStrip ·
CollegeCard · CollegeCarousel · ExamCard · TestimonialCarousel · GalleryGrid ·
PressStrip · FaqAccordion` (P3) · `LeadForm · QuickEnquiryModal · CallbackWidget`
(P4) · `FilterSidebar` (P5).

---

## 8. Gotchas that will cost you time

1. **lucide-react v1 has no brand icons.** Facebook/Instagram/YouTube/LinkedIn are
   local SVGs in `components/site/social-icons.tsx`. Reach for those, not lucide.
2. **`Chip` with `asChild` accepts exactly one element child** (Radix `Slot`).
   Passing two children throws *"Slot failed to slot onto its children"* and 500s
   the page. The remove button therefore only exists on the real `<button>` form.
3. **`.npmrc` hoists eslint plugins.** Without
   `public-hoist-pattern[]=*eslint*`, `eslint-config-next` cannot resolve
   `eslint-plugin-react-hooks` under pnpm and `pnpm lint` fails outright. Don't
   delete it.
4. **The sticky header's scroll shadow is a CSS scroll-driven animation**, not a
   JS listener — that is what keeps `SiteHeader` a Server Component. Browsers
   without support keep the border and never gain the shadow. Don't "fix" it with
   `useEffect`.
5. **`text-body` is a colour, `text-base` is the 15/24 size.** A `--text-body`
   size token would collide with the `--color-body` colour token on the `text-*`
   utility, so the body/small sizes deliberately override Tailwind's standard
   `base`/`sm` steps.
6. **`database.types.ts` is currently hand-authored** to match the migrations.
   Once linked, overwrite it with `pnpm db:types` output — don't hand-edit it.
7. **If pnpm is missing**, `corepack enable` may fail with a signature-key error.
   `npm i -g pnpm@10` works.

---

## 9. Open items / technical debt

| Item | Severity | Notes |
|---|---|---|
| **Seed college metrics are invented** | 🔴 Blocks launch | Replace with verified partner data. See §6 above and PRD §17 |
| **No real imagery anywhere** | 🟠 Do before launch | `banners`, `colleges.cover_url/logo_url`, `gallery`, `press_releases` and `testimonials` all hold `/seed/...` paths for files that were never uploaded. `lib/media.ts#imageSrc` turns those into branded placeholders, so the site looks deliberate rather than broken — but the hero, college cards and gallery are all type-only until real files land in Supabase Storage |
| **Logo asset is not production-ready** | 🟠 | `public/logo.webp` is a 534×433 square lockup on an **opaque** background (white → `#D4E6E9` gradient). No transparency, so on the navy footer it sits on a white plaque. At 48px tall in a 64px header the wordmark is illegible. PRD specs a 150×44 (≈3.4:1) logo. Needs a **transparent, horizontal PNG or SVG** |
| `migration repair` not yet run | 🟠 | See §6. Will break the first `db:push` |
| **Lead alerts and rate limiting are unconfigured** | 🟠 Blocks launch | `RESEND_API_KEY`, `LEAD_NOTIFY_EMAILS` and `UPSTASH_*` are empty. Leads save correctly, but nobody is emailed and the 5/10min limit is per-instance only. See §3 |
| **`/colleges` is 186 kB First Load JS** | 🟠 Do in P11 | §11 budgets 180 kB (stated for home, which is 164 kB). The desktop filter sidebar loads the Radix Accordion, Select and nuqs eagerly. Cheapest lever: swap the filter Accordion for native `<details>`, which also makes the panel work without JS |
| **`listColleges` reads every match, capped at 500** | 🟠 Before 500 colleges | The fee sort needs a child aggregate PostgREST cannot order by. Add a view exposing `min_fee_per_year` on `colleges` and the query collapses to one paged call. See `lib/queries/colleges.ts` |
| Header `GoalCitySelector` / `MegaSearch` are static shells | 🟡 | The search form posts to `/search`, which does not exist until P9. The goal/city button does nothing yet |
| Home CTAs point at pages that don't exist yet | 🟡 | `/colleges`, `/courses/*`, `/streams/*`, `/exams/*`, `/college-finder`, `/contact` land in P4–P9. They 404 today by design, not by oversight |
| Node 20 | 🟡 | `@supabase/supabase-js` warns it is deprecated; upgrade to Node 22 |
| Vercel not connected | 🟡 | PRD §16 P0 wanted a green preview deploy |
| `profiles`-on-signup trigger untested | 🟡 | Created, but unverified until the first admin account in P10 |

---

## 10. Workflow

- **Branches:** `dev` is where work happens (Vercel preview). `main` is
  production. Both currently point at the same commit.
- **Commits:** `feat(pN): <scope>` — e.g. `feat(p3): home sections with live data`.
- **Before every commit:** `pnpm build` must pass with zero TS errors. Run
  `pnpm db:verify` too if you touched a migration.
- **One phase per session.** Don't scaffold files for future phases — PRD §16
  defines each phase's done-criteria.

## 11. Deploying (not done yet)

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project's environment variables.
   Vercel does not read `.env.local` from the repo.
3. Set `NEXT_PUBLIC_SITE_URL` to the deployed domain.
4. `main` → production, `dev` → preview.
5. Before going live, work through the PRD §17 launch checklist — especially
   replacing the demo seed data and confirming the service-role key is absent
   from the client bundle (`grep` the `.next` output).
