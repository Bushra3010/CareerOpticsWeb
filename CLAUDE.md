# CareerOptics — working rules for Claude Code

Full spec: [`PRD.md`](PRD.md). This file mirrors PRD §2, §6, §7 and §16 so they stay in context.

## Rules (PRD §16)

1. Read `PRD.md` §2, §6, §7 before any task. Do not re-derive decisions already written there.
2. Work only on the current phase. Do not scaffold future-phase files.
3. Never edit `supabase/migrations/*` after apply — add a new numbered migration.
4. All colors/spacing/radius from tokens. **No raw hex in components.**
5. All DB access through `lib/queries/`. All input through zod in `lib/validations/`.
6. Before creating a component, check `components/ui` — reuse, don't duplicate.
7. After each phase: `pnpm build` must pass with zero TS errors, then commit `feat(pN): <scope>` and push.
8. Keep replies short; output code, not explanation.

**Conventions (§13):** Server Components by default; `'use client'` only on interactive leaves. One component per file, named export. Pages never call Supabase inline.

## Current status

- **P0 — done.** Next.js 15 + TS + Tailwind v4 + shadcn/ui, Plus Jakarta Sans + Inter, brand tokens in `src/app/globals.css`, `src/config/site.ts`, `.env.example`, `(site)` route group with a placeholder home.
- **P1 — next.** `supabase/migrations/0001_init.sql` + RLS + storage buckets + `seed.sql` + `src/types/database.types.ts`.

## §2 Tech stack (fixed — do not substitute)

| Layer            | Choice                                                    |
| ---------------- | --------------------------------------------------------- |
| Framework        | Next.js 15 (App Router, TypeScript, RSC by default)       |
| Runtime/API      | Next Route Handlers + Server Actions (no Express)         |
| DB/Auth/Storage  | Supabase (Postgres + RLS + Auth + Storage)                |
| Styling          | Tailwind CSS v4 + shadcn/ui                               |
| Forms            | react-hook-form + zod                                     |
| Client state     | nuqs for URL filter state; TanStack Query only in admin   |
| Icons            | lucide-react                                              |
| Images           | next/image + Supabase Storage (WebP)                      |
| Hosting          | Vercel (`main` = prod, `dev` = preview)                   |
| Analytics        | Vercel Analytics + GTM (GA4, Meta Pixel)                  |
| Email            | Resend                                                    |
| Rate limit       | Upstash Redis (lead endpoints)                            |
| Package manager  | pnpm                                                      |

**Supabase client rules**

- Browser: `@supabase/ssr` anon client — read-only public data.
- Server: service-role client **only** inside Route Handlers / Server Actions (`lib/supabase/admin.ts`). Never import into a client component.
- All lead writes go through `/api/leads` (service role + rate limit + honeypot). Anon insert is disabled by RLS.

## §6 Design system

Tokens live in `src/app/globals.css`. Use the utility, never the hex.

| Token                    | Value     | Use                                       |
| ------------------------ | --------- | ----------------------------------------- |
| `brand-blue-900`         | `#082C6B` | header, footer, nav                       |
| `brand-blue`             | `#0B3B8C` | primary blue                              |
| `brand-blue-400`         | `#3D6FD1` | hover / links / focus ring                |
| `brand-blue-50`          | `#EEF3FC` | tinted section background                 |
| `brand-red`              | `#D01E26` | primary CTA (`bg-primary` too)            |
| `brand-red-600`          | `#A9151C` | CTA hover                                 |
| `brand-orange`           | `#F26A21` | goal/city text, NEW pills, active tab      |
| `brand-amber`            | `#FBBF24` | rating stars                              |
| `ink` / `body` / `muted-foreground` | `#0F172A` / `#475569` / `#64748B` | headings / body / de-emphasised |
| `surface`                | `#F8FAFC` | section background                        |
| `success`                | `#16A34A` | positive state                            |
| `border` (shadcn)        | `#E2E8F0` | all borders — `border-border`             |

**Usage rules (non-negotiable):**

- Primary buttons/CTAs = `brand-red`. Secondary = outline `brand-blue`. Links = `brand-blue-400`.
- Header/footer/nav = `brand-blue-900`. Red is accent only — ≤10% of any viewport, never a large background.
- Orange **only** for: goal/city selector text, "NEW" pills, urgency badges, active tab underline.
- `bg-brand-gradient` (blue→red 115°) is the signature element — College Finder band only.
- `heading-underline` puts the 56×4px blue→red swipe under section headings.
- Never white text on `brand-orange` — use `text-ink`.

**Type:** `font-display` (Plus Jakarta Sans 700/800) for headings, `font-sans` (Inter 400/500/600) for body. Sizes: `text-h1` (40/48) `lg:text-h1-lg` (56/60) · `text-h2` (30/36) · `text-h3` (22/28) · `text-base` (15/24) · `text-sm` (13/20). Fees/packages/ranks use `tabular-nums`.

**Layout:** `container-site` (max-w-1280, px-4 lg:px-6). Section padding `py-12 lg:py-16`. Cards `rounded-xl`, buttons `rounded-lg`, chips `rounded-full`. Elevation `shadow-card` → `card-lift` on hover. Motion 200ms ease-out only; `prefers-reduced-motion` is already handled globally.

**Component build order (§6.4):** `Button · Input · Select · Badge · Chip · Card · Tabs · Accordion · Dialog · Sheet · Carousel · Rating · Breadcrumb · Pagination · Skeleton · Toast`, then composites `SiteHeader · GoalCitySelector · MegaSearch · CourseChipNav · HeroCarousel · StudyGoalCards · StatsStrip · CollegeCard · CollegeCarousel · FilterSidebar · ExamCard · TestimonialCarousel · GalleryGrid · PressStrip · FaqAccordion · LeadForm · QuickEnquiryModal · CallbackWidget · WhatsAppFab · MobileStickyBar · SiteFooter`.

**A11y floor:** contrast ≥ 4.5:1, visible focus ring `ring-2 ring-brand-blue-400 ring-offset-2`, keyboard-navigable carousels, alt on every image, real labels on every field.

## §7 Database

Schema, enums and RLS policies are specified verbatim in `PRD.md` §7 — implement them there, do not restate. Key points:

- Enums: `level_enum`, `college_type`, `lead_status`, `content_status`, `user_role`.
- Public tables get `select` policies for `anon` gated on `status='published'` (or `is_active` / `is_approved`).
- `leads`, `finder_sessions`, `lead_activities`, `profiles`, `settings` get **no anon policy at all** — writes only via service role in `/api/*`.
- Storage buckets (public read, service-role write): `colleges`, `banners`, `gallery`, `blogs`, `testimonials`, `press`, `brochures`.
- Types are generated: `supabase gen types typescript` → `src/types/database.types.ts`.

## §16 Phases

`P0` foundation → `P1` DB → `P2` design system → `P3` home → `P4` lead engine → `P5` listing → `P6` college detail → `P7` taxonomy pages → `P8` college finder → `P9` content + search → `P10` admin → `P11` SEO/perf/a11y → `P12` launch. One phase per session; see `PRD.md` §16 for each phase's done-criteria.

## Commands

```bash
pnpm dev     # dev server (turbopack)
pnpm build   # must pass with zero TS errors before every commit
pnpm lint
```
