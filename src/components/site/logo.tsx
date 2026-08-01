import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import logoSrc from "../../../public/logo.webp";

/**
 * The CareerOptics mark. The supplied asset is a square stacked lockup on an
 * opaque light background, so on dark surfaces (`inverse`) it sits on a white
 * plaque rather than bleeding into the navy.
 */
export function Logo({
  inverse = false,
  className,
  imageClassName,
  href = "/",
  priority = false,
  onClick,
}: {
  inverse?: boolean;
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
    </Link>
  );
}
