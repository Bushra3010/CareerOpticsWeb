"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { headerNav } from "@/config/nav";
import { cn } from "@/lib/utils";

/**
 * Desktop header links with the current page as a filled pill. Client only
 * for `usePathname`; the hash links ("Admission", "Our Facilities") are home
 * sections and never mark themselves active.
 */
export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-0.5 xl:gap-2">
        {headerNav.map((item) => {
          const active = !item.href.includes("#") && item.href === pathname;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-2.5 py-2.5 text-sm font-semibold whitespace-nowrap xl:px-4 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue-400 focus-visible:ring-offset-2 focus-visible:outline-none",
                  active
                    ? "bg-brand-blue text-white shadow-card"
                    : "text-ink hover:bg-brand-blue-50 hover:text-brand-blue",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
