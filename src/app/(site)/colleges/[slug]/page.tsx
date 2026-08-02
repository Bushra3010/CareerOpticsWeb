import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Check, ImageIcon } from "lucide-react";

import { CollegeActionBar } from "@/components/college/college-action-bar";
import { CollegeHero } from "@/components/college/college-hero";
import { CollegeSideRail } from "@/components/college/college-side-rail";
import { CollegeTabNav } from "@/components/college/college-tab-nav";
import { CoursesFeesTable } from "@/components/college/courses-fees-table";
import { ReviewSubmission } from "@/components/college/review-submission";
import { ReviewList } from "@/components/college/review-list";
import { FaqAccordion } from "@/components/home/faq-accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { siteConfig } from "@/config/site";
import {
  getApprovedReviews,
  getCollegeBySlug,
  getCollegeCourses,
  getCollegeFaqs,
  getCollegeGallery,
  getFeaturedCollegeSlugs,
  getSimilarColleges,
  type College,
} from "@/lib/queries/college-detail";
import { formatInr, imageSrc } from "@/lib/media";
import {
  breadcrumbSchema,
  collegeSchema,
  faqPageSchema,
  JsonLd,
} from "@/lib/seo/json-ld";

/** §5.3 / §10 — colleges revalidate hourly. */
export const revalidate = 3600;

/**
 * Featured colleges are pre-rendered; the rest are generated on first request
 * and then cached by ISR (§5.3).
 */
export async function generateStaticParams() {
  const slugs = await getFeaturedCollegeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const college = await getCollegeBySlug(slug);
  if (!college) return { title: "College not found" };

  const location = college.cities?.name;
  // §10: fall back to the templated string when the row has no meta of its own.
  const title =
    college.meta_title ??
    `${college.name} - Courses, Fees, Admission 2026 | ${siteConfig.name}`;
  const description =
    college.meta_description ??
    `${college.name}${location ? ` in ${location}` : ""} — courses, fees, eligibility, placements and admission process. Get free counselling from ${siteConfig.name}.`;

  return {
    // `absolute` bypasses the root layout's "%s | CareerOptics" template — the
    // §10 fallback string already ends in the site name.
    title: { absolute: title },
    description,
    alternates: { canonical: `/colleges/${college.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      // §10 — dynamic OG card so a WhatsApp share shows the college, not a
      // generic banner. 85% of this traffic shares links on WhatsApp (§15).
      images: [{ url: `/api/og/${college.slug}`, width: 1200, height: 630 }],
    },
  };
}

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const college = await getCollegeBySlug(slug);
  if (!college) notFound();

  const [courses, gallery, reviews, faqs, similar] = await Promise.all([
    getCollegeCourses(college.id),
    getCollegeGallery(college.id),
    getApprovedReviews(college.id),
    getCollegeFaqs(college.id),
    getSimilarColleges(college, college.cities?.states?.slug ?? null),
  ]);

  const shortName = college.short_name ?? college.name;

  // The tab nav must only list sections that actually render, or it scroll-spies
  // onto anchors that do not exist.
  const sections = [
    { id: "overview", label: "Overview", show: true },
    { id: "courses", label: "Courses & Fees", show: true },
    { id: "admission", label: "Admission", show: Boolean(college.admission_process) },
    {
      id: "placement",
      label: "Placement",
      show: Boolean(college.highest_package || college.average_package),
    },
    {
      id: "facilities",
      label: "Facilities",
      show: (college.facilities ?? []).length > 0,
    },
    { id: "gallery", label: "Gallery", show: gallery.length > 0 },
    { id: "reviews", label: "Reviews", show: true },
    { id: "faq", label: "FAQ", show: faqs.length > 0 },
  ].filter((section) => section.show);

  return (
    <>
      <CollegeHero college={college} />
      <CollegeActionBar college={college} />
      <CollegeTabNav sections={sections.map(({ id, label }) => ({ id, label }))} />

      <div className="container-site py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/colleges">Colleges</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{shortName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="container-site flex gap-8 pb-12 lg:pb-16">
        <div className="min-w-0 flex-1">
          <Section id="overview" title={`About ${shortName}`}>
            {college.about ? (
              <p className="text-pretty text-body">{college.about}</p>
            ) : null}
            {college.why_choose ? (
              <>
                <h3 className="mt-6 text-h3">Why choose {shortName}</h3>
                <p className="mt-2 text-pretty text-body">{college.why_choose}</p>
              </>
            ) : null}
            <Highlights college={college} />
          </Section>

          <Section id="courses" title="Courses & Fees">
            <CoursesFeesTable
              courses={courses}
              collegeId={college.id}
              collegeName={shortName}
            />
          </Section>

          {college.admission_process ? (
            <Section id="admission" title="Admission Process">
              <p className="text-pretty text-body">{college.admission_process}</p>
            </Section>
          ) : null}

          {college.highest_package || college.average_package ? (
            <Section id="placement" title="Placements">
              <dl className="grid gap-4 sm:grid-cols-2">
                {college.highest_package ? (
                  <PackageStat
                    label="Highest package"
                    value={formatInr(college.highest_package)!}
                  />
                ) : null}
                {college.average_package ? (
                  <PackageStat
                    label="Average package"
                    value={formatInr(college.average_package)!}
                  />
                ) : null}
              </dl>
            </Section>
          ) : null}

          {(college.facilities ?? []).length > 0 ? (
            <Section id="facilities" title="Campus & Facilities">
              {college.campus_size ? (
                <p className="text-body">Campus size: {college.campus_size}</p>
              ) : null}
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(college.facilities ?? []).map((facility) => (
                  <li key={facility} className="flex items-center gap-2 text-body">
                    <Check className="size-4 shrink-0 text-success" aria-hidden />
                    {facility}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {gallery.length > 0 ? (
            <Section id="gallery" title="Gallery">
              <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {gallery.map((item) => {
                  const src = imageSrc(item.image_url);
                  return (
                    <li
                      key={item.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-blue-50"
                    >
                      {src ? (
                        <Image
                          src={src}
                          alt={item.caption ?? ""}
                          fill
                          sizes="(min-width: 1024px) 320px, 50vw"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center">
                          <ImageIcon className="size-6 text-brand-blue/40" aria-hidden />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>
          ) : null}

          <Section id="reviews" title={`Reviews of ${shortName}`}>
            <ReviewList reviews={reviews} />
            <div className="mt-6">
              <ReviewSubmission collegeId={college.id} collegeName={shortName} />
            </div>
          </Section>

          {faqs.length > 0 ? (
            <Section id="faq" title="Frequently Asked Questions">
              <FaqAccordion faqs={faqs} />
              <JsonLd data={faqPageSchema(faqs)} />
            </Section>
          ) : null}
        </div>

        <aside className="hidden w-[320px] shrink-0 lg:block">
          <CollegeSideRail
            collegeId={college.id}
            collegeName={shortName}
            similar={similar}
          />
        </aside>
      </div>

      <JsonLd data={collegeSchema(college, siteConfig.url)} />
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Home", path: "/" },
            { name: "Colleges", path: "/colleges" },
            { name: college.name, path: `/colleges/${college.slug}` },
          ],
          siteConfig.url,
        )}
      />
    </>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    // scroll-mt clears the sticky header and tab nav when an anchor is followed.
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 py-6">
      <h2 id={`${id}-title`} className="heading-underline text-h2">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Highlights({ college }: { college: College }) {
  const items = [
    college.established_year && { label: "Established", value: String(college.established_year) },
    college.naac_grade && { label: "NAAC grade", value: college.naac_grade },
    college.nirf_rank && { label: "NIRF rank", value: `#${college.nirf_rank}` },
    college.campus_size && { label: "Campus", value: college.campus_size },
    college.total_students && {
      label: "Students",
      value: college.total_students.toLocaleString("en-IN"),
    },
    college.type && { label: "Type", value: college.type },
  ].filter(Boolean) as { label: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-surface p-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 font-semibold text-ink capitalize tabular-nums">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PackageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-h2 text-brand-blue tabular-nums">
        {value}
      </dd>
    </div>
  );
}
