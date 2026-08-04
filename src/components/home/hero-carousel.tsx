"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { LeadDialog } from "@/components/forms/lead-dialog";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { HeroBanner } from "@/lib/queries/home";
import { imageSrc } from "@/lib/media";

const AUTOPLAY_MS = 5000;
const COUNSELLING_LABEL = "Need Counselling";

/**
 * §5.1 item 4. The first slide is server-rendered inside this client component,
 * so the H1 and hero art are in the HTML for LCP and for crawlers — only the
 * slide behaviour is hydrated.
 */
export function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  React.useEffect(() => {
    if (!api || paused || banners.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [api, paused, banners.length]);

  if (banners.length === 0) return null;

  return (
    <section
      aria-label="Highlights"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent className="ml-0">
          {banners.map((banner, index) => (
            <HeroSlide
              key={banner.id}
              banner={banner}
              priority={index === 0}
              isFirst={index === 0}
            />
          ))}
        </CarouselContent>
      </Carousel>

      {banners.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10">
          <div className="container-site flex items-center justify-between gap-4">
            {/* Dots double as the keyboard control for the carousel. */}
            <div className="pointer-events-auto flex gap-2">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === current}
                  onClick={() => api?.scrollTo(index)}
                  className={
                    index === current
                      ? "h-2 w-6 rounded-full bg-white transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue-900 focus-visible:outline-none"
                      : "h-2 w-2 rounded-full bg-white/50 transition-all hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue-900 focus-visible:outline-none"
                  }
                />
              ))}
            </div>
            <p className="rounded-full bg-black/40 px-2.5 py-0.5 text-sm font-semibold text-white tabular-nums">
              {current + 1}/{banners.length}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function HeroSlide({
  banner,
  priority,
  isFirst,
}: {
  banner: HeroBanner;
  priority: boolean;
  isFirst: boolean;
}) {
  const src = imageSrc(banner.image_url);

  // Every slide carries the "Need Counselling" pill, and a banner row may name
  // its CTA the same thing — render the banner's link only when it adds a
  // second, different destination.
  const showBannerCta =
    Boolean(banner.cta_text && banner.cta_url) &&
    banner.cta_text!.trim().toLowerCase() !== COUNSELLING_LABEL.toLowerCase();

  return (
    <CarouselItem className="pl-0" aria-label={banner.title ?? undefined}>
      <div className="relative mx-4 h-[240px] overflow-hidden rounded-2xl bg-brand-blue-900 lg:mx-0 lg:h-[420px] lg:rounded-none">
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            priority={priority}
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="relative flex h-full flex-col items-start justify-center px-5 text-left lg:items-center lg:px-4 lg:text-center">
          {/* The banner title is the page's only h1. It is visually removed but
              kept for the document outline and search results — a home page
              with no h1 would be an SEO regression. */}
          {isFirst && banner.title ? (
            <h1 className="sr-only">{banner.title}</h1>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3 lg:mt-5 lg:justify-center">
            <LeadDialog
              source="home_hero"
              title="Get free counselling"
              description="Answer three quick fields and a counsellor will call you within 24 hours."
              fields={["city", "level", "message"]}
            >
              <Button size="lg" className="rounded-full shadow-on-photo">
                {COUNSELLING_LABEL}
              </Button>
            </LeadDialog>
            {showBannerCta ? (
              <Button
                asChild
                size="lg"
                variant="inverse"
                className="rounded-full shadow-on-photo"
              >
                <Link href={banner.cta_url!}>{banner.cta_text}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </CarouselItem>
  );
}
