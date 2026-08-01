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
