/**
 * Global site configuration — PRD §1, §12.
 * Contact details come from env so they can differ per environment without a rebuild.
 */
export const siteConfig = {
  name: "CareerOptics",
  legalName: "CareerOptics Education Service",
  tagline: "Your career. Our guidance.",
  description:
    "Discover colleges, courses and exams across India. Free admission counselling for students after 10th, 12th, graduation and post-graduation.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_IN",
  /** E.164, used for tel: and wa.me links. */
  phone: process.env.NEXT_PUBLIC_PHONE ?? "+918252532179",
  /** How the number is shown to users. */
  phoneDisplay: "+91 82525 32179",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918252532179",
  leadEmail: "leads@careeroptics.in",
  supportEmail: "info@careeroptics.in",
  social: {
    facebook: "https://facebook.com/careeroptics",
    instagram: "https://instagram.com/careeroptics",
    youtube: "https://youtube.com/@careeroptics",
    linkedin: "https://linkedin.com/company/careeroptics",
  },
} as const;

/** `tel:` href for click-to-call CTAs. */
export const telHref = `tel:${siteConfig.phone}`;

/** `wa.me` deep link with an optional prefilled message. */
export function whatsappHref(message?: string) {
  const base = `https://wa.me/${siteConfig.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export type SiteConfig = typeof siteConfig;
