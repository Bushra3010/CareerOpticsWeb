import Image from "next/image";
import Link from "next/link";

import { ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GalleryItem } from "@/lib/queries/home";
import { imageSrc } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * §5.1 item 14 — six-image mosaic with a "Show More" link to /gallery. The
 * first tile spans two columns and rows on desktop, giving the masonry look
 * without a JS layout pass.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  return (
    <>
      <ul className="grid auto-rows-[140px] grid-cols-2 gap-3 lg:auto-rows-[160px] lg:grid-cols-4">
        {items.map((item, index) => {
          const src = imageSrc(item.image_url);
          const featured = index === 0;

          return (
            <li
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-xl bg-brand-blue-50",
                featured && "col-span-2 row-span-2",
              )}
            >
              {src ? (
                <Image
                  src={src}
                  alt={item.caption ?? ""}
                  fill
                  sizes={featured ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 320px, 50vw"}
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full items-center justify-center">
                  <ImageIcon className="size-6 text-brand-blue/40" aria-hidden />
                </span>
              )}

              {item.caption ? (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-blue-900/85 to-transparent p-3 text-sm font-medium text-white">
                  {item.caption}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/gallery">Show More</Link>
        </Button>
      </div>
    </>
  );
}
