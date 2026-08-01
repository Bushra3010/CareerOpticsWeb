import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shared shell for every home section (§6.3): container, py-12 lg:py-16, the
 * blue→red heading underline and an optional "view all" link on the right.
 */
export function Section({
  id,
  title,
  description,
  action,
  tinted = false,
  className,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  tinted?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn("py-12 lg:py-16", tinted && "bg-surface", className)}
    >
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id={id ? `${id}-title` : undefined}
              className="heading-underline text-h2"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-4 max-w-2xl text-pretty text-body">
                {description}
              </p>
            ) : null}
          </div>
          {action ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-brand-blue-400 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {action.label}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
