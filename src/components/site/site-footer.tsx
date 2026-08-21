import Link from "next/link";

import { Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/site/logo";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
} from "@/components/site/social-icons";
import { footerNav, mapQuery, offices } from "@/config/nav";
import { siteConfig, telHref } from "@/config/site";

const socials = [
  { label: "Facebook", href: siteConfig.social.facebook, Icon: FacebookIcon },
  { label: "Instagram", href: siteConfig.social.instagram, Icon: InstagramIcon },
  { label: "YouTube", href: siteConfig.social.youtube, Icon: YoutubeIcon },
  { label: "LinkedIn", href: siteConfig.social.linkedin, Icon: LinkedinIcon },
];

/** §5.1 item 17 — 4 columns, office addresses, map, copyright. */
export function SiteFooter() {
  return (
    <footer className="bg-brand-blue-900 text-white/75">
      <div className="container-site py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {footerNav.map((column) => (
            <div key={column.title}>
              <h2 className="font-display text-base font-bold text-white">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-brand-amber hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="font-display text-base font-bold text-white">
              Follow Us
            </h2>
            <div className="mt-4 flex gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-11 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-brand-red focus-visible:ring-2 focus-visible:ring-brand-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue-900 focus-visible:outline-none"
                >
                  <Icon className="size-4" aria-hidden />
                </a>
              ))}
            </div>

            <div className="mt-6 space-y-2 text-sm">
              <a href={telHref} className="flex items-center gap-2 hover:text-brand-amber">
                <Phone className="size-4 shrink-0" aria-hidden />
                {siteConfig.phoneDisplay}
              </a>
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="flex items-center gap-2 hover:text-brand-amber"
              >
                <Mail className="size-4 shrink-0" aria-hidden />
                {siteConfig.supportEmail}
              </a>
            </div>
          </div>
        </div>

        {/* Offices + map */}
        <div className="mt-12 grid gap-8 border-t border-white/15 pt-8 lg:grid-cols-2">
          <div className="grid gap-6 sm:grid-cols-2">
            {offices.map((office) => (
              <div key={office.city} className="flex gap-3 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-amber" aria-hidden />
                <div>
                  <p className="font-semibold text-white">{office.city}</p>
                  <p className="mt-1">{office.address}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl">
            <iframe
              title={`${siteConfig.name} head office location`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-48 w-full border-0"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-site flex flex-wrap items-center justify-between gap-4 py-5 text-sm">
          <Logo inverse />
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
