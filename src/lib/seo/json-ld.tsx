/**
 * Renders a JSON-LD block (§10). Kept in a server component so structured data
 * is present in the initial HTML for crawlers.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is our own DB content, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * §10 — Organization and WebSite + SearchAction, emitted once from the root
 * layout so every page carries the site-level graph.
 */
export function organizationSchema(site: {
  name: string;
  legalName: string;
  url: string;
  phone: string;
  supportEmail: string;
  social: Record<string, string>;
}, address: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.legalName,
    alternateName: site.name,
    url: site.url,
    logo: new URL("/logo.webp", site.url).toString(),
    email: site.supportEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: site.phone,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    },
    sameAs: Object.values(site.social),
  };
}

export function webSiteSchema(site: { name: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: new URL("/search?q={search_term_string}", site.url).toString(),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** §10 — BreadcrumbList. Paths are absolute so the graph resolves. */
export function breadcrumbSchema(
  crumbs: { name: string; path: string }[],
  siteUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: new URL(crumb.path, siteUrl).toString(),
    })),
  };
}

/**
 * §10 — CollegeOrUniversity with AggregateRating.
 *
 * The rating block is emitted **only** when approved reviews exist. Google
 * treats an AggregateRating with no reviews behind it as a structured-data
 * violation, and the seeded `colleges.rating` values are decorative until the
 * first review is approved.
 */
export function collegeSchema(
  college: {
    name: string;
    slug: string;
    about: string | null;
    website: string | null;
    logo_url: string | null;
    address: string | null;
    rating: number | null;
    review_count: number | null;
    cities?: { name: string; states?: { name: string } | null } | null;
  },
  siteUrl: string,
) {
  const hasReviews = (college.review_count ?? 0) > 0 && (college.rating ?? 0) > 0;

  return {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: college.name,
    url: new URL(`/colleges/${college.slug}`, siteUrl).toString(),
    ...(college.about ? { description: college.about } : {}),
    ...(college.website ? { sameAs: [college.website] } : {}),
    ...(college.logo_url ? { logo: college.logo_url } : {}),
    ...(college.address || college.cities
      ? {
          address: {
            "@type": "PostalAddress",
            ...(college.address ? { streetAddress: college.address } : {}),
            ...(college.cities?.name ? { addressLocality: college.cities.name } : {}),
            ...(college.cities?.states?.name
              ? { addressRegion: college.cities.states.name }
              : {}),
            addressCountry: "IN",
          },
        }
      : {}),
    ...(hasReviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(college.rating),
            reviewCount: college.review_count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/** §10 — FAQPage, emitted by any page that renders an FAQ accordion. */
export function faqPageSchema(
  faqs: { question: string | null; answer: string | null }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs
      .filter((faq) => faq.question && faq.answer)
      .map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
  };
}
