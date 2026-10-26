"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavGroup = {
  title: string;
  items: { label: string; href: string }[];
};

/** Sidebar links with the current section marked. Client only for `usePathname`. */
export function AdminNav({
  groups,
  label = "Admin",
}: {
  groups: NavGroup[];
  label?: string;
}) {
  const pathname = usePathname();

  /**
   * Exactly one item is active: the longest href the current path sits under.
   *
   * Comparing on a path boundary stops a false prefix match (/admin/news
   * lighting up for /admin/newsletters); taking the longest match keeps a
   * nested page from lighting up its parent too.
   */
  const active = groups
    .flatMap((group) => group.items)
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label={label} className="grid gap-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1 text-sm font-semibold text-white/50">
            {group.title}
          </p>
          <ul className="grid gap-0.5">
            {group.items.map((item) => {
              const isActive = item.href === active;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none",
                      isActive
                        ? "bg-white/15 font-semibold text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
