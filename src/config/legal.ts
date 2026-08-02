import { siteConfig } from "@/config/site";
import { offices } from "@/config/nav";

/**
 * Copy for the static pages (PRD §4, §15 "legal pages live before launch").
 *
 * ⚠ The privacy policy, terms and disclaimer below are a **working draft
 * written by a developer, not a lawyer**. They describe what this codebase
 * actually does — what is collected, who it goes to, what we do not do — which
 * is the honest starting point, but they have not been reviewed by anyone
 * qualified. India's DPDP Act 2023 obligations in particular are not addressed.
 * Get them reviewed before launch. Flagged in HANDOVER §9.
 *
 * Content lives here rather than in the DB because these pages are legal and
 * editorial text, not something a counsellor should edit from /admin.
 */

const address = offices[0]?.address ?? "";

export const LEGAL_REVIEW_NOTICE =
  "This is a working draft and has not been reviewed by a legal professional.";

export type StaticPage = {
  slug: string;
  title: string;
  description: string;
  /** Rendered by `components/content/prose.tsx`. */
  body: string;
  /** Shown as a banner — set on pages that still need legal review. */
  draft?: boolean;
};

export const ABOUT: StaticPage = {
  slug: "about",
  title: "About CareerOptics",
  description:
    "Who we are, how the counselling works and why it costs students nothing.",
  body: `CareerOptics Education Service is an admission counselling service based in Arrah, Bihar. We help students find a college that matches their marks, their budget and where they are willing to live — and then we help them through the application.

## How it works

A student tells us where they are: which class they have finished, what they want to study, what their family can afford and which cities are realistic. A counsellor shortlists colleges against that, explains what each one actually offers, and stays with the student through the application and counselling rounds.

The same counsellor handles a student from the first call to admission. Nobody has to repeat their story.

## Why it is free for students

Universities pay us a commission when a student we referred takes admission. Students and parents pay us nothing — not for counselling, not for shortlisting, not for filling forms.

That model has an obvious risk: it could push a service to recommend whoever pays most. Two things we hold to because of it —

- We tell students when a cheaper or closer option is the better fit, including government colleges where our commission is nil.
- **We never collect admission fees on a college's behalf.** Every rupee a student pays goes to the university through its own official channel. If anyone asks you to pay us for a seat, that is not us.

## What we know well

We are Bihar-first. We know BCECE and UGEAC counselling, the Bihar Student Credit Card, and the state's own colleges — and we place students across India through national processes like JoSAA and NEET.

## Reaching us

Call or message ${siteConfig.phoneDisplay}. Most students prefer WhatsApp, and we answer there.

${address}`,
};

export const HELP: StaticPage = {
  slug: "help-support",
  title: "Help & Support",
  description:
    "Common questions about counselling, fees, documents and how to reach us.",
  body: `## How soon will someone call me?

A counsellor usually calls within 24 hours on working days. If you would rather have a WhatsApp message than a call, say so in the enquiry form and we will message instead.

## Does any of this cost money?

No. Counselling, shortlisting and application help are free for students and parents. Universities pay us, you do not.

## Do you collect admission or application fees?

Never. Every fee goes directly to the college or university through its own official channel. If someone claiming to be from CareerOptics asks you to transfer an admission fee to them, it is not us — call ${siteConfig.phoneDisplay} and tell us.

## Can you help with government colleges too?

Yes. We guide students through state counselling such as BCECE and UGEAC, and national processes like JoSAA and NEET, alongside private university admissions.

## What documents will I need?

It depends on the college, but almost always: Class 10 and 12 marksheets, the entrance exam scorecard if there is one, a transfer or migration certificate, a category certificate if you are claiming reservation, Aadhaar, and passport-size photographs. Your counsellor will give you the exact list for your college.

## Can you help with an education loan?

We help you check eligibility for schemes like the Bihar Student Credit Card and state scholarships, and we explain the documents each one needs. We are not a lender and we do not process loans ourselves.

## I want my enquiry deleted

Write to ${siteConfig.supportEmail} from the email you used, or call ${siteConfig.phoneDisplay}, and we will remove your details.

## Still stuck?

Call ${siteConfig.phoneDisplay} or email ${siteConfig.supportEmail}.`,
};

export const PRIVACY: StaticPage = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  description:
    "What CareerOptics collects when you submit an enquiry, who sees it and how to have it removed.",
  draft: true,
  body: `This policy describes how ${siteConfig.legalName} handles the information you give us on this website.

## What we collect

When you submit an enquiry, a callback request, a brochure request or the College Finder, we store:

- Your name and mobile number, and your email address if you give one
- What you told us you are looking for — course, level, city, budget, and any message
- The page you submitted from, and campaign parameters if you arrived from an ad
- Your IP address and browser user-agent, kept to detect automated abuse

If you submit a college review we store your name, the review text and rating, and your email address if you give one.

## Why we collect it

To have a counsellor call or message you about admissions, and to shortlist colleges against what you told us. That is the only purpose.

## Who sees it

Our own counselling staff. Where you have asked about a specific college or course, the relevant university or its admission office, so they can process your application.

We do not sell your information, and we do not share it with advertisers or data brokers.

## Where it is stored

In a Supabase (PostgreSQL) database. Enquiry alerts are emailed to our counselling team.

## How long we keep it

Enquiry records are kept while your admission is in progress and for a reasonable period afterwards for follow-up. Ask us to delete them earlier and we will.

## Cookies

We use a cookie to remember an anonymous session id if you start the College Finder, so a partly finished funnel is not lost. It contains no personal information. Analytics and advertising tags are not active on this site yet; when they are, this section will say so and a consent banner will ask you first.

## Your choices

Write to ${siteConfig.supportEmail} or call ${siteConfig.phoneDisplay} to see what we hold about you, correct it, or have it deleted.

## Children

This site is aimed at students choosing a college, including those under 18. We do not knowingly collect more than the enquiry details above from anyone.

## Changes

We will update this page when our practices change.

## Contact

${siteConfig.legalName}
${address}
${siteConfig.supportEmail} · ${siteConfig.phoneDisplay}`,
};

export const TERMS: StaticPage = {
  slug: "terms-and-conditions",
  title: "Terms & Conditions",
  description:
    "The terms on which CareerOptics provides this website and its counselling service.",
  draft: true,
  body: `These terms apply to your use of this website and the counselling service provided by ${siteConfig.legalName}.

## What we provide

Guidance. We help you shortlist colleges, understand eligibility and fees, and complete applications. **We do not grant admission.** Every admission decision belongs to the university, and no shortlist or conversation with us guarantees a seat.

## What the information here is

College fees, cut-offs, rankings, accreditation grades and placement figures on this site are collected from universities and public sources. They change, and they can be wrong. Confirm anything that matters to your decision with the university directly before you rely on it. See the [disclaimer](/disclaimer).

## Payments

We charge students nothing. Any fee for admission, tuition, hostel or application is paid by you directly to the university through its own official channel. We never collect it on a university's behalf, and we are not responsible for money paid to anyone who claims otherwise.

## Using the site

Submit accurate details — a counsellor calls the number you give. Do not submit anyone else's personal information, and do not use automated tools to scrape or flood our forms.

## Reviews you submit

Reviews are published only after our editors check them, and we may decline or remove one that is abusive, defamatory or not from a genuine student. By submitting a review you allow us to publish it on this site.

## Our content

The text, design and compiled listings on this site belong to ${siteConfig.legalName}. College names, logos and trademarks belong to their institutions.

## Liability

We provide guidance in good faith and do not accept liability for admission decisions made by universities, for changes in fees or dates, or for losses arising from information on this site that a university later contradicts.

## Governing law

These terms are governed by the laws of India, with courts at Arrah, Bihar having jurisdiction.

## Contact

${siteConfig.supportEmail} · ${siteConfig.phoneDisplay}`,
};

export const DISCLAIMER: StaticPage = {
  slug: "disclaimer",
  title: "Disclaimer",
  description:
    "Where the college information on this site comes from and its limits.",
  draft: true,
  body: `## College information is indicative

Fees, cut-offs, seat counts, NAAC grades, NIRF ranks, placement packages and course lists on this site are compiled from university websites, public notifications and our own counselling work. They change through the year and can be out of date or incorrect.

**Confirm any figure that affects your decision with the university directly.** We do not accept liability for a decision made on the basis of a number on this page that the university later contradicts.

## Placement figures

Where a highest or average package is shown, it is a figure published for a past cohort by that institution. It describes what some students received, not what any individual student will receive.

## Rankings and accreditation

NIRF ranks and NAAC grades are awarded by their respective bodies for a specific year and programme scope. We show them for orientation, not as an endorsement.

## No affiliation

We are an independent counselling service. Listing a college here does not mean it endorses us, and university names and logos remain the property of their institutions.

## Reviews

Reviews are the opinions of the students who wrote them, published after a basic check. They are not our assessment of an institution.

## External links

We link to official university and exam board websites. We do not control those sites and are not responsible for their content.

## Questions

${siteConfig.supportEmail} · ${siteConfig.phoneDisplay}`,
};

export const STATIC_PAGES: StaticPage[] = [
  ABOUT,
  HELP,
  PRIVACY,
  TERMS,
  DISCLAIMER,
];
