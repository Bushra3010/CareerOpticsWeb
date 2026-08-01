import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { courseChips, courseChipsTrailing } from "@/config/nav";
import { cn } from "@/lib/utils";

/**
 * §5.1 item 3 — h-12 dark translucent bar that sits over the hero.
 * Scrolls horizontally on mobile rather than wrapping.
 */
export function CourseChipNav({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Popular courses"
      className={cn("bg-brand-blue-900/85 backdrop-blur-sm", className)}
    >
      <div className="container-site flex h-12 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {courseChips.map((item) => (
          <Chip key={item.href} variant="onDark" asChild>
            <Link href={item.href}>{item.label}</Link>
          </Chip>
        ))}

        <span className="ml-auto flex shrink-0 items-center gap-2 pl-4">
          {courseChipsTrailing.map((item) => (
            <Chip key={item.href} variant="onDark" asChild>
              <Link href={item.href}>
                {item.label}
                {item.badge ? (
                  <Badge variant="new" size="sm">
                    {item.badge}
                  </Badge>
                ) : null}
              </Link>
            </Chip>
          ))}
        </span>
      </div>
    </nav>
  );
}
