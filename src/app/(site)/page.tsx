import type { Metadata } from "next";

import { CollegeCarousel } from "@/components/home/college-carousel";
import { CollegeFinderBand } from "@/components/home/college-finder-band";
import { ExamCard } from "@/components/home/exam-card";
import { FaqAccordion } from "@/components/home/faq-accordion";
import { GalleryGrid } from "@/components/home/gallery-grid";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { LevelCourseTabs } from "@/components/home/level-course-tabs";
import { PressStrip } from "@/components/home/press-strip";
import { ScholarshipSection } from "@/components/home/scholarship-section";
import { Section } from "@/components/home/section";
import { StatsStrip } from "@/components/home/stats-strip";
import { StudyGoalCards } from "@/components/home/study-goal-cards";
import { TestimonialCarousel } from "@/components/home/testimonial-carousel";
import { WhyUs } from "@/components/home/why-us";
import { CourseChipNav } from "@/components/site/course-chip-nav";
import { siteConfig } from "@/config/site";
import {
  getCoursesByLevel,
  getFeaturedColleges,
  getFeaturedScholarship,
  getGalleryItems,
  getHeroBanners,
  getHomeFaqs,
  getPressReleases,
  getSiteStats,
  getTestimonials,
  getStudyGoals,
  getUpcomingExams,
} from "@/lib/queries/home";
import { faqPageSchema, JsonLd } from "@/lib/seo/json-ld";

/** §10 — home revalidates every 5 minutes. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

/** Home — §5.1 sections 3–17. */
export default async function HomePage() {
  const [
    banners,
    goals,
    stats,
    colleges,
    levelTabs,
    exams,
    scholarship,
    testimonials,
    gallery,
    press,
    faqs,
  ] = await Promise.all([
    getHeroBanners(),
    getStudyGoals(),
    getSiteStats(),
    getFeaturedColleges(),
    getCoursesByLevel(),
    getUpcomingExams(),
    getFeaturedScholarship(),
    getTestimonials(),
    getGalleryItems(),
    getPressReleases(),
    getHomeFaqs(),
  ]);

  return (
    <>
      {/* 3 — course chip bar, then 4 — hero carousel */}
      <CourseChipNav />
      <HeroCarousel banners={banners} />

      {/* 5 — Select Your Study Goal */}
      {goals.length > 0 ? (
        <Section
          id="study-goals"
          title="Select Your Study Goal"
          description="Pick a stream to see the colleges, courses and entrance exams that lead into it."
          action={{ label: "All courses", href: "/courses" }}
        >
          <StudyGoalCards goals={goals} />
        </Section>
      ) : null}

      {/* 6 — quick stats */}
      <StatsStrip stats={stats} />

      {/* 7 — Top Universities */}
      {colleges.length > 0 ? (
        <Section
          id="top-universities"
          title="Top Universities"
          description="Institutions our counsellors place students in every admission season."
          action={{ label: "All colleges", href: "/colleges" }}
        >
          <CollegeCarousel colleges={colleges} />
        </Section>
      ) : null}

      {/* 8 — College Finder band */}
      <CollegeFinderBand />

      {/* 9 — courses by level */}
      {levelTabs.length > 0 ? (
        <Section
          id="courses-by-level"
          title="Courses By Level"
          description="Where you are now decides what you can apply for next. Start from your stage."
          tinted
        >
          <LevelCourseTabs tabs={levelTabs} />
        </Section>
      ) : null}

      {/* 10 — Top Exams */}
      {exams.length > 0 ? (
        <Section
          id="top-exams"
          title="Top Exams"
          description="Entrance exam dates, eligibility and the colleges that accept each score."
          action={{ label: "All exams", href: "/exams" }}
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {exams.map((exam) => (
              <li key={exam.id}>
                <ExamCard exam={exam} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 11 — scholarship */}
      {scholarship ? (
        <Section id="scholarship" title="Scholarships & Education Loans" tinted>
          <ScholarshipSection scholarship={scholarship} />
        </Section>
      ) : null}

      {/* 12 — Placements Given By Us */}
      {testimonials.length > 0 ? (
        <Section
          id="placements"
          title="Placements Given By Us"
          description="Students we counselled, where they studied and where they work now."
          action={{ label: "All stories", href: "/placements" }}
        >
          <TestimonialCarousel testimonials={testimonials} />
        </Section>
      ) : null}

      {/* 13 — Why We Are Best */}
      <Section
        id="why-us"
        title="Why Students Choose CareerOptics"
        tinted
      >
        <WhyUs />
      </Section>

      {/* 14 — gallery */}
      {gallery.length > 0 ? (
        <Section
          id="gallery"
          title="Gallery"
          description="Counselling camps, campus visits and admission help desks across Bihar."
        >
          <GalleryGrid items={gallery} />
        </Section>
      ) : null}

      {/* 15 — press */}
      {press.length > 0 ? (
        <Section id="press" title="Press Release" tinted>
          <PressStrip items={press} />
        </Section>
      ) : null}

      {/* 16 — FAQ + FAQPage schema */}
      {faqs.length > 0 ? (
        <Section id="faq" title="Frequently Asked Questions">
          <div className="max-w-3xl">
            <FaqAccordion faqs={faqs} />
          </div>
          <JsonLd data={faqPageSchema(faqs)} />
        </Section>
      ) : null}
    </>
  );
}
