import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import logoSrc from "../../../public/logo.webp";

/** "CareerOptics Education Service" minus the name — kept derived so the two
 *  lines cannot drift apart from `siteConfig`. */
const nameSuffix = siteConfig.legalName.replace(siteConfig.name, "").trim();

/**
 * The CareerOptics mark. The supplied asset is a square stacked lockup on an
 * opaque light background, so on dark surfaces (`inverse`) it sits on a white
 * plaque rather than bleeding into the navy.
 *
 * `showName` sets the company name beside the mark. The asset already carries a
 * wordmark, but at h-12 it is only a few pixels tall and unreadable — this is
 * the legible copy. Off by default so the footer, admin and 404 lockups
 * are unchanged; the site header opts in.
 */
export function Logo({
  inverse = false,
  showName = false,
  className,
  imageClassName,
  href = "/",
  priority = false,
  onClick,
}: {
  inverse?: boolean;
  showName?: boolean;
  className?: string;
  imageClassName?: string;
  href?: string;
  priority?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={`${siteConfig.name} — home`}
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        inverse && "bg-white p-1.5",
        className,
      )}
    >
      <Image
        src={logoSrc}
        alt={`${siteConfig.name} — ${siteConfig.tagline}`}
        priority={priority}
        sizes="120px"
        className={cn("h-12 w-auto", imageClassName)}
      />

      {/* Hidden on the narrowest screens: the mobile header is already the mark
          plus the counselling CTA, and a third element crowds both.
          The link's aria-label is the accessible name, so this is not announced
          twice. */}
      {showName ? (
        <span className="ml-2.5 hidden leading-tight sm:block">
          <span className="font-display block text-lg font-extrabold tracking-tight text-brand-blue-900">
            {siteConfig.name}
          </span>
          <span className="block text-xs font-semibold tracking-wide text-brand-red uppercase">
            {nameSuffix}
          </span>
        </span>
      ) : null}
    </Link>
  );
}
