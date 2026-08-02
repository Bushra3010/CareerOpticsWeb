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
  titleAccent,
  description,
  action,
  actionStyle = "link",
  tinted = false,
  className,
  children,
}: {
  id?: string;
  title: string;
  /** Trailing words rendered in brand blue, e.g. "Select Your" + "Study Goal". */
  titleAccent?: string;
  description?: string;
  action?: { label: string; href: string };
  /** "button" renders the action as a raised white pill instead of a text link. */
  actionStyle?: "link" | "button";
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
              {titleAccent ? (
                <>
                  {" "}
                  <span className="text-brand-blue-400">{titleAccent}</span>
                </>
              ) : null}
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
              className={cn(
                "inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-400 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                actionStyle === "button"
                  ? "h-11 gap-2 rounded-full border bg-white px-5 shadow-card transition-shadow hover:shadow-card-hover"
                  : "rounded-lg hover:underline",
              )}
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
