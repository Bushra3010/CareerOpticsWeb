"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { HomeFaq } from "@/lib/queries/home";

/**
 * §5.1 item 16. The FAQPage JSON-LD is emitted by the page, not here — the
 * script tag belongs in the server-rendered tree.
 */
export function FaqAccordion({ faqs }: { faqs: HomeFaq[] }) {
  return (
    <Accordion type="single" collapsible defaultValue={faqs[0]?.id}>
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger className="text-left text-base font-semibold text-ink">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-body">{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
