# CareerOptics Education Service — Product Requirements Document (PRD)

> **How to use this file:** save as `PRD.md` in repo root. Also copy §2, §6, §7, §16 into `CLAUDE.md` so Claude Code keeps them in context permanently. Build **one phase per session** (§16). Never ask Claude Code to "build the whole site" in one prompt.

---

## 1. Product Summary

| Field | Value |
|---|---|
| Product | CareerOptics Education Service |
| Tagline | *Your career. Our guidance.* |
| Type | College/University discovery + admission counselling lead-generation portal (India) |
| Model reference (features/IA) | pujaeducation.com |
| Model reference (UI/UX layout) | collegedunia.com homepage |
| Primary market | Bihar + pan-India students (10th, 12th, UG, PG) |
| Business goal | Capture student enquiries → counsellor follow-up → university admission commission |
| Languages | English (Hindi copy toggle = future phase) |

### Core value loop
Student lands via SEO/Ads → browses colleges/courses → triggers a lead form (Apply Now / Need Counselling / College Finder wizard) → lead lands in Supabase + WhatsApp/email alert → counsellor calls → admission.

### Success metrics (v1)
- Lead conversion rate on college detail page ≥ 6%
- College Finder wizard completion ≥ 45%
- LCP ≤ 2.5s mobile, Lighthouse Perf ≥ 90, SEO = 100
- 500+ college pages indexed within 60 days

---

## 2. Tech Stack (fixed — do not substitute)

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript, RSC by default) |
| Runtime/API | Node.js via Next Route Handlers + Server Actions (no separate Express server) |
| DB / Auth / Storage | Supabase (Postgres + RLS + Auth + Storage buckets) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Forms | react-hook-form + zod |
| State (client-lite) | nuqs for URL filter state; TanStack Query only in admin |
| Icons | lucide-react |
| Images | next/image + Supabase Storage (WebP) |
| Hosting | Vercel |
| Repo/CI | GitHub → Vercel auto-deploy (`main` = prod, `dev` = preview) |
| Analytics | Vercel Analytics + GTM (GA4, Meta Pixel) |
| Email | Resend |
| Rate limit | Upstash Redis (lead endpoints) |

**Supabase client rules**
- Browser: `@supabase/ssr` anon client — read-only public data.
- Server: service-role client **only** inside Route Handlers / Server Actions (`lib/supabase/admin.ts`). Never import into a client component.
- All lead writes go through `/api/leads` (service role + rate limit + honeypot). Anon insert is disabled by RLS.

---

## 3. Users & Roles

| Role | Access |
|---|---|
| Visitor (student/parent) | Public pages, submit forms |
| Counsellor | `/admin` → leads inbox, status update, notes |
| Content Editor | `/admin` → colleges, courses, blogs, banners |
| Super Admin | Everything + users + settings |

Auth: Supabase Auth (email+password) for `/admin` only. Public site has **no student login in v1** (deferred — see §18).

---

## 4. Information Architecture (routes)

```
/                                   Home (Collegedunia-style)
/colleges                           Listing + filters (stream, city, state, level, fee, NAAC, type)
/colleges/[slug]                    College detail (tabs: Overview/Courses&Fees/Placement/Facilities/Gallery/Reviews/FAQ)
/courses                            All courses grid by stream
/courses/[slug]                     Course detail (eligibility, fee range, career, top colleges)
/streams/[slug]                     Stream hub (Engineering/Management/Commerce/Arts/Medical/Science/Law/Agriculture/Design/Education)
/exams                              Exam listing
/exams/[slug]                       Exam detail (dates, pattern, eligibility, accepting colleges)
/city/[slug]                        Colleges in <City>
/after-10th | /after-12th | /after-graduation | /after-pg     Level hubs
/guides/[level]/[slug]              Career/course guide articles (replaces puja's /tenth/*, /twelve/*, /ug/*, /pg/*)
/college-finder                     6-step AI-assisted wizard → lead
/compare?ids=a,b,c                  Compare up to 3 colleges
/scholarships                       Scheme listing
/scholarships/bihar-student-credit-card
/placements                         Student placement showcase (testimonials)
/blogs  /blogs/[slug]
/news   /news/[slug]
/gallery
/press-release
/about  /contact  /help-support  /privacy-policy  /terms-and-conditions  /disclaimer
/search?q=                          Global search results
/admin/*                            Protected dashboard
```

### Route groups
```
app/
  (site)/     → public, uses SiteHeader/SiteFooter
  (admin)/    → /admin, AdminShell, middleware-protected
  api/        → route handlers
```

---

## 5. Page Specifications

### 5.1 Home `/` — section order (mirrors Collegedunia screenshot)

1. **Utility top bar** (desktop only, h-9): phone `+91-XXXXXXXXXX`, WhatsApp link, "Free Counselling" link. bg = Blue-900.
2. **Sticky header** (h-16, white, shadow on scroll):
   - Logo (left, 150×44)
   - "Select Goal & City" dual dropdown (orange text, exactly like screenshot)
   - Wide search input (placeholder: `Search for colleges, exams, courses and more..`)
   - Right: "Write a Review", "Explore" grid icon, notification bell, hamburger + avatar circle
3. **Course chip nav** (h-12, dark translucent over hero): `All Courses · B.Tech · MBA · M.Tech · MBBS · B.Com · B.Sc · B.Sc Nursing · BA · BBA · BCA` — right side: `Study Abroad · Course Finder [NEW]`
4. **Hero carousel** (h-[420px] desktop / h-[280px] mobile): full-bleed campus image + dark overlay 45%, centered H1 (`Find Your Right College in 2 Minutes`), centered white search bar with **red** Search button, secondary CTA pill **"Need Counselling"** (red), slide counter `1/3` bottom-right, credit label bottom-right.
5. **Select Your Study Goal** — horizontal scroll card row. Each card: icon circle, stream name, `N Colleges`, then 3–4 course links. Arrow button on right edge.
6. **Quick stats strip** — 4 counters (Colleges Listed / Students Guided / Universities Partnered / Cities).
7. **Top Universities** — carousel of college cards: image, name, location, NAAC grade, approvals chips, highest & average package, `Apply Now` (red, opens lead modal) + `Know More` (outline blue).
8. **College Finder CTA band** — blue gradient band, "Find a college in 2 minutes" → `/college-finder`.
9. **Courses by level tabs** — tabs `After 10th | After 12th | After UG | After PG`; each tab = 2 sub-tabs (Courses / Career) with link chips + side illustration. (Directly ported from reference site.)
10. **Top Exams** — 8 exam cards (name, date, level, "Check Details").
11. **Scholarship / Bihar Student Credit Card** — 2-col: rich text with Read More toggle + illustration.
12. **Placements Given By Us** — testimonial carousel: photo, name, company, package, course, city, university.
13. **Why We Are Best** — 6 bullet trust points + award image.
14. **Gallery** — 6-image masonry + "Show More".
15. **Press Release** — logo strip carousel (Hindustan, Prabhat Khabar, Dainik Bhaskar…).
16. **FAQ** — accordion, 6 items, emits `FAQPage` schema.
17. **Footer** — 4 columns (Company / Explore / Get Help / Follow Us) + office addresses block + Google Map embed + copyright.

**Floating/persistent UI**
- Bottom-right: pulsing "Counsellor Call" phone widget → opens callback modal.
- Bottom-left: WhatsApp FAB.
- Mobile: sticky bottom bar — `Call · WhatsApp · Apply Now`.
- Exit-intent (desktop) / 25s delay (mobile): **Quick Enquiry modal** — Name, Phone (+91 with country select IN/NP/BD), Select University, Select Course Type (UG/PG/Diploma), Course, Submit.

### 5.2 `/colleges` — Listing
- Left sidebar filters (desktop) / bottom-sheet (mobile): Stream, Course, State, City, College Type, NAAC Grade, Fee Range slider, Ownership, Approvals, Rating. All state in URL via `nuqs`.
- Sort: Popularity | Fee: Low→High | NIRF Rank | Rating.
- Card: logo, name, city, NAAC badge, fee/yr, rating, `Compare` checkbox, `Apply Now`, `Brochure`.
- SSR first 12 + infinite scroll (`?page=`), 24/page.
- Inline lead card injected after every 6th result ("Not sure which college? Get free counselling").

### 5.3 `/colleges/[slug]` — Detail (highest lead intent)
- Hero banner + logo overlay, name, location, established, NAAC, NIRF rank, approvals chips.
- Sticky action bar: `Apply Now` (red) · `Download Brochure` (gated by phone) · `Compare` · `Ask a Question`.
- Sticky tab nav (scroll-spy): Overview · Courses & Fees · Admission · Placement · Facilities · Gallery · Reviews · FAQ.
- Right rail (desktop, sticky): lead form card "Get Free Counselling" + similar colleges.
- Courses & Fees = table: Course · Duration · Eligibility · Fee/Year · Apply.
- Reviews: display approved only; submit form → `pending` status.
- ISR `revalidate = 3600`; `generateStaticParams` for `is_featured = true`.

### 5.4 `/college-finder` — 6-step wizard
Steps: 1 Current qualification → 2 Preferred stream → 3 Preferred course → 4 Budget range → 5 Preferred state/city → 6 Name + Phone + Email.
- Progress bar `Step n/6`, Previous/Next, validation toast `Please select an option to proceed.`
- Answers saved to `finder_sessions` on each step (anonymous `session_id` cookie) so partial funnels are recoverable.
- Final submit → matched college list + lead row with `source='college_finder'` and the answers jsonb attached.

### 5.5 `/admin`
- `/admin/leads` — table (date, name, phone, course, source, status, assigned), filters, status dropdown (`new → contacted → interested → visit_scheduled → admitted → dropped`), notes timeline, CSV export, click-to-call & WhatsApp deep links.
- `/admin/colleges` — CRUD + image upload + course mapping + publish toggle.
- `/admin/courses`, `/admin/exams`, `/admin/blogs`, `/admin/news`, `/admin/testimonials`, `/admin/gallery`, `/admin/press`, `/admin/banners`, `/admin/faqs`, `/admin/reviews` (approve/reject), `/admin/users`, `/admin/settings`.
- Dashboard: leads today/week/month, source split, top colleges by lead count.

---

## 6. Design System (derived from the CareerOptics logo)

### 6.1 Color tokens — `app/globals.css` `@theme`
```css
--color-brand-blue-900:#082C6B;  /* deep navy — headers, footer */
--color-brand-blue:#0B3B8C;      /* "Career" blue — primary */
--color-brand-blue-400:#3D6FD1;  /* hover / links */
--color-brand-blue-50:#EEF3FC;   /* tinted section bg */
--color-brand-red:#D01E26;       /* "Optics" red — primary CTA */
--color-brand-red-600:#A9151C;   /* CTA hover */
--color-brand-orange:#F26A21;    /* arrow accent — badges, "Select Goal", NEW tags */
--color-brand-amber:#FBBF24;     /* rating stars */
--color-ink:#0F172A;             /* headings */
--color-body:#475569;            /* body text */
--color-muted:#64748B;
--color-border:#E2E8F0;
--color-surface:#F8FAFC;
--color-success:#16A34A;
```
**Usage rules (non-negotiable, this is what makes it look like the logo):**
- Primary buttons/CTAs = `brand-red`. Secondary = outline `brand-blue`. Tertiary/links = `brand-blue-400`.
- Header/footer/nav = `brand-blue-900`. Never use red for large backgrounds — red is accent only (≤10% of any viewport).
- Orange **only** for: goal/city selector text, "NEW" pills, discount/urgency badges, active tab underline.
- Blue→red diagonal gradient (`linear-gradient(115deg,#0B3B8C 0%,#0B3B8C 45%,#D01E26 100%)`) is the **signature element** — use on the College Finder band and section heading underline swipes only. Nowhere else.
- Section headings get a 4px underline that fades blue→red, 56px wide, left-aligned.

### 6.2 Typography
- Display/headings: **Plus Jakarta Sans** 700/800 (matches the rounded, confident logo wordmark).
- Body/UI: **Inter** 400/500/600.
- Numbers/data (fees, packages, ranks): Inter `tabular-nums` 600.
- Scale: `h1 40/48 lg:56` · `h2 30/36` · `h3 22/28` · `body 15/24` · `small 13/20`.
- Load via `next/font/google`, `display:swap`, subset latin.

### 6.3 Layout & primitives
- Container `max-w-[1280px] px-4 lg:px-6`. Section padding `py-12 lg:py-16`.
- Radius: cards `rounded-xl`, buttons `rounded-lg`, chips/pills `rounded-full`.
- Shadow: `shadow-[0_1px_3px_rgba(15,23,42,.08)]`, hover `shadow-[0_8px_24px_rgba(11,59,140,.12)]` + `-translate-y-0.5`.
- Grid: 4 cols mobile / 8 tablet / 12 desktop, gap 16/24.
- Motion: 200ms `ease-out` only; carousels autoplay 5s pause-on-hover; respect `prefers-reduced-motion`.

### 6.4 Component inventory (build in this order)
`Button · Input · Select · Badge · Chip · Card · Tabs · Accordion · Dialog · Sheet · Carousel · Rating · Breadcrumb · Pagination · Skeleton · Toast`
then composites:
`SiteHeader · GoalCitySelector · MegaSearch · CourseChipNav · HeroCarousel · StudyGoalCards · StatsStrip · CollegeCard · CollegeCarousel · FilterSidebar · ExamCard · TestimonialCarousel · GalleryGrid · PressStrip · FaqAccordion · LeadForm · QuickEnquiryModal · CallbackWidget · WhatsAppFab · MobileStickyBar · SiteFooter`

### 6.5 Accessibility floor
Contrast ≥ 4.5:1 (white on `brand-red` = pass; never white on `brand-orange` for body text — use `ink`). Visible focus ring `ring-2 ring-brand-blue-400 ring-offset-2`. All carousels keyboard-navigable. All images have alt. Forms have labels, not just placeholders.

---

## 7. Database Schema (Supabase / Postgres)

`supabase/migrations/0001_init.sql`

```sql
create extension if not exists "pgcrypto";

create type level_enum      as enum ('after_10','after_12','ug','pg','diploma','doctorate','certificate');
create type college_type    as enum ('private','government','deemed','autonomous','state','central');
create type lead_status     as enum ('new','contacted','interested','visit_scheduled','admitted','dropped','junk');
create type content_status  as enum ('draft','published','archived');
create type user_role       as enum ('super_admin','editor','counsellor');

-- geo
create table states  (id uuid pk default gen_random_uuid(), name text not null, slug text unique not null);
create table cities  (id uuid pk default gen_random_uuid(), state_id uuid references states(id) on delete cascade,
                      name text not null, slug text unique not null);

-- taxonomy
create table streams (id uuid pk default gen_random_uuid(), name text not null, slug text unique not null,
                      icon text, description text, sort_order int default 0, is_featured bool default false);

create table courses (
  id uuid pk default gen_random_uuid(),
  name text not null, short_name text, slug text unique not null,
  stream_id uuid references streams(id), level level_enum not null,
  duration_months int, eligibility text, description text,
  avg_fee_min int, avg_fee_max int, career_scope text,
  is_featured bool default false, status content_status default 'published',
  meta_title text, meta_description text,
  created_at timestamptz default now()
);

create table colleges (
  id uuid pk default gen_random_uuid(),
  name text not null, slug text unique not null, short_name text,
  city_id uuid references cities(id), address text,
  type college_type, established_year int,
  naac_grade text, nirf_rank int, approvals text[],           -- {UGC,AICTE,NCTE,PCI,BCI,NBA,AIU}
  logo_url text, cover_url text, brochure_url text,
  highest_package bigint, average_package bigint,
  total_students int, campus_size text, facilities text[],
  about text, admission_process text, why_choose text,
  rating numeric(2,1) default 0, review_count int default 0,
  lat numeric, lng numeric, website text,
  is_featured bool default false, status content_status default 'published',
  meta_title text, meta_description text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index on colleges (city_id); create index on colleges (status, is_featured);
create index colleges_name_trgm on colleges using gin (name gin_trgm_ops);

create table college_courses (
  id uuid pk default gen_random_uuid(),
  college_id uuid references colleges(id) on delete cascade,
  course_id  uuid references courses(id)  on delete cascade,
  fee_per_year int, total_fee int, duration_months int, seats int, eligibility text,
  unique (college_id, course_id)
);

create table college_gallery (id uuid pk default gen_random_uuid(),
  college_id uuid references colleges(id) on delete cascade, image_url text, caption text, sort_order int default 0);

create table exams (
  id uuid pk default gen_random_uuid(), name text not null, slug text unique not null,
  conducting_body text, level level_enum, mode text, exam_date date,
  application_start date, application_end date,
  eligibility text, pattern text, syllabus text, official_url text,
  status content_status default 'published', meta_title text, meta_description text
);
create table exam_courses (exam_id uuid references exams(id) on delete cascade,
                           course_id uuid references courses(id) on delete cascade, primary key (exam_id,course_id));

-- lead engine
create table leads (
  id uuid pk default gen_random_uuid(),
  name text not null, phone text not null, email text, city text,
  country_code text default '+91',
  level level_enum, course_id uuid references courses(id), college_id uuid references colleges(id),
  message text,
  source text not null,            -- home_hero | quick_enquiry | college_detail | college_finder | brochure | callback | contact | apply_now
  page_url text, utm_source text, utm_medium text, utm_campaign text, utm_content text,
  status lead_status default 'new',
  assigned_to uuid references auth.users(id),
  answers jsonb,                   -- college finder payload
  ip inet, user_agent text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index on leads (created_at desc); create index on leads (status); create index on leads (phone);

create table lead_activities (id uuid pk default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade, user_id uuid references auth.users(id),
  action text, note text, created_at timestamptz default now());

create table finder_sessions (id uuid pk default gen_random_uuid(), session_id text, step int,
  answers jsonb, lead_id uuid references leads(id), created_at timestamptz default now());

-- content
create table blogs (id uuid pk default gen_random_uuid(), title text, slug text unique, excerpt text,
  content text, cover_url text, category text, tags text[], author text, read_minutes int,
  published_at timestamptz, status content_status default 'draft', meta_title text, meta_description text);
create table news       (like blogs including all);
create table guides     (id uuid pk default gen_random_uuid(), title text, slug text unique, level level_enum,
                         content text, cover_url text, status content_status default 'published',
                         meta_title text, meta_description text);
create table testimonials(id uuid pk default gen_random_uuid(), student_name text, photo_url text, company text,
                         package_lpa numeric, course text, city text, college_id uuid references colleges(id),
                         quote text, sort_order int default 0, is_active bool default true);
create table gallery     (id uuid pk default gen_random_uuid(), image_url text, caption text, event_date date, sort_order int);
create table press_releases(id uuid pk default gen_random_uuid(), publication text, image_url text, article_url text, published_on date);
create table banners     (id uuid pk default gen_random_uuid(), title text, image_url text, image_mobile_url text,
                         cta_text text, cta_url text, sort_order int, is_active bool default true);
create table faqs        (id uuid pk default gen_random_uuid(), question text, answer text, scope text default 'home',
                         ref_id uuid, sort_order int);
create table reviews     (id uuid pk default gen_random_uuid(), college_id uuid references colleges(id) on delete cascade,
                         name text, email text, course text, rating int check (rating between 1 and 5),
                         title text, body text, is_approved bool default false, created_at timestamptz default now());
create table scholarships(id uuid pk default gen_random_uuid(), title text, slug text unique, state text,
                         content text, image_url text, status content_status default 'published',
                         meta_title text, meta_description text);
create table profiles    (id uuid pk references auth.users(id) on delete cascade, full_name text,
                         role user_role default 'counsellor', phone text, is_active bool default true);
create table settings    (key text primary key, value jsonb);
```

### RLS policy rules
```sql
alter table <every table> enable row level security;

-- public content: SELECT for anon where status='published' (or is_active/is_approved)
create policy "public read" on colleges for select to anon, authenticated using (status='published');
-- repeat pattern for courses, streams, exams, blogs, news, guides, testimonials, gallery,
-- press_releases, banners, faqs, scholarships, states, cities, college_courses, college_gallery
create policy "public read approved" on reviews for select to anon using (is_approved = true);

-- leads / finder_sessions / lead_activities / profiles / settings: NO anon policy at all.
-- Writes happen only via service-role key in /api/*. Admin reads:
create policy "staff read leads" on leads for select to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_active));
create policy "staff update leads" on leads for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_active));
```

Storage buckets (public read, service-role write): `colleges`, `banners`, `gallery`, `blogs`, `testimonials`, `press`, `brochures`.

---

## 8. API Surface

| Route | Method | Purpose |
|---|---|---|
| `/api/leads` | POST | Create lead. zod validate → honeypot check → Upstash rate limit (5/10min/IP) → insert (service role) → Resend email to counsellors → WhatsApp deep-link payload logged. Returns `{ok:true,id}` |
| `/api/finder/step` | POST | Upsert `finder_sessions` per step |
| `/api/search` | GET | `?q=` → colleges+courses+exams, trigram search, limit 8 each |
| `/api/reviews` | POST | Insert `is_approved=false` |
| `/api/brochure` | POST | Store lead, return signed brochure URL (60s TTL) |
| `/api/revalidate` | POST | Secret-guarded `revalidatePath` after admin publish |
| `/api/og/[slug]` | GET | Dynamic OG image (`next/og`) for college pages |

**Server Actions** used for all `/admin` mutations (they run server-side with the session's JWT; RLS enforces role).

Shared zod schema `lib/validations/lead.ts`:
```ts
phone: z.string().regex(/^[6-9]\d{9}$/)   // Indian mobile, strip +91 client-side
name:  z.string().min(2).max(60)
email: z.string().email().optional().or(z.literal(''))
hp:    z.string().max(0)                  // honeypot must be empty
```

---

## 9. Lead Routing & Notifications
1. Insert row.
2. Resend email → `leads@careeroptics.in` with all fields + page URL + UTM.
3. Optional (env-gated) WhatsApp Cloud API template message to the counsellor number.
4. Client-side: `gtag('event','generate_lead')` + Meta Pixel `Lead`.
5. Thank-you state: inline success card + WhatsApp CTA (`https://wa.me/91XXXXXXXXXX?text=...`). No page redirect (keeps SPA feel + preserves the pixel event).
6. Duplicate handling: same phone within 24h → still insert, but flag `answers.duplicate_of` so counsellors don't double-dial.

---

## 10. SEO Requirements
- `generateMetadata` on every dynamic route from DB `meta_title`/`meta_description`; fall back to templated string (`{College} - Courses, Fees, Admission 2026 | CareerOptics`).
- JSON-LD: `Organization` + `WebSite`+`SearchAction` (root layout), `CollegeOrOrganization` + `AggregateRating` (college), `Course` (course), `Article` (blog/news), `FAQPage`, `BreadcrumbList`.
- `app/sitemap.ts` — dynamic, chunked (`sitemap/[id]`) if > 5k URLs. `app/robots.ts`.
- Canonical on every page. Filter/sort URLs → `noindex,follow`.
- Slugs are immutable; renames create a 301 in `next.config.ts` redirects table.
- ISR: colleges/courses/exams `revalidate=3600`; blogs `revalidate=600`; home `revalidate=300`.

---

## 11. Performance Budget
- JS on home ≤ 180KB gzipped. Hero image `priority`, everything else lazy.
- Carousels, modals, filter sheet = `dynamic(() => …, {ssr:false})`.
- Listing pages: RSC data fetch, no client fetch waterfall.
- All images WebP via Supabase transform; `sizes` set on every `next/image`.
- Fonts: 2 families max, self-hosted through `next/font`.

---

## 12. Environment Variables
```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
LEAD_NOTIFY_EMAILS=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REVALIDATE_SECRET=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_PHONE=
WHATSAPP_TOKEN=          # optional
WHATSAPP_PHONE_ID=       # optional
```

---

## 13. Folder Structure
```
src/
  app/
    (site)/ layout.tsx page.tsx colleges/ courses/ streams/ exams/ city/
            guides/ college-finder/ compare/ scholarships/ blogs/ news/
            gallery/ press-release/ placements/ about/ contact/ search/
    (admin)/admin/ layout.tsx page.tsx leads/ colleges/ courses/ exams/
            blogs/ news/ testimonials/ gallery/ press/ banners/ faqs/
            reviews/ users/ settings/
    api/ leads/ finder/ search/ reviews/ brochure/ revalidate/ og/
    globals.css sitemap.ts robots.ts
  components/ ui/ site/ home/ college/ forms/ admin/ shared/
  lib/ supabase/{client,server,admin}.ts  validations/  queries/  utils/  seo/
  types/ database.types.ts        # generated: supabase gen types typescript
  config/ site.ts nav.ts filters.ts
supabase/migrations/  supabase/seed.sql
middleware.ts
```

**Conventions:** Server Components by default; `'use client'` only for interactive leaves. All DB reads live in `lib/queries/*.ts` (typed, reusable) — pages never call Supabase inline. One component per file, named export.

---

## 14. Seed Data (v1 minimum)
36 states/UTs · 120 cities · 10 streams · 60 courses · 25 colleges (full detail, from partner list) · 12 exams · 8 testimonials · 6 home FAQs · 3 hero banners · 1 scholarship page (Bihar Student Credit Card) · 6 gallery images · 4 press items.

---

## 15. Non-Functional
- Mobile-first (85% of traffic will be Android, 3G/4G).
- Uptime via Vercel; DB backups = Supabase daily.
- No PII in client bundle or logs. Phone numbers masked in admin exports for `counsellor` role.
- Cookie consent banner (GTM gated) — required for Meta Pixel.
- Legal pages live before launch.

---

## 16. Build Phases (one Claude Code session each — this is the token-efficiency plan)

| P | Scope | Done when |
|---|---|---|
| **P0** | `create-next-app` TS+Tailwind, shadcn init, Supabase project, env, GitHub repo, Vercel link, fonts, color tokens in `globals.css`, `config/site.ts` | `pnpm dev` renders a styled placeholder home; deploy preview green |
| **P1** | `0001_init.sql` migration + RLS + storage buckets + `seed.sql` + `database.types.ts` | Supabase tables visible, seed rows queryable from a test page |
| **P2** | Design system: all §6.4 primitives + `SiteHeader`, `CourseChipNav`, `SiteFooter`, `MobileStickyBar`, `WhatsAppFab` | `/style-guide` page shows every component in brand colors |
| **P3** | Home sections 4–17 with real DB data | Home matches the Collegedunia layout, Lighthouse ≥ 90 |
| **P4** | Lead engine: `LeadForm`, `QuickEnquiryModal`, `CallbackWidget`, `/api/leads`, Resend, rate limit, GTM events | Submitting from 3 different entry points creates 3 rows with correct `source` |
| **P5** | `/colleges` listing + filters + sort + pagination + compare | URL-driven filters, SSR results, mobile filter sheet works |
| **P6** | `/colleges/[slug]` full detail with tabs + right-rail form + reviews + brochure gate | ISR page, JSON-LD validates in Rich Results Test |
| **P7** | `/courses`, `/streams`, `/exams`, `/city`, level hubs, `/guides` | All taxonomy pages rendering + interlinked |
| **P8** | `/college-finder` 6-step wizard + `/api/finder/step` | Partial sessions saved, final submit creates lead with `answers` |
| **P9** | Blogs, news, gallery, press, placements, scholarships, static pages, global search | Content sections live |
| **P10** | `/admin`: auth + middleware + leads inbox + all CRUD + dashboard | Counsellor can log in, filter leads, update status, add note |
| **P11** | SEO pass (sitemap, robots, OG images, redirects), perf pass, a11y pass, cookie consent, 404/500 | Lighthouse SEO 100, Perf ≥ 90 mobile |
| **P12** | Domain, DNS, GA4/GTM live, Search Console, backup + launch checklist | Production live on careeroptics domain |

### Rules for Claude Code (paste into `CLAUDE.md`)
1. Read `PRD.md` §2, §6, §7 before any task. Do not re-derive decisions already written here.
2. Work only on the current phase. Do not scaffold future-phase files.
3. Never edit `supabase/migrations/*` after apply — add a new numbered migration.
4. All colors/spacing/radius from tokens. **No raw hex in components.**
5. All DB access through `lib/queries/`. All input through zod in `lib/validations/`.
6. Before creating a component, check `components/ui` — reuse, don't duplicate.
7. After each phase: `pnpm build` must pass with zero TS errors, then commit `feat(pN): <scope>` and push.
8. Keep replies short; output code, not explanation.

---

## 17. Launch Checklist
- [ ] 25 college pages fully populated with images + brochures
- [ ] Lead email + WhatsApp alerts tested end-to-end on production
- [ ] All CTAs point to a working form (zero dead `#` links)
- [ ] Mobile sticky bar + call/WhatsApp tested on real Android
- [ ] GA4 `generate_lead` firing; Meta Pixel verified in Events Manager
- [ ] Sitemap submitted; Search Console verified; GMB/site NAP consistent
- [ ] Legal pages + cookie consent live
- [ ] Admin users created with correct roles; service-role key not exposed in any client bundle (`grep` the `.next` output)

## 18. Out of Scope (v2+)
Student login/dashboard & application tracking · psychometric test tool · associate/franchise portal + commission calculator · Hindi i18n · study-abroad module · CRM two-way sync with the existing DCW system · payment gateway for application fees · AI chat counsellor.
