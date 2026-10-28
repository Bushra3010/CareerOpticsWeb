import Image from "next/image";

import { ExternalLink } from "lucide-react";

import { ScrollRow } from "@/components/home/scroll-row";
import type { PressRelease } from "@/lib/queries/home";
import { imageSrc } from "@/lib/media";

function formatMonth(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** §5.1 item 15 — publication strip. */
export function PressStrip({ items }: { items: PressRelease[] }) {
  return (
    <ScrollRow label="Press coverage" className="items-stretch">
      {items.map((item) => {
        const src = imageSrc(item.image_url);
        const month = formatMonth(item.published_on);

        // The article if there is one, otherwise the full-size clipping.
        // §17 forbids dead links, so a card with neither is not a link.
        const href = item.article_url ?? src;
        const Wrapper = href ? "a" : "div";

        return (
          <Wrapper
            key={item.id}
            {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
            className="card-lift flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {src ? (
              <div className="relative aspect-[4/5] bg-surface">
                <Image
                  src={src}
                  alt={item.publication ?? "Newspaper clipping"}
                  fill
                  sizes="260px"
                  className="object-contain p-2"
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col gap-1 p-4">
              <span className="font-display text-sm font-bold text-ink">{item.publication}</span>
              {month ? (
                <span className="text-sm text-muted-foreground tabular-nums">{month}</span>
              ) : null}
              {href ? (
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-brand-blue-400">
                  {item.article_url ? "Read article" : "View clipping"}
                  <ExternalLink className="size-3.5" aria-hidden />
                </span>
              ) : null}
            </div>
          </Wrapper>
        );
      })}
    </ScrollRow>
  );
}
