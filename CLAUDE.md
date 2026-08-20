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
- **P1 — done (not yet applied to a live project).** Migrations `0001_init` / `0002_rls` / `0003_storage`, `supabase/seed.sql`, `src/types/database.types.ts`, the three Supabase clients, and `/db-check`. Verified with `pnpm db:verify`. Still to do on your side: create the Supabase project, `pnpm supabase link`, `pnpm db:push`, then regenerate types with `pnpm db:types`.
- **P2 — done.** Every §6.4 primitive in `components/ui`, site chrome in `components/site`, mounted in the `(site)` layout, all shown on `/style-guide`.
- **P3 — done.** Home sections 3–16 of §5.1 with live DB data, `lib/queries/home.ts`, `components/home/*`, `CollegeCard`, `FAQPage` JSON-LD, `revalidate = 300`. Home builds static at **161 kB** First Load JS (§11 budget 180 kB). `/db-check` deleted.
- **P4 — done.** `/api/leads` (zod → honeypot → rate limit → service-role insert → notify), `LeadForm`, `LeadDialog`, `QuickEnquiryModal`, `CallbackWidget`, Resend alerts, GTM/Pixel hooks. Verified: `home_hero`, `callback` and `apply_now` each create a row with the right `source`; `apply_now` carries `college_id`; a repeat phone inside 24h gets `answers.duplicate_of`. Home 162 kB First Load JS.
- **P5 — done.** `/colleges` with 10 URL-driven filters (nuqs), 4 sorts, 24/page pagination, mobile filter sheet, inline lead card every 6th result, and `/compare?ids=`. Verified against the live DB: engineering 14, Bihar 10, Patna 6, fee≤₹1L 8, engineering+Bihar 4.
- **P6 — done.** `/colleges/[slug]` with hero, action bar, scroll-spy tabs, Courses & Fees table, reviews + submission, sticky right rail, `/api/reviews`, `/api/brochure`, ISR `revalidate = 3600` with 15 featured slugs prerendered, and `CollegeOrUniversity` + `BreadcrumbList` JSON-LD. **Found and fixed a live rating-wipe bug — see below.**
- **P7 — done.** `/courses`, `/courses/[slug]`, `/streams/[slug]`, `/exams`, `/exams/[slug]`, `/city/[slug]`, the four level hubs and `/guides/[level]/[slug]`. ~119 pages prerendered at 137 kB each. Crawled the whole site: every remaining 404 belongs to P8/P9.
- **P8 — done.** `/college-finder` 6-step wizard, `/api/finder/step`, matched-college result view. Verified: a partial funnel lands in `finder_sessions` with no `lead_id`; the final submit creates a lead with `source='college_finder'` and the six answers as jsonb, and links the session to it.
- **P9 — done.** `/search` + `/api/search`, `/blogs`, `/news`, `/gallery`, `/press-release`, `/placements`, `/scholarships`, and the static/legal pages. **Crawled the whole site: 147 internal URLs, zero dead links.**
- **P10 — done.** Supabase Auth + middleware gate, role-gated admin shell, dashboard, leads inbox (filters, status, notes, CSV with phone masking), review moderation, and **full CRUD with image upload** across all eleven content tables.
- **P11 — done.** Sitemap (147 URLs), robots, dynamic OG images, Organization/WebSite JSON-LD, redirects + security headers, 404/500, cookie consent, and a perf pass that took `/colleges` from 196 to **163 kB** and `/contact` from 267 to **151 kB**. Every route is inside the 180 kB §11 budget.
- **CRM phase 1 — done.** dcwcrm merged into a separate `crm` schema: leads pipeline,
  students, payments, CSV bulk import. **Both migrations still need applying by hand —
  see the CRM section below.**
- **P12 — next.** Domain, DNS, GA4/GTM live, Search Console, backup, launch checklist.

`/style-guide` is temporary scaffolding — keep it as long as it's useful, it's `noindex`.

### P3 notes worth carrying forward

- The §11 layout debt is fixed: the mobile-nav Sheet and the sonner Toaster are both behind `dynamic(…, {ssr:false})` (`site/mobile-nav-sheet.tsx`, `site/deferred-toaster.tsx`). Keep new modals on that pattern.
- Public content reads go through `lib/supabase/public.ts` (anon, **no cookie binding**) so pages stay statically renderable. `server.ts` reads cookies and forces dynamic rendering — use it only when the query depends on the session.
- `lib/media.ts#imageSrc` maps the `/seed/...` paths in `seed.sql` to `null`, so sections fall back to branded placeholders instead of broken images. Real Storage URLs render with no code change.
- The stats strip counts only real rows (colleges/courses/exams/cities). §5.1's "Students Guided" counter is deliberately absent — there is no verified figure and inventing one is the trust problem flagged in `seed.sql`. The same reasoning rules out "Students Helped" and "Success Rate": a design comp asked for both and they were left out rather than invented.
- **`--color-stream-*` is a scoped extension of §6.1, for the study-goal cards only.** Colour-coding nine streams cannot be done with the brand palette: `brand-orange` (3.0:1), `success` (3.3:1) and `brand-amber` (1.8:1) all fail the §6.5 4.5:1 floor for small text on white, and spreading `brand-red` across nine cards would break "red is ≤10% of any viewport". Five accents rotate so no two neighbours match, and every text shade clears 4.5:1. Do not use these tokens anywhere else.
- `Section` takes optional `titleAccent` (trailing words in `brand-blue-400`) and `actionStyle="button"` (raised white pill instead of a text link). Both default off, so the other twelve sections are untouched.
- `ScrollRow` takes optional `dots`. They are `aria-hidden` on purpose — the rail itself is already keyboard-reachable, so exposing them would duplicate the same navigation to assistive tech.
- **Mobile home is a distinct layout, not just a reflow.** Below `lg` the page leads with `MobileQuickStart` (heading, search, `GoalCitySelector`) then a rounded-card hero, then `MobileExplore`; study goals become a 2-col list and Top Universities become list rows. Each pair is `lg:hidden` / `hidden lg:block`, so both variants ship in the HTML — that is deliberate (no JS breakpoint switching) but it is why the page HTML grew.
- `GoalCitySelector` (§6.4, finally built) uses native `<select>` for the same reason the P11 filter panel does: works pre-hydration, gives Android its own picker, near-zero bundle. Choosing either option routes to `/colleges?stream=&city=`. City options are restricted to cities that actually have a published college — 18 of 120 — so a pick never lands on an empty result page.
- **The course chip bar is `hidden lg:block`.** It stays in the HTML for crawlers, but on a phone it pushed the search below the fold and `MobileExplore` covers the same destinations.
- **The mobile bottom bar is a 5-tab nav** (Home · Colleges · Courses · Counselling · Profile), replacing the old Call · WhatsApp · Apply trio. Conversion is preserved by making **Counselling** the accent tab: it opens `LeadDialog` rather than routing. **Profile** opens the nav drawer — there is no student login in v1 (§3, deferred to §18) — and Call and WhatsApp both live in that drawer now.
- The mobile header is Logo · bell · account. The bell links to `/news` and carries **no unread dot**: there is no notification system, and a badge that never clears is a false signal on a page asking for a phone number. `MobileMenuProvider` holds the drawer state so the header button and the Profile tab open the same sheet, still lazily loaded on first open.
- `MobileTabBar` is a client component in the `(site)` layout, so it counts against **every** route. Home is now 178 kB of the 180 kB §11 budget — roughly 2 kB spare. `/style-guide` is 212 kB but is internal `noindex` scaffolding, not a public route.
- **Home is 178 kB First Load JS, not the 161 kB recorded above** — that figure predates the P4–P11 shared code. Measured against a clean worktree build of the previous commit, so 176 kB is the real baseline. Only ~4 kB of headroom against the §11 budget.

- **The home hero is image-only**: no heading, no search bar, no scrim and no buttons — just the banner photo. The primary CTA moved to the navbar: the desktop header already had "Need Counselling", and the mobile header gained a compact "Counselling" button beside the bell. The bottom bar's Counselling tab stays as the thumb-reachable duplicate. Per-slide banner CTAs (`cta_text`/`cta_url`) are no longer rendered — those destinations are still reachable from the chip nav, `MobileExplore`, the College Finder band and the footer. The banner title survives as an `sr-only` h1 — a home page with no h1 would be an SEO regression — and each slide carries `aria-label={banner.title}` so it stays identifiable without visible text. Search now lives only in the header (desktop) and `MobileQuickStart` (phones).
- **Removing the scrim cost the CTAs their edge.** Measured on the three banners, a white button sits at 1.5–2.0:1 against the photo, under the 3:1 SC 1.4.11 needs for a UI component boundary. `shadow-on-photo` restores the edge without tinting the image — use it on any control placed directly on a photo.
- The gallery caption gradient (`from-brand-blue-900/85`) is **not** decorative and was kept: white caption text sits on it.

### P4 notes worth carrying forward

- **Every lead CTA goes through `LeadDialog`.** Wrap any single element; it clones the trigger with Radix `Slot` and fetches the dialog + form on first click, which is why the whole lead engine cost ~1 kB of First Load JS. Do not import `LeadForm` directly into a page unless the form is meant to be visible on load.
- **The honeypot deviates from §8 deliberately.** §8 writes `hp: z.string().max(0)`, but rejecting it returns a field error naming `hp` and tells a bot which input is the trap. The schema accepts the field and `/api/leads` drops a filled one with a silent 200 instead. Documented in `lib/validations/lead.ts`.
- **Rate limiting falls back to memory.** `UPSTASH_*` is still empty, so `lib/rate-limit.ts` uses a per-instance limiter. It resets on deploy and does not span serverless instances — set the Upstash vars before launch or the 5/10min rule is advisory in production.
- **Notifications never fail a saved lead.** Resend and the WhatsApp deep link are env-gated and return a status the route records; they never throw. `RESEND_API_KEY`/`LEAD_NOTIFY_EMAILS` are unset, so alerts currently only log.
- **`trackLead` is a no-op today.** GTM and the Meta Pixel are not installed until P12; the call sites are already in place.
- Sources in use: `home_hero` (hero pill), `contact` (header CTA), `callback` (widget), `quick_enquiry` (exit-intent / 25s modal), `apply_now` (college cards + mobile sticky bar), `college_detail` (inline listing lead card), `brochure` (listing, once a college has a `brochure_url`). `college_finder` lands in P8.

- **"Apply" opens the counsellors' admission form; "Counselling" keeps the short form.** `LeadField` gained `"admission"`, which renders the paper form's fields — father's name and occupation, DOB, parent's mobile, village/post/district/state, class, roll code, roll no, category. All four Apply entry points use it (courses table, action bar, college card, list card); Ask a Question, Get Free Counselling and the brochure gate are unchanged.
- **The admission fields are not columns.** They are folded into the existing `answers` jsonb by `LeadForm` before posting, so there is no migration, no change to `/api/leads`, and the admin lead detail already renders them (its heading is now "Submitted details", not "College Finder answers"). Verified end to end: all twelve keys round-trip into the row.
- **Every admission field is optional.** Name and mobile stay the only required inputs — the rest is what a counsellor would otherwise write down on the call, and making it mandatory would cost applications on a page whose §1 target is ≥6% conversion.
- **The applicant photo goes to a PRIVATE bucket.** `applicant-photos` (migration `0005`) is the first bucket with no anon or authenticated policy at all — every other bucket except `brochures` is public-read, and a student's photograph next to their name, DOB, address and category must not be world-readable. Uploads go through `POST /api/upload/photo`; the admin mints a 5-minute signed URL to view one. Verified: anon public-read, direct GET and sign-request all return 400.
- **`/api/upload/photo` is the only public upload endpoint on the site.** It has no staff check to lean on, so: its own rate-limit budget (`limitUploads`, 12/10min — separate from `limitLeads` so photo retries cannot exhaust a student's ability to submit), a 5 MB cap, a generated filename, and the type sniffed from the file's **leading bytes** rather than its MIME header or extension. Verified an SVG renamed to `.jpg` with `Content-Type: image/jpeg` is rejected.
- `answers.photo_path` holds a storage path, never a URL — there is no public URL to hold.

- **`category` is caste/reservation data.** That is sensitive personal data under the DPDP Act 2023, which `/privacy-policy` does not yet address (it is still the unreviewed draft flagged in P9). Keep it optional, and get the policy reviewed before this form takes real traffic.

### P5 notes worth carrying forward

- **Filter state is nuqs, compare state is localStorage.** Filters belong in the URL (§5.2 — shareable, back-button correct, SSR). The compare selection does not: it has to survive filtering and paging, and would collide with the filter params. See `components/college/compare-provider.tsx`.
- **`listColleges` runs two queries on purpose.** "Fee: Low to High" sorts on the cheapest `college_courses.fee_per_year`, a child aggregate PostgREST cannot order a parent by. Query one fetches a narrow row per match (sort keys + course fees), sorting and paging happen in JS, query two fetches full rows for the 24 ids on the page. Capped at `MAX_LISTING_ROWS = 500` and the cap is surfaced in the UI, never silent. **Move the fee aggregate into a database view before the catalogue passes 500.**
- **Pagination, not infinite scroll.** §5.2 asks for infinite scroll; §11 rules out a client fetch waterfall on listing pages, and paged URLs are crawlable and back-button correct on 3G Android. 24/page is unchanged. Documented at the top of `app/(site)/colleges/page.tsx`.
- **Ownership is derived, not a column.** §5.2 lists Ownership and College Type separately but the schema has one `type` enum, so Ownership is the coarse grouping over it (`config/filters.ts`). Unknown enum values from a hand-edited URL are dropped in `resolveTypes` — Postgres 500s on an unknown enum member otherwise.
- **"Popularity" is a proxy.** There is no popularity column; it sorts featured first, then review count, then rating.
- **The nuqs adapter is mounted on `app/(site)/colleges/layout.tsx`, not the root layout.** Keeping it out of the shared chunk is worth ~6 kB on every other route.

### P6 notes worth carrying forward

- **🔴 `0004_review_rating_guard.sql` must be applied to the live project by hand.** The 0001 trigger recomputed `colleges.rating` on *every* review write, so the first **pending** review on a college averaged over zero approved rows and set the rating to 0. Because `/api/reviews` is public, any visitor could zero every rating on the site. Reproduced against the live database during P6, fixed by a guard in the function body, and covered by a `db:verify` regression. `supabase migration repair` still has not been run, so `db push` will not apply it — paste the file into the Supabase SQL Editor.
- **Two dynamic imports keep the detail page inside budget.** The right-rail `LeadForm` and the review form pull react-hook-form + zod (~45 kB); loading both behind `dynamic(…, {ssr:false})` took the page from **264 kB to 155 kB**. The rail form still appears without a click, behind a matching skeleton. Do not import `LeadForm` eagerly into a page.
- **`CollegeHero` needs `relative z-10` on its content block.** The banner above it is `position: relative`, so it paints over non-positioned siblings and swallows the overlapping logo plate. The heading also sits *below* the banner, not over it — `text-ink` on navy fails the §6.5 contrast floor.
- **AggregateRating is only emitted when approved reviews exist.** Google treats a rating with nothing behind it as a structured-data violation, and the seeded `colleges.rating` values are decorative until the first review is approved.
- **The brochure gate is dormant.** No seeded college has a `brochure_url`, so the button never renders. `/api/brochure` is complete: it stores the lead first, then mints a 60-second signed URL from the private bucket.

### P7 notes worth carrying forward

- **`CollegeCard` takes a structural `CollegeCardData`, not one query's row type.** Six different queries feed it. `/colleges` uses the wider `CollegeListCard` instead, which carries the compare checkbox — that one only works inside the `CompareProvider` on the `/colleges` subtree, so do not reuse it elsewhere.
- **Level hubs are one component, four wrappers.** `LEVEL_HUBS` in `lib/queries/taxonomy.ts` maps each hub to its `level_enum` values; the route files are three lines each. Add a hub there, not by copying a page.
- **`/city/[slug]` only prerenders cities that have a published college** — 18 of the 120 seeded ones. Prerendering all of them would ship empty pages for search engines to index.
- **A guide whose URL level does not match its row is a 404**, not a second copy of the same article at another path (§10 canonicals). Guide bodies render as plain paragraphs; a markdown renderer arrives with the blog in P9.
- **Taxonomy pages are the interlinking layer.** Every college card and the detail hero link their city to `/city/[slug]`; courses link to their stream; exams link to the courses they feed and the colleges that accept them. When adding a page, add the inbound link too — the city pages were orphaned until the crawl caught it.

### P8 notes worth carrying forward

- **`PageHeader` puts the breadcrumb separator as a *sibling* of the item, never a child.** Both render an `<li>`, and a nested `<li>` is invalid HTML that trips a hydration error on every page using the header. Caught by the browser console during P8, after it had shipped across all of P7.
- **The result view is a URL, not client state.** The wizard pushes `/college-finder?matched=1&stream=…`, and the server renders the shortlist through the existing `listColleges` — no second endpoint and no client fetch. The result view is `noindex, follow` (§10).
- **Matches relax progressively.** City → state → budget → course are dropped in that order until something matches, and the UI says plainly which preference was widened. A student who answered six questions must never see an empty page.
- **`QuickEnquiryModal` is suppressed on `/college-finder`.** It fired mid-wizard during testing. Add any future funnel route to `SUPPRESSED_PATHS`.
- **zod and sonner are imported at the call site in the wizard**, not at the top — that is the difference between 220 kB and 142 kB First Load JS. The schema is still the shared one, never re-implemented.
- **`/api/leads` merges `answers`** from the payload with the §9 `duplicate_of` pointer rather than one overwriting the other.

### P9 notes worth carrying forward

- **🔴 The legal pages are an unreviewed draft.** `/privacy-policy`, `/terms-and-conditions` and `/disclaimer` describe what this codebase actually does, which is the honest starting point, but they were written by a developer and have not been through legal review — DPDP Act 2023 obligations in particular are not addressed. They carry a visible draft banner on the page itself, driven by `draft: true` in `config/legal.ts`. Remove the flag only after a qualified review.
- **Search uses `ilike '%q%'`, not `similarity()`.** The `gin_trgm_ops` indexes from 0001 serve a contained LIKE directly; similarity ranking needs an RPC, which needs a migration we cannot apply to the live project yet. Substring matching is also what a student typing "patna" expects.
- **`components/content/prose.tsx` never uses `dangerouslySetInnerHTML`.** Editor-written `content` columns are parsed into React elements, so raw HTML in a row can never become markup. Keep it that way if the content model grows.
- **Static copy lives in `config/legal.ts`, not the database.** These are legal and editorial pages, not something a counsellor should edit from `/admin`.
- **`blogs`, `news` and `guides` are still empty.** Their routes render an honest empty state rather than placeholder posts. They come alive the moment an editor publishes in P10.
- **Footer links are the crawlable nav.** `mainNav` only reaches the mobile drawer, which is lazy-loaded and absent from server HTML — `/blogs` was unreachable for a crawler until it was added to `footerNav`. Add new top-level routes to the footer.

### P10 notes worth carrying forward

- **`/admin/[section]` is full CRUD, driven by config.** `config/admin-fields.ts` declares the editable columns per section; the same config renders the create form, the edit form and validates in `saveRow`. A caller cannot write a column the config does not declare. Add a column there, not by writing another page.
- **Uploads go through `/api/admin/upload`, service role, bucket from an allowlist.** §7 gives the buckets service-role-only write, so unlike the database routes there is no RLS behind this one — the staff check in the route *is* the boundary. `brochures` is deliberately not in the allowlist; it is private.
- **SVG uploads are refused.** `next/image` blocks remote SVG without `dangerouslyAllowSVG`, and an SVG can carry script — accepting one from any staff account to justify that flag is not a good trade.
- **Never import from `lib/queries/*` into a client component.** Those modules pull `lib/supabase/server.ts` → `next/headers` → the browser bundle breaks at runtime while `tsc` stays green. Shared constants and types go in `config/` — that is why `config/leads.ts` exists separately from `lib/queries/admin.ts`.
- **`formData.get()` returns `null`, and zod's `.optional()` only accepts `undefined`.** A missing optional field fails the whole parse. This broke sign-in entirely until `?? undefined` was added. Check every `formData.get()` feeding an optional field.
- **Admin reads and writes use the cookie-bound client, never the service role.** RLS (`is_staff()`) is the actual authorisation boundary; `requireStaff()` is a fast fail with a useful redirect, not security. Using `createAdminClient()` in an admin page would silently bypass the only check there is.
- **Roles are UI affordances, not a boundary.** RLS treats every active profile as staff and does not distinguish counsellor from editor, so `can()` hides nav and redirects — a determined counsellor could still reach a content mutation. Tighten the policies before that matters.
- **Staff accounts are created in the Supabase dashboard**, not from `/admin/users`. Creating an auth user needs the service-role key, and exposing that path to a browser session turns one compromised admin into account creation. The `on_auth_user_created` trigger writes the profile row; set the role in `profiles`.
- **CSV export masks phone numbers for the counsellor role (§15)** and prefixes any cell starting with `=`, `+`, `-` or `@` with an apostrophe so a spreadsheet does not execute it as a formula.

### P11 notes worth carrying forward

- **`siteConfig.url` falls back to Vercel's injected production domain.** `NEXT_PUBLIC_SITE_URL` was never set on Vercel, so production shipped `http://localhost:3000` for every canonical, `og:url`, `og:image` and the Organization JSON-LD `logo` — breaking indexing and every WhatsApp/Facebook share preview. `config/site.ts#resolveSiteUrl` now falls back to `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`. **Still set `NEXT_PUBLIC_SITE_URL` in Vercel once the real domain exists** — the fallback is a safety net, not the answer.
- The brand logo is one asset used everywhere: `public/logo-full.png` is the transparent master, `public/logo.webp` is what `components/site/logo.tsx` imports (header, footer, mobile drawer, 404, admin shell, admin login), `src/app/{favicon,icon,apple-icon}` are generated from its mark, and `public/logo-og.png` exists because **Satori cannot decode WebP** — the OG card needs a PNG. Regenerate all of them from the master if the logo changes.
- The OG card puts the logo on a white plaque: the wordmark is dark blue and vanishes on the navy background.

- **A root `error.tsx` ships with every route.** It is a client boundary, so anything it imports is paid for on pages that never error — importing `Button` alone cost ~12 kB site-wide. Keep it dependency-free.
- **Inline forms use `DeferredLeadForm`, buttons use `LeadDialog`.** Importing `LeadForm` eagerly pulls react-hook-form + zod (~45 kB); that is what made `/contact` 267 kB. Never import `LeadForm` directly into a page.
- **Native `<details>` and `<select>` beat the Radix equivalents here.** Swapping the filter Accordion and the sort Select for native controls took `/colleges` from 196 to 163 kB, works before hydration, and gives Android its own picker. Reach for a primitive when it needs behaviour the platform lacks, not by default.
- **`hasAnalyticsConsent()` is the real gate.** Nothing tracking-related may run before it returns true — P12's GTM loader must check it, or listen for the `careeroptics:consent` event. The finder session cookie and the admin auth session are strictly necessary and do not wait.
- **Both consent buttons carry the same visual weight** on purpose. Consent that was nudged is not consent.
- **Slugs are immutable.** A rename goes in `next.config.ts` redirects, not by editing the row — otherwise every indexed URL and inbound link breaks. The table is wired and currently holds only the legacy `/tenth`, `/twelve`, `/ug`, `/pg` paths.
- **No CSP yet.** Baseline headers are set; a full policy needs the GTM and Meta domains from P12, and a wrong CSP that blocks the site is worse than none.

## CRM (dcwcrm merged in) — phase 1 done

The consultancy CRM lives in a **separate `crm` Postgres schema inside the same
Supabase project**. Migrations `0005_crm_roles.sql` and `0006_crm_schema.sql`.

**🔴 Neither migration is applied to the live project yet.** Paste them into the
Supabase SQL Editor **separately and in that order** — `0005` only widens
`user_role`, and Postgres refuses to *use* a new enum value in the transaction
that adds it, which is the only reason it is its own file. Then add `crm` to
**Project Settings → API → Exposed schemas**, or every CRM query 404s.

Shipped: pipeline dashboard, leads list (filters, status, assignment,
follow-ups, notes, CSV export), lead detail + create/edit, students list and
detail with the payment ledger, and CSV bulk import.

- **A separate schema, not merged tables.** `courses`, `leads`, `lead_activities`
  and `sessions` exist in both products with different shapes. Reconciling four
  colliding tables would have meant rewriting the live website's queries; a
  schema keeps the site untouched. The one deliberate exception is `profiles` —
  shared, with `telecaller`/`backend`/`finance` added to `user_role`, so staff
  have one login and one role.
- **`public.push_lead_to_crm()` is the bridge** — an after-insert trigger on
  `public.leads`. Website sources (`home_hero`, `college_finder`, …) are not in
  `crm.leads.source`'s CHECK, so they fold into `metadata.website_source` and
  the row lands as `source='website'`. A counsellor sees website enquiries and
  walk-ins in one pipeline without either table changing shape.
- **Rebuilt natively, not copied.** dcwcrm is `@base-ui/react` +
  `@tanstack/react-table`; this codebase is radix/shadcn. A literal port would
  drag a second UI library and ~2,800 incompatible lines in for the leads module
  alone, and blow the §11 budget. Every CRM route is 137–143 kB.
- **Import is CSV, not xlsx.** The npm `xlsx` build dcwcrm uses (0.18.5) has open
  prototype-pollution and ReDoS advisories and SheetJS moved distribution off
  npm. `lib/csv.ts` is a small RFC 4180 reader instead. The uploaded file is
  never stored — it is re-read from the same input on commit, so a spreadsheet of
  student phone numbers never reaches Storage.
- **PostgREST `.in()` travels in the URL.** 2,000 numbers is a ~22 kB request the
  server rejects, and the swallowed error made dedupe silently do nothing while
  reporting "0 duplicates". Chunk any `.in()` built from user data, and never
  treat its error as an empty result.
- **`crm.leads.status` and `.source` are CHECK constraints, not enums** — so new
  values need no `ALTER TYPE` dance. Keep `config/crm.ts` in step with them;
  `db:verify` asserts an unknown source is rejected.
- **Money totals recompute, never increment.** `recordPayment` sums the receipts
  for the student. Incrementing `amount_paid` loses a payment whenever two
  counsellors record at the same moment, and the error compounds.
- **The service role appears exactly once in the CRM**, on the import batch
  insert, with `created_by` stamped before the write. Everything else uses the
  cookie-bound client so `crm.is_crm_staff()` RLS stays the real boundary.
- **Deferred to phase 2+ (user's call):** HRMS, associates portal, student
  portal, mentorship, litigation, dispatch, analytics, targets, push
  notifications.

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

**Components already built (P2)** — see them all on `/style-guide`:

- `components/ui`: `Button` (variants: default=red CTA, outline=blue, secondary, ghost, inverse, destructive, link; sizes sm→xl), `Badge` (default, secondary, outline, new, urgent, success, rating), `Chip` (default, solid, onDark; `asChild` for links), `Rating`, plus shadcn `Input · Label · Select · Card · Tabs · Accordion · Dialog · Sheet · Carousel · Breadcrumb · Pagination · Skeleton · Separator · Toaster(sonner)`.
- `components/site`: `Logo · SiteHeader · MobileNav · CourseChipNav · SiteFooter · MobileStickyBar · WhatsAppFab · social-icons`.

Notes: lucide-react v1 has **no brand icons** — social marks are local SVGs in `components/site/social-icons.tsx`. `Chip` with `asChild` takes exactly one element child (Radix Slot), so the remove button only exists on the `<button>` form. Tabs use `variant="line"` for the §6.1 orange active underline.

**Components added in P3** — `components/home`: `Section · ScrollRow · StreamIcon · HeroCarousel · StudyGoalCards · StatsStrip · CollegeCarousel · CollegeFinderBand · LevelCourseTabs · ExamCard · ScholarshipSection · TestimonialCarousel · WhyUs · GalleryGrid · PressStrip · FaqAccordion`; `components/college/CollegeCard` (reused by the P5 listing).

**Still to build:** `GoalCitySelector · MegaSearch` (header shells are static until `/api/search` lands) · `LeadForm · QuickEnquiryModal · CallbackWidget` (P4) · `FilterSidebar` (P5).

**A11y floor:** contrast ≥ 4.5:1, visible focus ring `ring-2 ring-brand-blue-400 ring-offset-2`, keyboard-navigable carousels, alt on every image, real labels on every field.

## §7 Database

Schema, enums and RLS policies are specified verbatim in `PRD.md` §7 — implement them there, do not restate. Key points:

- Enums: `level_enum`, `college_type`, `lead_status`, `content_status`, `user_role`.
- Public tables get `select` policies for `anon` gated on `status='published'` (or `is_active` / `is_approved`).
- `leads`, `finder_sessions`, `lead_activities`, `profiles`, `settings` get **no anon policy at all** — writes only via service role in `/api/*`.
- Storage buckets (public read, service-role write): `colleges`, `banners`, `gallery`, `blogs`, `testimonials`, `press`, `brochures`.
- Types are generated: `pnpm db:types` → `src/types/database.types.ts`. The current file is hand-authored to match the migrations; overwrite it with generated output once the project is linked, don't hand-edit it.
- `pnpm db:verify` runs the migrations and seed against PGlite and asserts the seed counts, referential integrity and RLS behaviour. Run it after touching any migration.
- Two deliberate deviations from §7's shorthand: `news` is written out in full rather than `like blogs including all` (keeps the generated types explicit), and `pg_trgm` is created alongside `pgcrypto` since the trigram indexes need it.

## §16 Phases

`P0` foundation → `P1` DB → `P2` design system → `P3` home → `P4` lead engine → `P5` listing → `P6` college detail → `P7` taxonomy pages → `P8` college finder → `P9` content + search → `P10` admin → `P11` SEO/perf/a11y → `P12` launch. One phase per session; see `PRD.md` §16 for each phase's done-criteria.

## Commands

```bash
pnpm dev        # dev server (turbopack)
pnpm build      # must pass with zero TS errors before every commit
pnpm lint
pnpm db:verify  # migrations + seed + RLS against PGlite, no Docker needed
pnpm db:push    # apply migrations to the linked Supabase project
pnpm db:types   # regenerate src/types/database.types.ts
```
