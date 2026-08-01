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

        // §17 forbids dead links, so an item without an article URL renders as
        // a plain card rather than an anchor to nowhere.
        const Wrapper = item.article_url ? "a" : "div";

        return (
          <Wrapper
            key={item.id}
            {...(item.article_url
              ? {
                  href: item.article_url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                }
              : {})}
            className="card-lift flex w-[220px] shrink-0 snap-start flex-col items-center gap-2 rounded-xl border bg-card p-5 text-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {src ? (
              <Image
                src={src}
                alt={item.publication ?? "Publication"}
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <span className="font-display text-h3 text-brand-blue-900">
                {item.publication}
              </span>
            )}
            {month ? (
              <span className="text-sm text-muted-foreground tabular-nums">
                {month}
              </span>
            ) : null}
            {item.article_url ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-400">
                Read article
                <ExternalLink className="size-3.5" aria-hidden />
              </span>
            ) : null}
          </Wrapper>
        );
      })}
    </ScrollRow>
  );
}
