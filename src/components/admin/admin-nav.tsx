"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminNavGroup } from "@/config/admin-nav";
import { cn } from "@/lib/utils";

/** Sidebar links with the current section marked. Client only for `usePathname`. */
export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="grid gap-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1 text-sm font-semibold text-white/50">
            {group.title}
          </p>
          <ul className="grid gap-0.5">
            {group.items.map((item) => {
              // `/admin` would otherwise match every child route.
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none",
                      active
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
